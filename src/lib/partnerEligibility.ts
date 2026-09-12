import { getAdminDb } from "@/lib/firebase-admin";
import { deriveOnboardingState, type OnboardingState } from "@/lib/onboarding-steps";

/**
 * Authoritative, server-only decision on whether a mobile number may receive
 * an OTP — for partner login or for new-partner onboarding.
 *
 * Called before any OTP is generated so an unregistered / suspended number
 * never triggers a message.
 */

export interface PartnerEligibilityResult {
  eligible: boolean;
  mode: "login" | "onboarding";
  status: "not_registered" | "approved" | "under_review" | "submitted" | "draft" | "blocked" | "rejected" | "not_approved";
  reason?: "NOT_REGISTERED" | "NOT_APPROVED" | "ALREADY_APPROVED" | "ALREADY_SUBMITTED" | "BLOCKED" | "VALID";
  message: string;
  marathiMessage: string;
  redirectUrl?: string;
  dsaCode?: string;
  applicationId?: string;
  partnerName?: string;
  /** Present on eligible login checks so the client can resume the exact step. */
  onboardingState?: OnboardingState;
}

/** Statuses that mean "registered, but this account cannot sign in yet". */
const NOT_APPROVED_STATUSES = ["pending", "inactive", "on_hold", "onhold", "deactivated", "disabled"];

export async function checkPartnerEligibility(
  cleanPhone: string,
  mode: "login" | "onboarding"
): Promise<PartnerEligibilityResult> {
  let partnerData: any = null;
  let userData: any = null;
  let appData: any = null;

  try {
    const db = getAdminDb();
    if (db) {
      /**
       * Every lookup goes out at once.
       *
       * These ran one after another, each awaiting the last, and against Mongo
       * Atlas the six serialized round trips pushed the OTP route past its
       * function timeout — the caller was killed after the OTP had been stored
       * but before Meta was ever called. They are independent reads, so the
       * cost is now one round trip instead of six. The id lookup and the field
       * query for a collection race together; the id result still wins.
       */
      const firstMatch = (...snaps: any[]) => {
        for (const snap of snaps) {
          if (!snap) continue;
          if (snap.exists) return snap.data();
          if (snap.empty === false && snap.docs?.length) return snap.docs[0].data();
        }
        return null;
      };

      const settled = <T>(p: Promise<T>) => p.catch(() => null);
      const [
        partnerById,
        partnerByMobile,
        partnerByPhoneWithPrefix,
        userById,
        userByPhone,
        userByPhoneWithPrefix,
        userByMobile,
        userByMobileWithPrefix,
        appById,
        appByMobile,
        appByMobileWithPrefix,
      ] = await Promise.all([
        settled(db.collection("partners").doc(cleanPhone).get()),
        settled(db.collection("partners").where("mobileNumber", "==", cleanPhone).limit(1).get()),
        settled(db.collection("partners").where("phoneNumber", "==", "+91" + cleanPhone).limit(1).get()),
        settled(db.collection("users").doc(cleanPhone).get()),
        settled(db.collection("users").where("phoneNumber", "==", cleanPhone).limit(1).get()),
        settled(db.collection("users").where("phoneNumber", "==", "+91" + cleanPhone).limit(1).get()),
        settled(db.collection("users").where("mobileNumber", "==", cleanPhone).limit(1).get()),
        settled(db.collection("users").where("mobileNumber", "==", "+91" + cleanPhone).limit(1).get()),
        settled(db.collection("partner_applications").doc(cleanPhone).get()),
        settled(db.collection("partner_applications").where("mobileNumber", "==", cleanPhone).limit(1).get()),
        settled(db.collection("partner_applications").where("mobileNumber", "==", "+91" + cleanPhone).limit(1).get()),
      ]);

      // 1. 'partners' collection (approved DSA partners)
      partnerData = firstMatch(partnerById, partnerByMobile, partnerByPhoneWithPrefix);
      // 2. 'users' collection — phoneNumber is checked before mobileNumber, as before
      userData = firstMatch(userById, userByPhone, userByPhoneWithPrefix, userByMobile, userByMobileWithPrefix);
      // 3. 'partner_applications' collection
      appData = firstMatch(appById, appByMobile, appByMobileWithPrefix);
    }
  } catch (err) {
    console.warn("checkPartnerEligibility fallback (database not accessible):", err);
  }

  // Determine aggregate status
  const partnerStatus = String(partnerData?.status || partnerData?.partnerStatus || "").toLowerCase();
  const userStatus = String(userData?.dsaStatus || userData?.status || "").toLowerCase();
  const appStatus = String(appData?.status || "").toLowerCase();

  const isApproved =
    partnerStatus === "active" ||
    partnerStatus === "approved" ||
    userStatus === "active" ||
    userStatus === "approved" ||
    appStatus === "approved";

  const isBlocked =
    partnerStatus === "blocked" ||
    partnerStatus === "suspended" ||
    partnerStatus === "rejected" ||
    userStatus === "blocked" ||
    userStatus === "suspended" ||
    appStatus === "rejected" ||
    appStatus === "blocked";

  const isUnderReview =
    !isApproved &&
    !isBlocked &&
    (appStatus === "under_review" ||
      appStatus === "submitted" ||
      appStatus === "submitted_for_review" ||
      partnerStatus === "pending" ||
      userStatus === "pending" ||
      Boolean(appData?.submittedAt) ||
      Boolean(appData?.isApplicationLocked));

  const isDraft = !isApproved && !isBlocked && !isUnderReview && Boolean(appData || userData);

  const dsaCode = partnerData?.dsaCode || userData?.dsaCode || appData?.dsaCode || "";
  const applicationId = appData?.applicationId || partnerData?.applicationId || `TSM-DSA-${cleanPhone}`;
  const partnerName = userData?.fullName || appData?.fullName || partnerData?.name || appData?.contactPersonName || "";

  const onboardingState = deriveOnboardingState(appData, {
    mobileVerified: Boolean(appData?.mobileVerified || userData?.mobileVerified),
  });

  // ─── ELIGIBILITY LOGIC FOR LOGIN ───
  if (mode === "login") {
    // Check if user is blocked
    if (isBlocked) {
      return {
        eligible: false,
        mode: "login",
        status: "blocked",
        reason: "BLOCKED",
        message: "Your partner account or application has been suspended/rejected. Please contact partner support at 095790 05645.",
        marathiMessage: "तुमचे पार्टनर खाते किंवा अर्ज नामंजूर/निलंबित करण्यात आला आहे. कृपया मदतीसाठी 095790 05645 वर संपर्क साधा.",
      };
    }

    // Check if user is not registered at all
    if (!partnerData && !userData && !appData) {
      return {
        eligible: false,
        mode: "login",
        status: "not_registered",
        reason: "NOT_REGISTERED",
        message: "This mobile number is not registered as a DSA partner. Please complete partner registration first.",
        marathiMessage: "हा मोबाईल नंबर पार्टनर पोर्टलवर नोंदणीकृत नाही. कृपया प्रथम नवीन पार्टनर म्हणून नोंदणी (Register) करा.",
        redirectUrl: `/onboarding?mobile=${cleanPhone}`,
      };
    }

    // If approved partner -> Login and redirect to partner dashboard
    if (isApproved) {
      return {
        eligible: true,
        mode: "login",
        status: "approved",
        reason: "VALID",
        message: "Mobile number verified and eligible for partner login.",
        marathiMessage: "मोबाईल नंबर पात्र असून पार्टनर लॉगिनसाठी OTP पाठवला जात आहे.",
        dsaCode,
        partnerName,
        redirectUrl: "/partner",
        onboardingState,
      };
    }

    // If application is under review or pending -> Login is allowed so they can track status
    if (isUnderReview) {
      return {
        eligible: true,
        mode: "login",
        status: "under_review",
        reason: "VALID",
        message: "Your application is under compliance review. Log in to track your live status.",
        marathiMessage: "तुमचा अर्ज पडताळणी अंतर्गत आहे. तुम्ही स्टेटस ट्रॅक करण्यासाठी लॉगिन करू शकता.",
        applicationId,
        redirectUrl: `/application-status?id=${applicationId}`,
        onboardingState,
      };
    }

    // If draft onboarding -> Login allowed so they can resume
    return {
      eligible: true,
      mode: "login",
      status: "draft",
      reason: "VALID",
      message: "Your partner onboarding is incomplete. Log in to resume from where you left off.",
      marathiMessage: "तुमची पार्टनर नोंदणी अपूर्ण आहे. लॉगिन केल्यावर तुम्ही थांबलात तिथूनच पुढे सुरू करू शकता.",
      redirectUrl: "/onboarding",
      applicationId,
      partnerName,
      onboardingState,
    };
  }

  // ─── ELIGIBILITY LOGIC FOR ONBOARDING (NEW REGISTRATION) ───
  if (mode === "onboarding") {
    // Case 1: Already approved partner
    if (isApproved) {
      return {
        eligible: false,
        mode: "onboarding",
        status: "approved",
        reason: "ALREADY_APPROVED",
        message: `You are already an approved DSA Partner (DSA Code: ${dsaCode || "Active"}). Please log in directly.`,
        marathiMessage: `हा मोबाईल नंबर आधीच अधिकृत DSA Partner म्हणून मंजूर आहे! (DSA Code: ${dsaCode || "Active"}). कृपया थेट लॉगिन करा.`,
        dsaCode,
        redirectUrl: `/partner/login?mobile=${cleanPhone}`,
        actionText: "Log In Directly (लॉगिन करा) →",
      };
    }

    // Case 2: Already submitted and locked / under review
    if (isUnderReview) {
      return {
        eligible: false,
        mode: "onboarding",
        status: "under_review",
        reason: "ALREADY_SUBMITTED",
        message: `Your DSA Partner application has already been submitted and is under compliance review (ID: ${applicationId}).`,
        marathiMessage: `तुमचा DSA Partner अर्ज आधीच सबमिट झालेला असून तो पडताळणी अंतर्गत (Under Review) आहे. (Application ID: ${applicationId}). कृपया स्टेटस तपासा.`,
        applicationId,
        redirectUrl: `/application-status?id=${applicationId}`,
        actionText: "Track Application Status (स्टेटस तपासा) →",
      };
    }

    // Case 3: Blocked or blacklisted
    if (isBlocked) {
      return {
        eligible: false,
        mode: "onboarding",
        status: "blocked",
        reason: "BLOCKED",
        message: "This mobile number is not eligible for partner onboarding. Please contact support at 095790 05645.",
        marathiMessage: "हा मोबाईल नंबर नवीन पार्टनर नोंदणीसाठी पात्र नाही. कृपया मदतीसाठी 095790 05645 वर संपर्क साधा.",
      };
    }

    // Case 4: Eligible for onboarding (new number or incomplete draft).
    // An existing draft is resumed — never duplicated.
    return {
      eligible: true,
      mode: "onboarding",
      status: isDraft ? "draft" : "not_registered",
      reason: "VALID",
      message: isDraft
        ? "Existing onboarding found. You will continue from your last completed step."
        : "Mobile number is eligible for partner onboarding.",
      marathiMessage: isDraft
        ? "तुमची अपूर्ण नोंदणी सापडली आहे. तुम्ही थांबलात तिथूनच पुढे सुरू होईल."
        : "मोबाईल नंबर नवीन पार्टनर नोंदणीसाठी पात्र आहे.",
      applicationId: isDraft ? applicationId : undefined,
      onboardingState: isDraft ? onboardingState : undefined,
    };
  }

  return {
    eligible: true,
    mode,
    status: "not_registered",
    reason: "VALID",
    message: "Eligible",
    marathiMessage: "पात्र",
  };
}

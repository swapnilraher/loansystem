import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export interface PartnerEligibilityResult {
  eligible: boolean;
  mode: "login" | "onboarding";
  status: "not_registered" | "approved" | "under_review" | "submitted" | "draft" | "blocked" | "rejected";
  reason?: "NOT_REGISTERED" | "ALREADY_APPROVED" | "ALREADY_SUBMITTED" | "BLOCKED" | "VALID";
  message: string;
  marathiMessage: string;
  redirectUrl?: string;
  dsaCode?: string;
  applicationId?: string;
  partnerName?: string;
}

export async function checkPartnerEligibility(cleanPhone: string, mode: "login" | "onboarding"): Promise<PartnerEligibilityResult> {
  let partnerData: any = null;
  let userData: any = null;
  let appData: any = null;

  try {
    const db = getAdminDb();
    if (db) {
      // 1. Check in 'partners' collection (approved DSA partners)
      const partnerDoc = await db.collection("partners").doc(cleanPhone).get();
      partnerData = partnerDoc.exists ? partnerDoc.data() : null;

      if (!partnerData) {
        const pQ = await db.collection("partners").where("mobileNumber", "==", cleanPhone).limit(1).get();
        if (!pQ.empty) {
          partnerData = pQ.docs[0].data();
        }
      }

      // 2. Check in 'users' collection
      const userDoc = await db.collection("users").doc(cleanPhone).get();
      userData = userDoc.exists ? userDoc.data() : null;

      if (!userData) {
        const uQ = await db.collection("users").where("phoneNumber", "==", cleanPhone).limit(1).get();
        if (!uQ.empty) {
          userData = uQ.docs[0].data();
        } else {
          const uQ2 = await db.collection("users").where("mobileNumber", "==", cleanPhone).limit(1).get();
          if (!uQ2.empty) {
            userData = uQ2.docs[0].data();
          }
        }
      }

      // 3. Check in 'partner_applications' collection
      const appDoc = await db.collection("partner_applications").doc(cleanPhone).get();
      appData = appDoc.exists ? appDoc.data() : null;

      if (!appData) {
        const aQ = await db.collection("partner_applications").where("mobileNumber", "==", cleanPhone).limit(1).get();
        if (!aQ.empty) {
          appData = aQ.docs[0].data();
        }
      }
    }
  } catch (err) {
    console.warn("checkPartnerEligibility fallback (Firestore not accessible):", err);
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
      Boolean(appData?.submittedAt) ||
      Boolean(appData?.isApplicationLocked));

  const isDraft = !isApproved && !isBlocked && !isUnderReview && Boolean(appData || userData);

  const dsaCode = partnerData?.dsaCode || userData?.dsaCode || appData?.dsaCode || "";
  const applicationId = appData?.applicationId || partnerData?.applicationId || `TSM-DSA-${cleanPhone}`;
  const partnerName = userData?.fullName || appData?.fullName || partnerData?.name || appData?.contactPersonName || "";

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

    // If only an unsubmitted draft exists
    if (isDraft && (!appData?.submittedAt && appStatus !== "under_review" && appStatus !== "approved")) {
      return {
        eligible: false,
        mode: "login",
        status: "draft",
        reason: "NOT_REGISTERED",
        message: "Your partner onboarding registration is incomplete. Please finish onboarding to log in.",
        marathiMessage: "तुमची पार्टनर नोंदणी अद्याप अपूर्ण आहे. कृपया लॉगिन करण्यासाठी प्रथम ऑनबोर्डिंग पूर्ण करा.",
        redirectUrl: `/onboarding?mobile=${cleanPhone}`,
      };
    }

    // If application is under review
    if (isUnderReview) {
      return {
        eligible: true,
        mode: "login",
        status: "under_review",
        reason: "VALID",
        message: "Your application is under compliance review. You can log in to track your live status.",
        marathiMessage: "तुमचा अर्ज पडताळणी अंतर्गत आहे. तुम्ही स्टेटस ट्रॅक करण्यासाठी लॉगिन करू शकता.",
        applicationId,
        redirectUrl: `/application-status?id=${applicationId}`,
      };
    }

    // If approved partner
    return {
      eligible: true,
      mode: "login",
      status: "approved",
      reason: "VALID",
      message: "Mobile number verified and eligible for partner login.",
      marathiMessage: "मोबाईल नंबर पात्र असून पार्टनर लॉगिनसाठी OTP पाठवला जात आहे.",
      dsaCode,
      partnerName,
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

    // Case 4: Eligible for onboarding (new number or incomplete draft)
    return {
      eligible: true,
      mode: "onboarding",
      status: isDraft ? "draft" : "not_registered",
      reason: "VALID",
      message: "Mobile number is eligible for partner onboarding.",
      marathiMessage: "मोबाईल नंबर नवीन पार्टनर नोंदणीसाठी पात्र आहे.",
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile") || searchParams.get("phoneNumber") || "";
    const mode = (searchParams.get("mode") || "onboarding") as "login" | "onboarding";
    const cleanPhone = String(mobile).replace(/\D/g, "").slice(-10);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { eligible: false, error: "Valid 10-digit Indian mobile number is required" },
        { status: 400 }
      );
    }

    const result = await checkPartnerEligibility(cleanPhone, mode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Partner eligibility check error:", error);
    return NextResponse.json(
      { eligible: false, error: "Failed to check partner eligibility" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanPhone = String(body.phoneNumber || body.mobile || "").replace(/\D/g, "").slice(-10);
    const mode = (body.mode || (body.isLogin ? "login" : "onboarding")) as "login" | "onboarding";

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { eligible: false, error: "Valid 10-digit Indian mobile number is required" },
        { status: 400 }
      );
    }

    const result = await checkPartnerEligibility(cleanPhone, mode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Partner eligibility check error:", error);
    return NextResponse.json(
      { eligible: false, error: "Failed to check partner eligibility" },
      { status: 500 }
    );
  }
}

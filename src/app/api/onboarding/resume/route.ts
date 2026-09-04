import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { deriveOnboardingState } from "@/lib/onboarding-steps";

/** Strip Firestore Timestamps so the draft serialises cleanly for the client. */
function serialize(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    const out: any = {};
    for (const key of Object.keys(value)) out[key] = serialize(value[key]);
    return out;
  }
  return value;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobileNumber = searchParams.get("mobile")?.replace(/\D/g, "").slice(-10);

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const docSnap = await db.collection("partner_applications").doc(mobileNumber).get();
    const userSnap = await db.collection("users").doc(mobileNumber).get();

    const data = docSnap.exists ? docSnap.data() : null;
    const userData = userSnap.exists ? userSnap.data() : null;

    // Check if partner is already registered and approved in 'partners' collection
    const partnerSnap = await db.collection("partners").doc(mobileNumber).get();
    let isApprovedPartner = false;
    let dsaCode = "";

    if (partnerSnap.exists) {
      const pData = partnerSnap.data();
      const pStatus = String(pData?.status || pData?.partnerStatus || "").toLowerCase();
      if (pStatus === "active" || pStatus === "approved") {
        isApprovedPartner = true;
        dsaCode = pData?.dsaCode || pData?.partnerId || "";
      }
    } else {
      const partnerQuery = await db.collection("partners").where("mobileNumber", "==", mobileNumber).get();
      if (!partnerQuery.empty) {
        const pData = partnerQuery.docs[0].data();
        const pStatus = String(pData?.status || pData?.partnerStatus || "").toLowerCase();
        if (pStatus === "active" || pStatus === "approved") {
          isApprovedPartner = true;
          dsaCode = pData?.dsaCode || pData?.partnerId || "";
        }
      }
    }

    if (isApprovedPartner) {
      return NextResponse.json(
        {
          found: true,
          exists: true,
          alreadyApproved: true,
          dsaCode,
          error: "Your DSA Partner Application has already been approved! Please log in to your Partner Portal.",
        },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json({
        found: false,
        exists: false,
        draft: null,
        state: deriveOnboardingState(null, {
          mobileVerified: Boolean(userData?.mobileVerified),
        }),
      });
    }

    const state = deriveOnboardingState(data, {
      mobileVerified: Boolean(data?.mobileVerified || userData?.mobileVerified),
    });

    const draft = {
      ...serialize(data),
      isSubmitted: state.isSubmitted,
      isLocked: state.isLocked,
      isApplicationLocked: state.isLocked,
    };

    return NextResponse.json({
      found: true,
      exists: true,
      isSubmitted: state.isSubmitted,
      isLocked: state.isLocked,
      applicationId: data?.applicationId || null,
      status: data?.status || "draft",
      currentStep: state.uiStep,
      currentStepKey: state.currentStep,
      state,
      // `draft` is the current contract; `data` is kept for older callers.
      draft,
      data: draft,
    });
  } catch (error: any) {
    console.error("Resume Application Error:", error);
    return NextResponse.json({ error: "Failed to fetch saved application." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "yJUj7HcvjhUpfSaWmuqK4sfi";

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      partnerId,
      mobileNumber,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification parameters missing" },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC-SHA256 Signature Verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature verification failed." },
        { status: 400 }
      );
    }

    const numAmount = Number(amount) || 0;
    const db = getAdminDb();
    const cleanMobile = String(mobileNumber || "").replace(/\D/g, "");
    const now = new Date();

    // 2. Prevent Double Spending / Replay: Check if this payment ID has already been credited
    const existingTxSnap = await db
      .collection("wallet_transactions")
      .where("paymentId", "==", razorpay_payment_id)
      .get();

    if (!existingTxSnap.empty) {
      return NextResponse.json({
        success: true,
        message: "Payment was already verified and credited.",
      });
    }

    // 3. Atomic Batch Credit to Partner Wallet
    const batch = db.batch();

    // Log in wallet_transactions
    const txRef = db.collection("wallet_transactions").doc();
    const transactionData = {
      id: txRef.id,
      partnerId,
      mobileNumber: cleanMobile,
      type: "CREDIT",
      purpose: "WALLET_TOPUP",
      amount: numAmount,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      method: "RAZORPAY",
      status: "SUCCESS",
      createdAt: now,
    };
    batch.set(txRef, transactionData);

    // Update partner's usable wallet balance in users doc
    const userDocRef = db.collection("users").doc(partnerId);
    const userDoc = await userDocRef.get();
    const currentBalance = Number(userDoc.data()?.walletBalance) || 0;
    const newBalance = currentBalance + numAmount;

    batch.set(
      userDocRef,
      {
        walletBalance: newBalance,
        updatedAt: now,
      },
      { merge: true }
    );

    // If there is a doc in users with mobileNumber key or partner_applications
    if (cleanMobile) {
      const mobileUserRef = db.collection("users").doc(cleanMobile);
      batch.set(
        mobileUserRef,
        {
          walletBalance: newBalance,
          updatedAt: now,
        },
        { merge: true }
      );

      const appRef = db.collection("partner_applications").doc(cleanMobile);
      batch.set(
        appRef,
        {
          walletBalance: newBalance,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `₹${numAmount.toLocaleString()} successfully credited to your wallet!`,
      newBalance,
      transactionId: txRef.id,
    });
  } catch (error: any) {
    console.error("Razorpay Verify Payment Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify and process wallet credit." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { razorpayInstance, RAZORPAY_PUBLIC_KEY } from "@/lib/razorpay";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { amount, partnerId, mobileNumber } = await request.json();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount < 10 || numAmount > 10000) {
      return NextResponse.json(
        { error: "Please enter a valid top-up amount between ₹10 and ₹10,000." },
        { status: 400 }
      );
    }

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    const amountInPaise = Math.round(numAmount * 100);
    const receipt = `topup_${partnerId.slice(0, 6)}_${Date.now().toString().slice(-6)}`;

    // Create Razorpay Order
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        partnerId,
        mobileNumber: mobileNumber || "",
        purpose: "WALLET_TOPUP",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_PUBLIC_KEY,
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize payment gateway order." },
      { status: 500 }
    );
  }
}

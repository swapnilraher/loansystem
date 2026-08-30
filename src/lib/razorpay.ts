import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TVyJdzyLrrprc5";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "yJUj7HcvjhUpfSaWmuqK4sfi";

export const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

export const RAZORPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || key_id;

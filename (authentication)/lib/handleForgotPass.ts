"use server";

import { cookies } from "next/headers";
import { verifyJWT, issueJWT } from "./jwtUtils";
import { sendAndSaveOTP } from "./sendOTPUtils";

export async function handleForgotPassOTP(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("auth-email-token")?.value;

    if (!token) return { error: "Session expired. Please start over." };

    const payload = await verifyJWT(token);

    if (!payload || payload.purpose !== "enter-password") {
      return { error: "Invalid request purpose." };
    }

    const email = payload.email as string;

    await sendAndSaveOTP(email, "password-reset");

    const newPayload = {
      email: email,
      purpose: "password-reset",
    };

    const newToken = await issueJWT(newPayload, "15m");

    cookieStore.set("auth-email-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    return {
      success: true,
      message: "OTP sent! Please check your inbox.",
      redirect: "/verify-otp",
    };
  } catch (error) {
    console.error("ForgotPass Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

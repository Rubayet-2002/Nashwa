import { NextResponse } from "next/server";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";
import { sendOTP } from "@/app/(authentication)/lib/sendOTP";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const { email, uid, purpose } = await request.json();

    if (!email || !uid || purpose !== "password-reset") {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 },
      );
    }

    await sendOTP(email, uid, "password-reset", 10);

    const payload = {
      email,
      uid,
      purpose: "password-reset",
    };
    const authIntentToken = await issueJWT(payload, "30m");

    const response = NextResponse.json(
      {
        success: true,
        message: "Password reset code sent to your email!",
        redirect: "/otp-verification",
      },
      { status: 200 },
    );

    setTokenCookie(response, "auth-intent-token", authIntentToken, 30 * 60);

    return response;
  } catch (error) {
    console.error("Forgot Password Route Error:", error);
    return NextResponse.json(
      { message: "Failed to process request. Please try again later." },
      { status: 500 },
    );
  }
}

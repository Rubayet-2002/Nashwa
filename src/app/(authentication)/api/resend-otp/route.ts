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

    const { email, purpose, uid } = await request.json();

    if (!email || !purpose || !uid) {
      return NextResponse.json(
        { message: "Incomplete request data" },
        { status: 400 },
      );
    }
    await sendOTP(email, uid, purpose, 10);

    const response = NextResponse.json(
      { success: true, message: "A new code has been sent to your email!" },
      { status: 200 },
    );
    const payload = { email, purpose, uid };
    const authIntentToken = await issueJWT(payload, "30m");
    setTokenCookie(response, "auth-intent-token", authIntentToken, 30 * 60);

    return response;
  } catch (error) {
    console.error("Resend OTP Route Error:", error);
    return NextResponse.json(
      { message: "Failed to resend code" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { sendAndSaveOTP } from "../../lib/sendAndSaveOTP"; // Your new utility
import { issueJWT, setTokenCookie } from "../../lib/jwtUtils";

export async function POST(request: Request) {
  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const { email, purpose } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json(
        { message: "Missing email or purpose" },
        { status: 400 },
      );
    }

    await sendAndSaveOTP(email, purpose);

    const response = NextResponse.json(
      { success: true, message: "A new code has been sent to your email!" },
      { status: 200 },
    );

    const payload = { email, purpose };

    const emailToken = await issueJWT(payload, "15m");
    setTokenCookie(response, "auth-email-token", emailToken, 15 * 60);

    return response;
  } catch (error) {
    console.error("Resend OTP Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

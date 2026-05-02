import { NextResponse } from "next/server";
import pool from "../../../../database/pool";
import { emailCheck } from "../../lib/inputValidation";
import { issueJWT, setTokenCookie } from "../../lib/jwtUtils";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = emailCheck.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = validation.data;
    const userResult = await pool.query(
      `SELECT uid, role, is_verified, auth_type, password_hash FROM users WHERE email = $1`,
      [email],
    );

    const user = userResult.rows[0];
    let payload;

    if (!user) {
      payload = {
        email: email,
        step: 2,
        needsOtp: true,
        takePassword: true,
        needPassword: false,
        purpose: "seller-registration",
      };
    } else {
      let takePassword = false;
      let needPassword = false;

      if (user.password_hash) {
        needPassword = true; // ইউজার যেভাবেই একাউন্ট খুলুক, পাসওয়ার্ড থাকলে তাকে পাসওয়ার্ড দিতেই হবে (Step 1.5)
      } else if (user.auth_type === "google") {
        takePassword = true; // গুগল ইউজার কিন্তু পাসওয়ার্ড নেই, তাই তাকে নতুন পাসওয়ার্ড সেট করতে হবে (Step 2)
      }

      payload = {
        email: email,
        uid: user.uid,
        role: user.role,
        step: 1.5,
        needsOtp: !user.is_verified,
        takePassword,
        needPassword,
        purpose: "seller-registration",
      };
    }

    const emailToken = await issueJWT(payload, "30m");
    const response = NextResponse.json({ success: true }, { status: 200 });
    setTokenCookie(response, "auth-email-token", emailToken, 30 * 60);

    return response;
  } catch (error) {
    console.error("Seller Email Check Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

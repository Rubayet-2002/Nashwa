import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { NextResponse, userAgent } from "next/server";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { otp, email, purpose, uid } = body;

    const result = await client.query(
      `SELECT u.uid, u.username, u.role, o.otp_hash, o.expires_at 
       FROM otp o
       JOIN users u ON o.email = u.email
       WHERE o.email = $1 AND o.purpose = $2 AND u.uid = $3`,
      [email, purpose, uid],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "No OTP session found" },
        { status: 404 },
      );
    }

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Invalid session or user" },
        { status: 404 },
      );
    }

    const user = result.rows[0];

    const isValidOTP = await bcrypt.compare(otp, user.otp_hash);
    if (!isValidOTP) {
      return NextResponse.json(
        { message: "Invalid OTP code" },
        { status: 400 },
      );
    }

    if (new Date() > user.expires_at) {
      return NextResponse.json({ message: "OTP has expired. Click Resend to get a new OTP." }, { status: 410 });
    }

    if (purpose === "verify-account") {
      const shopResult = await client.query(
        "SELECT shop_uid, shop_name FROM shop WHERE owner_uid = $1",
        [user.uid],
      );
      const owned_shops = shopResult.rows;

      const sessionId = crypto.randomUUID();
      const { device, browser, os } = userAgent(request);
      const payload = {
        uid: user.uid,
        role: user.role,
        sessionId: sessionId,
        activeShopUid: null,
      };

      const device_type = device.type || "desktop";
      const browser_name = browser.name || "Unknown Browser";
      const os_name = os.name || "Unknown OS";
      const device_ip = request.headers.get("x-forwarded-for")?.split(",")[0];

      const accessToken = await issueJWT(payload, "15m");
      const refreshToken = await issueJWT(payload, "10d");

      const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const hashedToken = await bcrypt.hash(refreshToken, 12);

      await client.query("BEGIN");
      transactionActive = true;

      await client.query("DELETE FROM otp WHERE email = $1 AND purpose = $2", [
        email,
        purpose,
      ]);

      await client.query(
        "UPDATE users SET is_verified = TRUE, last_login = NOW() WHERE uid = $1",
        [user.uid],
      );

      await client.query(
        `INSERT INTO session (session_id, user_uid, token_hash, expires_at, device_type, device_ip, browser_name, os_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sessionId,
          user.uid,
          hashedToken,
          token_exp,
          device_type,
          device_ip,
          browser_name,
          os_name,
        ],
      );

      await client.query("COMMIT");
      transactionActive = false;

      const response = NextResponse.json({
        success: true,
        redirect: "/",
        message: "Account verified successfully!",
        activeShopUid: null,
        purpose: purpose,
        user: {
          uid: user.uid,
          sessionId,
          username: user.username,
          role: user.role,
          is_verified: true,
          owned_shops: owned_shops,
        },
      });

      setTokenCookie(response, "access-token", accessToken, 15 * 60);
      setTokenCookie(
        response,
        "refresh-token",
        refreshToken,
        10 * 24 * 60 * 60,
      );
      response.cookies.delete("auth-intent-token");

      return response;
    } else if (purpose === "password-reset") {
      await client.query("BEGIN");
      transactionActive = true;

      await client.query("DELETE FROM otp WHERE email = $1 AND purpose = $2", [
        email,
        purpose,
      ]);

      await client.query("COMMIT");
      transactionActive = false;

      const payload = {
        uid: user.uid,
        email: email,
        purpose: "change-password",
      };

      const resetIntentToken = await issueJWT(payload, "30m");

      const response = NextResponse.json({
        success: true,
        redirect: "/change-password",
        message: "OTP verified. You can now set a new password.",
        purpose: "password-reset",
      });

      setTokenCookie(response, "auth-intent-token", resetIntentToken, 30 * 60);

      return response;
    }
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("verify otp error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
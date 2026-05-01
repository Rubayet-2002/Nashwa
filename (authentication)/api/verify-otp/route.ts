import { NextResponse, userAgent } from "next/server";
import pool from "../../../../database/pool";
import bcrypt from "bcryptjs";
import { issueJWT, setTokenCookie, verifyJWT } from "../../lib/jwtUtils";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { otp, email, purpose } = body;

    const result = await client.query(
      `SELECT 
     u.uid, 
     u.username,
     u.role,
     o.otp_hash, 
     o.expires_at 
   FROM otp o
   LEFT JOIN users u ON o.email = u.email
   WHERE o.email = $1 AND o.purpose = $2`,
      [email, purpose],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "No OTP session found" },
        { status: 404 },
      );
    }

    const { uid, username, role, otp_hash, expires_at } = result.rows[0];

    const isValidOTP = await bcrypt.compare(otp, otp_hash);
    if (!isValidOTP) {
      return NextResponse.json(
        { message: "Invalid OTP code" },
        { status: 400 },
      );
    }
    if (new Date() > expires_at) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 410 });
    }

    if (purpose === "verify-account") {
      const sessionId = crypto.randomUUID();
      const { device, browser, os } = userAgent(request);

      const device_type = device.type || "desktop";
      const browser_name = browser.name || "Unknown Browser";
      const os_name = os.name || "Unknown OS";
      const device_ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      const payload = {
        uid: uid,
        username: username,
        role: role,
        sessionId: sessionId,
      };

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
        [uid],
      );

      await client.query(
        `INSERT INTO sessions 
        (session_id, user_id, token_hash, expires_at, device_type, device_ip, browser_name, os_name) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sessionId,
          uid,
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

      const response = NextResponse.json(
        {
          success: true,
          redirect: "/",
          message: "Account verified and logged in!",
          user: {
            uid: uid,
            username: username,
            role: role,
            is_verified: true,
          },
        },
        { status: 200 },
      );

      setTokenCookie(response, "access-token", accessToken, 15 * 60);
      setTokenCookie(
        response,
        "refresh-token",
        refreshToken,
        10 * 24 * 60 * 60,
      );

      response.cookies.delete("auth-email-token");
      return response;
    } else if (purpose === "password-reset") {
      const payload = {
        uid: uid,
        purpose: "reset-password",
      };
      const passwordResetToken = await issueJWT(payload, "15m");

      await client.query("BEGIN");
      transactionActive = true;

      await client.query("DELETE FROM otp WHERE email = $1 AND purpose = $2", [
        email,
        purpose,
      ]);

      await client.query("COMMIT");
      transactionActive = false;

      const response = NextResponse.json(
        {
          success: true,
          redirect: "/new-password",
          message: "OTP Verified. Proceed to change password.",
          purpose: "reset-password",
        },
        { status: 200 },
      );

      setTokenCookie(
        response,
        "password-reset-token",
        passwordResetToken,
        15 * 60,
      );

      response.cookies.delete("auth-email-token");

      return response;
    } else if (purpose === "seller-registration") {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth-email-token")?.value;

      if (!token) {
        return NextResponse.json(
          { message: "Registration session expired" },
          { status: 401 },
        );
      }

      const payload = await verifyJWT(token);
      if (
        !payload ||
        payload.purpose !== "seller-registration" ||
        payload.needsOtp !== true
      ) {
        return NextResponse.json(
          { message: "Invalid session" },
          { status: 400 },
        );
      }

      await client.query("BEGIN");
      transactionActive = true;

      await client.query("DELETE FROM otp WHERE email = $1 AND purpose = $2", [
        email,
        purpose,
      ]);

      const uid = payload.uid;

      await client.query(
        "UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE",
        [uid],
      );
      await client.query(
        "UPDATE users SET is_verified = TRUE, last_login = NOW() WHERE uid = $1",
        [uid],
      );

      const sessionId = crypto.randomUUID();
      const { device, browser, os } = userAgent(request);

      const device_type = device.type || "desktop";
      const browser_name = browser.name || "Unknown Browser";
      const os_name = os.name || "Unknown OS";
      const device_ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      const sessionPayload = {
        uid: uid,
        username: payload.username,
        role: "seller",
        sessionId,
      };

      const accessToken = await issueJWT(sessionPayload, "15m");
      const refreshToken = await issueJWT(sessionPayload, "10d");
      const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const hashedToken = await bcrypt.hash(refreshToken, 12);

      await client.query(
        `INSERT INTO sessions (session_id, user_id, token_hash, expires_at, device_type, device_ip, browser_name, os_name) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sessionId,
          uid,
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

      const response = NextResponse.json(
        {
          success: true,
          redirect: "/shop-dashboard",
          message: "Shop created successfully!",
          user: {
            uid: uid,
            username: payload.username,
            role: "seller",
            is_verified: true,
          },
        },
        { status: 200 },
      );

      setTokenCookie(response, "access-token", accessToken, 15 * 60);
      setTokenCookie(
        response,
        "refresh-token",
        refreshToken,
        10 * 24 * 60 * 60,
      );
      response.cookies.delete("auth-email-token");

      return response;
    }
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

import { NextResponse, userAgent } from "next/server";
import pool from "../../../../database/pool";
import bcrypt from "bcryptjs";
import { issueJWT, setTokenCookie } from "../../lib/jwtUtils";
import { cookies } from "next/headers";
import { verifyJWT } from "../../lib/jwtUtils";
import { sendAndSaveOTP } from "../../lib/sendAndSaveOTP";

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

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-email-token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (
      !payload ||
      payload.purpose !== "seller-registration" ||
      payload.step !== 1.5
    ) {
      return NextResponse.json({ message: "Invalid session" }, { status: 400 });
    }

    const { uid, role, needPassword } = payload;

    if (needPassword) {
      const { password } = await request.json();
      const result = await client.query(
        "SELECT password_hash FROM users WHERE uid = $1",
        [uid],
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }

      const isMatch = await bcrypt.compare(
        password,
        result.rows[0].password_hash,
      );
      if (!isMatch) {
        return NextResponse.json(
          { message: "Invalid password" },
          { status: 401 },
        );
      }
    }

    if (role === "seller") {
      const userResult = await client.query(
        "SELECT username, role, is_verified FROM users WHERE uid = $1",
        [uid],
      );
      const user = userResult.rows[0];

      if (user.is_verified) {
        const sessionId = crypto.randomUUID();
        const { device, browser, os } = userAgent(request);

        const device_type = device.type || "desktop";
        const browser_name = browser.name || "Unknown Browser";
        const os_name = os.name || "Unknown OS";
        const device_ip =
          request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

        const sessionPayload = {
          uid: uid as string,
          username: user.username,
          role: user.role,
          sessionId,
        };

        const accessToken = await issueJWT(sessionPayload, "15m");
        const refreshToken = await issueJWT(sessionPayload, "10d");

        const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        const hashedToken = await bcrypt.hash(refreshToken, 12);

        await client.query("BEGIN");
        transactionActive = true;

        await client.query(
          "UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE",
          [uid],
        );

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

        await client.query(
          "UPDATE users SET last_login = NOW() WHERE uid = $1",
          [uid],
        );

        await client.query("COMMIT");
        transactionActive = false;

        const response = NextResponse.json({
          success: true,
          redirect: "/shop-dashboard",
          user: {
            uid: user.uid,
            username: user.username,
            role: user.role,
            is_verified: true,
          },
        });

        setTokenCookie(response, "access-token", accessToken, 15 * 60);
        setTokenCookie(
          response,
          "refresh-token",
          refreshToken,
          10 * 24 * 60 * 60,
        );
        response.cookies.delete("auth-email-token");

        return response;
      } else {
        await sendAndSaveOTP(user.email, "seller-registration");
        const otpPayload = {
          ...payload,
          needsOtp: true,
          purpose: "seller-registration",
        };

        const otpToken = await issueJWT(otpPayload, "30m");
        const response = NextResponse.json({
          success: true,
          message: "Please verify your account.",
          redirect: "/verify-otp",
        });

        setTokenCookie(response, "auth-email-token", otpToken, 30 * 60);

        return response;
      }
    }

    const newPayload = {
      ...payload,
      step: 2,
    };

    const newEmailToken = await issueJWT(newPayload, "30m");

    const response = NextResponse.json({ success: true });

    setTokenCookie(response, "auth-email-token", newEmailToken, 30 * 60);
    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Seller Check Password Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

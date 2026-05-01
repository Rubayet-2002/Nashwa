import { NextResponse, userAgent } from "next/server";
import pool from "../../../../database/pool";
import bcrypt from "bcryptjs";
import { passwordCheck } from "../../lib/inputValidation";
import { issueJWT, setTokenCookie } from "../../lib/jwtUtils";
import { sendAndSaveOTP } from "../../lib/sendOTPUtils"; // Import your utility

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const body = await request.json();
    const { email, password } = body;

    const validation = passwordCheck.safeParse({ password });
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }

    const userResult = await client.query(
      "SELECT uid, username, password_hash, is_verified, role FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // --- REFACTORED UNVERIFIED USER BLOCK ---
    if (!user.is_verified) {
      // Use the utility! It handles BEGIN, DELETE, INSERT, and EMAIL.
      await sendAndSaveOTP(email, "verify-account");

      const payload = { email, purpose: "verify-account" };
      const emailToken = await issueJWT(payload, "15m");

      const response = NextResponse.json(
        {
          success: true,
          is_verified: false,
          message: "Please verify your account.",
          redirect: "/verify-otp",
        },
        { status: 201 },
      );

      setTokenCookie(response, "auth-email-token", emailToken, 15 * 60);
      return response;
    }

    // --- VERIFIED USER SESSION BLOCK ---
    const sessionId = crypto.randomUUID();
    const { device, browser, os } = userAgent(request);

    const device_type = device.type || "desktop";
    const browser_name = browser.name || "Unknown Browser";
    const os_name = os.name || "Unknown OS";
    const device_ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const payload = { uid: user.uid, username: user.username, role: user.role, sessionId };

    const accessToken = await issueJWT(payload, "15m");
    const refreshToken = await issueJWT(payload, "10d");

    const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const hashedToken = await bcrypt.hash(refreshToken, 12);

    await client.query("BEGIN");
    transactionActive = true;

    await client.query(
      `INSERT INTO sessions (session_id, user_id, token_hash, expires_at, device_type, device_ip, browser_name, os_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, user.uid, hashedToken, token_exp, device_type, device_ip, browser_name, os_name],
    );
    
    await client.query("UPDATE users SET last_login = NOW() WHERE uid = $1", [user.uid]);

    await client.query("COMMIT");
    transactionActive = false;

    const response = NextResponse.json({
      success: true,
      is_verified: true,
      message: "Login successful!",
      user: { uid: user.uid, username: user.username, role: user.role, is_verified: true },
      redirect: "/",
    });

    setTokenCookie(response, "access-token", accessToken, 15 * 60);
    setTokenCookie(response, "refresh-token", refreshToken, 10 * 24 * 60 * 60);
    response.cookies.delete("auth-email-token");

    return response;

  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

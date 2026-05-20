import { NextResponse, userAgent } from "next/server";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { passwordCheck } from "@/app/(authentication)/lib/inputValidation";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";
import { sendOTP } from "@/app/(authentication)/lib/sendOTP";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed." },
        { status: 403 },
      );
    }

    const { email, password, uid } = await request.json();

    const validation = passwordCheck.safeParse({ password });
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const userResult = await client.query(
      "SELECT uid, username, password_hash, is_verified, role FROM users WHERE email = $1 AND uid = $2",
      [email, uid],
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.is_verified) {
      await sendOTP(email, user.uid, "verify-account", 10);

      const payload = { email, purpose: "verify-account", uid: user.uid };
      const intentToken = await issueJWT(payload, "30m");

      const response = NextResponse.json(
        {
          success: true,
          is_verified: false,
          message: "Please verify your account.",
          redirect: "/otp-verification",
        },
        { status: 201 },
      );

      setTokenCookie(response, "auth-intent-token", intentToken, 30 * 60);
      return response;
    }

    const shopResult = await client.query(
      "SELECT shop_uid, shop_name, status FROM shop WHERE owner_uid = $1",
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

    const accessToken = await issueJWT(payload, "15m");
    const refreshToken = await issueJWT(payload, "10d");

    const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const hashedToken = await bcrypt.hash(refreshToken, 12);

    const device_type = device.type || "desktop";
    const browser_name = browser.name || "Unknown Browser";
    const os_name = os.name || "Unknown OS";
    const device_ip = request.headers.get("x-forwarded-for")?.split(",")[0];

    await client.query("BEGIN");
    transactionActive = true;

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

    await client.query("UPDATE users SET last_login = NOW() WHERE uid = $1", [
      user.uid,
    ]);

    await client.query("COMMIT");
    transactionActive = false;

    const response = NextResponse.json({
      success: true,
      is_verified: true,
      message: "Login successful!",
      activeShopUid: null,
      user: {
        uid: user.uid,
        sessionId,
        username: user.username,
        role: user.role,
        is_verified: true,
        owned_shops: owned_shops,
      },
      redirect: "/",
    });

    setTokenCookie(response, "access-token", accessToken, 15 * 60);
    setTokenCookie(response, "refresh-token", refreshToken, 10 * 24 * 60 * 60);

    response.cookies.delete("auth-intent-token");

    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

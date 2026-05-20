import { NextResponse, userAgent } from "next/server";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";

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

    const { admin_key, admin_email, password } = await request.json();

    if (!admin_key || !admin_email || !password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 },
      );
    }

    // Check user with admin role
    const userRes = await client.query(
      "SELECT uid, username, password_hash, is_verified, role FROM users WHERE email = $1",
      [admin_email],
    );

    if (userRes.rowCount === 0) {
      return NextResponse.json(
        { message: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const user = userRes.rows[0];

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized: Access denied." },
        { status: 403 },
      );
    }

    // Verify admin key
    const keyRes = await client.query(
      "SELECT admin_key FROM admin_key WHERE user_uid = $1 AND admin_key = $2",
      [user.uid, admin_key],
    );

    if (keyRes.rowCount === 0) {
      return NextResponse.json(
        { message: "Invalid admin key." },
        { status: 401 },
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    // Create session (standard user session structure)
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
      message: "Admin login successful!",
      redirect: "/admin/dashboard",
    });

    setTokenCookie(response, "access-token", accessToken, 15 * 60);
    setTokenCookie(response, "refresh-token", refreshToken, 10 * 24 * 60 * 60);

    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

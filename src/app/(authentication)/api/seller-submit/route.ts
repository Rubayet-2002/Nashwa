import pool from "@/database/pool";
import { NextResponse, userAgent } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sendAndSaveOTP } from "../../lib/sendAndSaveOTP";
import { verifyJWT, issueJWT, setTokenCookie } from "../../lib/jwtUtils";

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
      payload.step !== 4
    ) {
      return NextResponse.json({ message: "Invalid session" }, { status: 400 });
    }

    const { sidUrl, nidUrl } = await request.json();

    if (!sidUrl || !nidUrl) {
      return NextResponse.json(
        { message: "Documents are missing" },
        { status: 400 },
      );
    }

    let uid = payload.uid;
    const isNewUser = !uid;

    await client.query("BEGIN");
    transactionActive = true;

    if (isNewUser) {
      uid = crypto.randomUUID();
      await client.query(
        `INSERT INTO users (uid, email, phone, username, password_hash, is_verified, role) 
         VALUES ($1, $2, $3, $4, $5, FALSE, 'seller')`,
        [
          uid,
          payload.email,
          payload.phone,
          payload.username,
          payload.password_hash,
        ],
      );
    } else {
      await client.query("UPDATE users SET role = 'seller' WHERE uid = $1", [uid]);
    }
        await client.query(
      `INSERT INTO sellers (seller_id, university_name, nid_pdf_url, sid_pdf_url, seller_status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [uid, payload.university, nidUrl, sidUrl]
    );

    await client.query(
      `INSERT INTO shops (owner_id, shop_name, description, location)
       VALUES ($1, $2, $3, $4)`,
      [uid, payload.shopName, payload.description, payload.location]
    );

    await client.query("COMMIT");
    transactionActive = false;


    const fullPayload = { ...payload, uid, sidUrl, nidUrl };

    if (payload.needsOtp) {
      await sendAndSaveOTP(payload.email as string, "seller-registration");

      await client.query("COMMIT");
      transactionActive = false;

      const nextToken = await issueJWT(fullPayload, "30m");
      const response = NextResponse.json({
        success: true,
        message: "Shop created successfully! Please verify your account.",
        redirect: "/verify-otp",
      });

      setTokenCookie(response, "auth-email-token", nextToken, 30 * 60);
      return response;
    }

        await client.query("BEGIN");
    transactionActive = true;


    await client.query(
      "UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE",
      [uid]
    );

    await client.query("UPDATE users SET last_login = NOW() WHERE uid = $1", [uid]);


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

    const response = NextResponse.json({
      success: true,
      message: "Shop created successfully!",
      redirect: "/shop-dashboard",
      user: {
        uid,
        username: payload.username,
        role: "seller",
        is_verified: true,
      },
    });
    
    setTokenCookie(response, "access-token", accessToken, 15 * 60);
    setTokenCookie(response, "refresh-token", refreshToken, 10 * 24 * 60 * 60);
    
    response.cookies.delete("auth-email-token");

    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Seller Submit Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

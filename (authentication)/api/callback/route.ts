import { NextResponse, userAgent } from "next/server";
import { cookies } from "next/headers";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateFromGoogle = searchParams.get("state");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("oauth_state")?.value;

  let errorRedirect = "/email";
  let stateSecret = "";

  try {
    if (stateCookie) {
      const parsedState = JSON.parse(stateCookie);
      stateSecret = parsedState.secret;
      errorRedirect = parsedState.from || "/email";
    }
    if (!stateFromGoogle || stateFromGoogle !== stateSecret) {
      throw new Error("invalid_session");
    }
  } catch (e) {
    return NextResponse.redirect(
      new URL(errorRedirect + "?error=invalid_session", request.url),
    );
  }

  cookieStore.delete("oauth_state");
  const client = await pool.connect();
  let transactionActive = false;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: "Bearer " + tokens.access_token },
      },
    );

    const googleUser = await userRes.json();
    const google_id = googleUser.sub;
    const email = googleUser.email;
    const name = googleUser.name;

    await client.query("BEGIN");
    transactionActive = true;

    const userResult = await client.query(
      "SELECT uid, username, email, role, is_verified, auth_type FROM users WHERE google_id = $1 OR email = $2",
      [google_id, email],
    );

    let user;

    if (userResult.rowCount === 0) {
      const uid = crypto.randomUUID();
      const newUser = await client.query(
        `INSERT INTO users (uid, email, google_id, username, auth_type, is_verified) 
         VALUES ($1, $2, $3, $4, 'google', TRUE) RETURNING uid, username, role`,
        [uid, email, google_id, name],
      );
      user = newUser.rows[0];
    } else {
      const existingUser = userResult.rows[0];

      if (!existingUser.is_verified) {
        const updatedUser = await client.query(
          `UPDATE users 
           SET google_id = $1, auth_type = 'google', password_hash = NULL, is_verified = TRUE, last_login = NOW() 
           WHERE uid = $2 RETURNING uid, username, role`,
          [google_id, existingUser.uid],
        );
        user = updatedUser.rows[0];
      } else {
        const updatedUser = await client.query(
          `UPDATE users SET google_id = $1, email = $2, last_login = NOW() 
           WHERE uid = $3 RETURNING uid, username, role`,
          [google_id, email, existingUser.uid],
        );
        user = updatedUser.rows[0];
      }
    }

    const sessionId = crypto.randomUUID();
    const { device, browser, os } = userAgent(request);

    const device_type = device.type || "desktop";
    const browser_name = browser.name || "Unknown Browser";
    const os_name = os.name || "Unknown OS";
    const device_ip = request.headers.get("x-forwarded-for")?.split(",")[0];

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

    const response = NextResponse.redirect(new URL("/", request.url));
    setTokenCookie(response, "access-token", accessToken, 15 * 60);
    setTokenCookie(response, "refresh-token", refreshToken, 10 * 24 * 60 * 60);

    response.cookies.delete("auth-intent-token");

    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Google Auth Error:", error);
    return NextResponse.redirect(
      new URL(errorRedirect + "?error=auth_failed", request.url),
    );
  } finally {
    client.release();
  }
}

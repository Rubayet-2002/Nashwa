import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import {
  issueJWT,
  verifyJWT,
  setTokenCookie,
} from "@/app/(authentication)/lib/jwtUtils";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Session not found" }, { status: 401 });
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json(
      { message: "Security check failed" },
      { status: 403 },
    );
  }

  try {
    const payload = await verifyJWT(refreshToken);
    if (!payload) throw new Error("Invalid token");

    const result = await pool.query(
      `SELECT 

       u.uid, 
       u.username, 
       u.role, 
       u.is_verified, 
       s.token_hash, 
       s.session_id, 
       s.expires_at, 
       s.is_revoked, 
       s.active_shop_uid

       FROM users u
       INNER JOIN session s ON u.uid = s.user_uid
       WHERE s.user_uid = $1 AND s.session_id = $2`,
      [payload.uid, payload.sessionId],
    );

    if (result.rowCount === 0) throw new Error("Session not found in database");

    const session = result.rows[0];

    if (session.is_revoked) throw new Error("Session has been revoked");
    if (new Date() > session.expires_at) throw new Error("Session expired");

    const isMatch = await bcrypt.compare(refreshToken, session.token_hash);
    if (!isMatch) throw new Error("Token mismatch");

    const newPayload = {
      uid: session.uid,
      username: session.username,
      role: session.role,
      sessionId: session.session_id,
      activeShopUid: session.active_shop_uid,
    };

    const newAccessToken = await issueJWT(newPayload, "15m");
    const newRefreshToken = await issueJWT(newPayload, "10d");

    const hashed_token = await bcrypt.hash(newRefreshToken, 12);
    const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE session SET token_hash = $1, expires_at = $2 WHERE session_id = $3`,
      [hashed_token, token_exp, session.session_id],
    );

    const response = NextResponse.json({
      success: true,
      message: "Token refreshed",
    });

    setTokenCookie(response, "access-token", newAccessToken, 15 * 60);
    setTokenCookie(
      response,
      "refresh-token",
      newRefreshToken,
      10 * 24 * 60 * 60,
    );

    return response;
  } catch (error: any) {
    console.error("Refresh Token Error:", error.message);
    const response = NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );

    response.cookies.delete("access-token");
    response.cookies.delete("refresh-token");
    return response;
  }
}

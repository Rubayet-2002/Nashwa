import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "../../../../database/pool";
import bcrypt from "bcryptjs";
import { verifyJWT, issueJWT, setTokenCookie } from "../../lib/jwtUtils";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Session not found" }, { status: 401 });
  }

  const requestedWith = request.headers.get("x-requested-with");
  if (requestedWith !== "XMLHttpRequest") {
    return NextResponse.json(
      { message: "Security check failed" },
      { status: 403 },
    );
  }

  const client = await pool.connect();

  try {
    const payload = await verifyJWT(refreshToken);
    if (!payload) {
      throw new Error("Invalid token");
    }

    const result = await client.query(
      `SELECT u.uid, u.username, u.role, u.is_verified, ss.token_hash, ss.session_id, ss.expires_at, ss.is_revoked
       FROM users u
       INNER JOIN sessions ss ON u.uid = ss.user_id
       WHERE ss.user_id = $1 AND ss.session_id = $2`,
      [payload.uid, payload.sessionId],
    );

    if (result.rowCount === 0) {
      throw new Error("Session not found in database");
    }

    const session = result.rows[0];

    if (session.is_revoked) {
      throw new Error("Session has been revoked");
    }

    if (new Date() > session.expires_at) {
      throw new Error("Session expired");
    }

    const isMatch = await bcrypt.compare(refreshToken, session.token_hash);
    if (!isMatch) {
      throw new Error("Token mismatch or reuse detected");
    }

    const newPayload = {
      uid: session.uid,
      username: session.username,
      role: session.role,
      sessionId: session.session_id,
    };

    const newAccessToken = await issueJWT(newPayload, "15m");
    const newRefreshToken = await issueJWT(newPayload, "10d");

    const hashed_token = await bcrypt.hash(newRefreshToken, 12);
    const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    await client.query(
      `UPDATE sessions SET token_hash = $1, expires_at = $2, is_revoked = FALSE WHERE session_id = $3`,
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
    const response = NextResponse.json(
      { message: error.message || "Unauthorized" },
      { status: 401 },
    );
    response.cookies.delete("access-token");
    response.cookies.delete("refresh-token");
    return response;
  } finally {
    client.release();
  }
}


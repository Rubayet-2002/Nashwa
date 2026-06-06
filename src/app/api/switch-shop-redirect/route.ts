import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { issueJWT, verifyJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopUid = searchParams.get("shop_uid");

    if (!shopUid) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access-token")?.value;
    const refreshToken = cookieStore.get("refresh-token")?.value;

    const availableToken = accessToken || refreshToken;
    if (!availableToken) {
      return NextResponse.redirect(new URL("/email", request.url));
    }

    const payload: any = await verifyJWT(availableToken);
    if (!payload) {
      return NextResponse.redirect(new URL("/email", request.url));
    }

    const { uid, sessionId } = payload;

    const sessionRes = await pool.query(
      "SELECT session_id FROM session WHERE session_id = $1 AND user_uid = $2 AND is_revoked = FALSE AND expires_at > NOW()",
      [sessionId, uid],
    );

    if ((sessionRes.rowCount ?? 0) === 0) {
      return NextResponse.redirect(new URL("/email", request.url));
    }

    // Verify ownership and approval status
    const shopRes = await pool.query(
      "SELECT shop_uid FROM shop WHERE shop_uid = $1 AND owner_uid = $2 AND status = 'approved'",
      [shopUid, uid],
    );

    if ((shopRes.rowCount ?? 0) === 0) {
      // If they don't own it or it's not approved, take them to the public shop profile
      return NextResponse.redirect(new URL(`/shop/${shopUid}`, request.url));
    }

    const userRes = await pool.query(
      "SELECT username, role FROM users WHERE uid = $1",
      [uid],
    );

    if ((userRes.rowCount ?? 0) === 0) {
      return NextResponse.redirect(new URL("/email", request.url));
    }

    const user = userRes.rows[0];

    // Update session active_shop_uid
    await pool.query(
      "UPDATE session SET active_shop_uid = $1 WHERE session_id = $2",
      [shopUid, sessionId],
    );

    const newPayload = {
      uid: uid,
      username: user.username,
      role: user.role,
      sessionId: sessionId,
      activeShopUid: shopUid,
    };

    const newAccessToken = await issueJWT(newPayload, "15m");
    const newRefreshToken = await issueJWT(newPayload, "10d");

    const hashed_token = await bcrypt.hash(newRefreshToken, 12);
    const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    await pool.query(
      "UPDATE session SET token_hash = $1, expires_at = $2 WHERE session_id = $3",
      [hashed_token, token_exp, sessionId],
    );

    const response = NextResponse.redirect(new URL("/shop/dashboard", request.url));

    setTokenCookie(response, "access-token", newAccessToken, 15 * 60);
    setTokenCookie(response, "refresh-token", newRefreshToken, 10 * 24 * 60 * 60);

    return response;
  } catch (error) {
    console.error("Switch Shop Redirect GET Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

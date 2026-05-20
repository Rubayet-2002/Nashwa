import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { issueJWT, verifyJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed." },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access-token")?.value;
    const refreshToken = cookieStore.get("refresh-token")?.value;

    const availableToken = accessToken || refreshToken;
    if (!availableToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload: any = await verifyJWT(availableToken);
    if (!payload) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const { uid, sessionId } = payload;

    const { activeShopUid } = await request.json();

    const sessionRes = await pool.query(
      "SELECT session_id FROM session WHERE session_id = $1 AND user_uid = $2 AND is_revoked = FALSE AND expires_at > NOW()",
      [sessionId, uid],
    );

    if ((sessionRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    if (activeShopUid) {
      const shopRes = await pool.query(
        "SELECT shop_uid, shop_name FROM shop WHERE shop_uid = $1 AND owner_uid = $2 AND status = 'approved'",
        [activeShopUid, uid],
      );

      if ((shopRes.rowCount ?? 0) === 0) {
        return NextResponse.json(
          { message: "Shop not found or not approved." },
          { status: 403 },
        );
      }
    }

    const userRes = await pool.query(
      "SELECT username, role FROM users WHERE uid = $1",
      [uid],
    );

    if ((userRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = userRes.rows[0];

    await pool.query(
      "UPDATE session SET active_shop_uid = $1 WHERE session_id = $2",
      [activeShopUid || null, sessionId],
    );

    const newPayload = {
      uid: uid,
      username: user.username,
      role: user.role,
      sessionId: sessionId,
      activeShopUid: activeShopUid || null,
    };

    const newAccessToken = await issueJWT(newPayload, "15m");
    const newRefreshToken = await issueJWT(newPayload, "10d");

    const hashed_token = await bcrypt.hash(newRefreshToken, 12);
    const token_exp = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    await pool.query(
      "UPDATE session SET token_hash = $1, expires_at = $2 WHERE session_id = $3",
      [hashed_token, token_exp, sessionId],
    );

    const response = NextResponse.json({
      success: true,
      message: activeShopUid
        ? "Switched to shop dashboard"
        : "Switched to user profile",
      activeShopUid: activeShopUid || null,
      redirect: activeShopUid ? "/shop/dashboard" : "/profile",
    });

    setTokenCookie(response, "access-token", newAccessToken, 15 * 60);
    setTokenCookie(
      response,
      "refresh-token",
      newRefreshToken,
      10 * 24 * 60 * 60,
    );

    return response;
  } catch (error) {
    console.error("Switch Shop Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

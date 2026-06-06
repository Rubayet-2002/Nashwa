import pool from "@/database/pool";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { verifyJWT } from "./jwtUtils";
import { User, Shop } from "@/zustand/authStore";

export type AuthMeResult = {
  user: User | null;
  activeShopUid: string | null;
  clearCookies: boolean;
};

export const authMe = cache(async (): Promise<AuthMeResult> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access-token")?.value;
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!accessToken && !refreshToken) {
    return { user: null, activeShopUid: null, clearCookies: false };
  }

  let payload: any = null;
  let needsRefresh = false;

  if (accessToken) {
    payload = await verifyJWT(accessToken);
  }

  if (!payload && refreshToken) {
    payload = await verifyJWT(refreshToken);
    needsRefresh = true;
  }

  if (!payload) {
    return { user: null, activeShopUid: null, clearCookies: true };
  }

  const { uid, sessionId } = payload;

  try {
    const sessionRes = await pool.query(
      `SELECT session_id, token_hash, active_shop_uid
       FROM session
       WHERE session_id = $1 AND user_uid = $2 AND is_revoked = FALSE AND expires_at > NOW()`,
      [sessionId, uid],
    );
    if (sessionRes.rowCount === 0) {
      return { user: null, activeShopUid: null, clearCookies: true };
    }

    const session = sessionRes.rows[0];

    if (needsRefresh) {
      const isMatch = await bcrypt.compare(refreshToken!, session.token_hash);
      if (!isMatch) {
        return { user: null, activeShopUid: null, clearCookies: true };
      }
    }

    const userRes = await pool.query(
      `SELECT uid, username, email, role, is_verified,
              profile_photo_url, cover_photo_url, bio, phone, address, city
       FROM users WHERE uid = $1`,
      [uid],
    );

    if (userRes.rowCount === 0) {
      return { user: null, activeShopUid: null, clearCookies: true };
    }

    const userData = userRes.rows[0];

    const shopRes = await pool.query(
      `SELECT shop_uid, shop_name, status, profile_photo_url
       FROM shop WHERE owner_uid = $1`,
      [uid],
    );

    const ownedShops: Shop[] = shopRes.rows;

    return {
      user: {
        uid: uid,
        sessionId: session.session_id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        is_verified: userData.is_verified,
        profile_photo_url: userData.profile_photo_url,
        cover_photo_url: userData.cover_photo_url,
        bio: userData.bio,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        owned_shops: ownedShops,
        need_refresh: needsRefresh,
      },
      activeShopUid: session.active_shop_uid,
      clearCookies: false,
    };
  } catch (error) {
    console.error("AuthMe Error:", error);
    return { user: null, activeShopUid: null, clearCookies: false };
  }
});

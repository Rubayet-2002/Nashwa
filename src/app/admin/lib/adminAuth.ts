import pool from "@/database/pool";
import { cookies } from "next/headers";
import { cache } from "react";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import bcrypt from "bcryptjs";

export type AdminAuthResult = {
  admin: {
    admin_uid: string;
    admin_email: string;
  } | null;
  clearCookies: boolean;
};

export const adminAuth = cache(async (): Promise<AdminAuthResult> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access-token")?.value;
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!accessToken && !refreshToken) {
    return { admin: null, clearCookies: false };
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
    return { admin: null, clearCookies: true };
  }

  const { uid, sessionId, role } = payload;

  if (role !== "admin") {
    return { admin: null, clearCookies: false };
  }

  try {
    const sessionRes = await pool.query(
      `SELECT session_id, token_hash 
       FROM session 
       WHERE session_id = $1 AND user_uid = $2 AND is_revoked = FALSE AND expires_at > NOW()`,
      [sessionId, uid],
    );
    if (sessionRes.rowCount === 0) {
      return { admin: null, clearCookies: true };
    }

    const session = sessionRes.rows[0];

    if (needsRefresh) {
      const isMatch = await bcrypt.compare(refreshToken!, session.token_hash);
      if (!isMatch) {
        return { admin: null, clearCookies: true };
      }
    }

    const userRes = await pool.query(
      "SELECT email, role FROM users WHERE uid = $1",
      [uid],
    );

    if (userRes.rowCount === 0 || userRes.rows[0].role !== "admin") {
      return { admin: null, clearCookies: true };
    }

    // Verify admin key exists for the user
    const keyRes = await pool.query(
      "SELECT admin_key FROM admin_key WHERE user_uid = $1",
      [uid],
    );

    if (keyRes.rowCount === 0) {
      return { admin: null, clearCookies: true };
    }

    const userData = userRes.rows[0];

    return {
      admin: {
        admin_uid: uid,
        admin_email: userData.email,
      },
      clearCookies: false,
    };
  } catch (error) {
    console.error("AdminAuth Error:", error);
    return { admin: null, clearCookies: false };
  }
});

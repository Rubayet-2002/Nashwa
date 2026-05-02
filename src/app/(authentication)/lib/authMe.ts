import pool from "../../../database/pool";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { verifyJWT } from "./jwtUtils";
import { User } from "@/zustand/userStore";

export type AuthMeResult = { user: User | null; clearCookies: boolean };

async function getValidSession(sessionId: string, uid: string) {
  const result = await pool.query(
    `SELECT session_id, token_hash 
     FROM sessions 
     WHERE session_id = $1 
       AND user_id = $2 
       AND is_revoked = FALSE 
       AND expires_at > NOW()`,
    [sessionId, uid],
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

export const authMe = cache(async (): Promise<AuthMeResult> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access-token")?.value;
  const refreshToken = cookieStore.get("refresh-token")?.value;

  if (!accessToken && !refreshToken) return { user: null, clearCookies: false };

  if (accessToken) {
    const payload = await verifyJWT(accessToken);
    if (payload) {
      const sessionValid = await getValidSession(
        payload.sessionId as string,
        payload.uid as string,
      );

      if (sessionValid) {
        return {
          user: {
            uid: payload.uid as string,
            username: payload.username as string,
            role: payload.role as string,
            sessionId: payload.sessionId as string,
            is_verified: true,
          },
          clearCookies: false,
        };
      }
    }
  }

  if (!refreshToken) {
    return { user: null, clearCookies: true };
  }

  try {
    const payload = await verifyJWT(refreshToken);
    if (!payload || !payload.sessionId || !payload.uid) {
      return { user: null, clearCookies: true };
    }

    const sessionValid = await getValidSession(
      payload.sessionId as string,
      payload.uid as string,
    );
    
    if (!sessionValid) {
      return { user: null, clearCookies: true };
    }

    const isMatch = await bcrypt.compare(refreshToken, sessionValid.token_hash);
    if (!isMatch) {
      return { user: null, clearCookies: true };
    }

    return {
      user: {
        uid: payload.uid as string,
        username: payload.username as string,
        role: payload.role as string,
        sessionId: payload.sessionId as string,
        is_verified: true,
        needs_refresh: true,
      },
      clearCookies: false,
    };

  } catch (error) {
    console.error("AuthMe Error:", error);
    return { user: null, clearCookies: false };
  }
});

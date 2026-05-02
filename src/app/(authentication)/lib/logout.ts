"use server";

import pool from "../../../database/pool";
import { authMe } from "./authMe";
import clearAuthCookies from "./clearCookie";

export async function logoutUser() {
  try {
    const { user: authUser } = await authMe();

    if (authUser?.sessionId) {
      await pool.query("BEGIN");
      await pool.query(
        "UPDATE sessions SET is_revoked = TRUE WHERE session_id = $1 AND user_id = $2",
        [authUser.sessionId, authUser.uid],
      );

      await pool.query("DELETE FROM otp WHERE user_id = $1", [authUser.uid]);
    }
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Logout database error:", error);
  }

  await clearAuthCookies();

  return {
    success: true,
    user: null,
    message: "Successfully logged out",
  };
}

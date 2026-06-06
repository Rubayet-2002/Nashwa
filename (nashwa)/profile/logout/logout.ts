"use server";

import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import clearCookie from "@/app/(authentication)/lib/clearCookie";

export async function logout() {
  try {
    const { user } = await authMe();

    if (user?.sessionId) {
      try {
        await pool.query("BEGIN");

        await pool.query(
          "UPDATE session SET is_revoked = TRUE WHERE session_id = $1 AND user_uid = $2",
          [user.sessionId, user.uid],
        );

        await pool.query("DELETE FROM otp WHERE user_uid = $1", [user.uid]);

        await pool.query("COMMIT");
      } catch (error) {
        await pool.query("ROLLBACK");
        return {
          success: false,
          message: "Failed to Logout: db error.",
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to Logout: auth error.",
    };
  }

  await clearCookie();

  return {
    success: true,
    message: "Logged out successfully",
  };
}

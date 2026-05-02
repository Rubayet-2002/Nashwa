"use server";

import pool from "../../../database/pool";
import { authMe } from "./authMe";
import clearAuthCookies from "./clearCookie";

export async function deleteAccount() {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    const { user: authUser } = await authMe();
    if (!authUser) {
      return { success: false, message: "Unauthorized. Please login again." };
    }

    await client.query("BEGIN");
    transactionActive = true;

    await client.query("DELETE FROM otp WHERE user_id = $1", [authUser.uid]);

    await client.query("DELETE FROM users WHERE uid = $1", [authUser.uid]);

    await client.query("COMMIT");
    transactionActive = false;

    await clearAuthCookies();

    return {
      success: true,
      message: "Your account have been permanently deleted.",
    };
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");

    console.error("Delete account error:", error);
    return {
      success: false,
      message: "Failed to delete account. Please try again.",
    };
  } finally {
    client.release();
  }
}

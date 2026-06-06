"use server";

import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import clearCookie from "@/app/(authentication)/lib/clearCookie";

export async function deleteAccount() {
  try {
    const { user } = await authMe();

    if (!user) {
      return {
        success: false,
        message: "Failed to delete account: auth error.",
      };
    }

    await pool.query("DELETE FROM users WHERE uid = $1", [user.uid]);

    await clearCookie();
    return {
      success: true,
      message: "Account permanently deleted.",
    };
  } catch (error) {
    console.error("Delete account error:", error);
    return {
      success: false,
      message: "Failed to delete account.",
    };
  }
}

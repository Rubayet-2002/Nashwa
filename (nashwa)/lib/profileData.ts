import pool from "@/database/pool";
import { authMe } from "../../(authentication)/lib/authMe";

export const profileData = async () => {
  try {
    const { user: authUser } = await authMe();
    if (!authUser) return null;

    const result = await pool.query(
      `SELECT username, email, phone, role, avatar_url, created_at FROM users WHERE uid = $1`,
      [authUser.uid],
    );

    if (result.rowCount === 0) return null;

    const user = result.rows[0];

    return {
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url ?? null,
      joinedAt: new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return null;
  }
};


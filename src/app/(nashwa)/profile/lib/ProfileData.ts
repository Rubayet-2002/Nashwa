import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const profileData = async () => {
  const { user } = await authMe();
  if (!user) return null;

  try {
    const userResult = await pool.query(
      `SELECT username, email, phone, role, profile_photo_url, created_at 
       FROM users 
       WHERE uid = $1`,
      [user.uid],
    );

    if (userResult.rowCount === 0) return null;
    const userData = userResult.rows[0];

    const shopResult = await pool.query(
      `SELECT shop_uid, shop_name, status FROM shop WHERE owner_uid = $1`,
      [user.uid],
    );

    return {
      username: user.username,
      email: userData.email,
      phone: userData.phone ?? null,
      role: userData.role,
      profile_photo_url: userData.profile_photo_url ?? null,
      shops: shopResult.rows,
      joinedAt: new Date(userData.created_at).toLocaleDateString("en-US", {
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

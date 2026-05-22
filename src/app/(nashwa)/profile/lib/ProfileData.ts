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

    let universityUid: string | null = null;
    let universityName: string | null = null;
    const universityColumnRes = await pool.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'university_uid'
       LIMIT 1`,
    );

    if (universityColumnRes.rowCount > 0) {
      const universityRes = await pool.query(
        `SELECT u.university_uid, pu.university_name
         FROM users u
         LEFT JOIN partner_university pu ON pu.university_uid = u.university_uid
         WHERE u.uid = $1`,
        [user.uid],
      );
      if (universityRes.rowCount > 0) {
        universityUid = universityRes.rows[0].university_uid ?? null;
        universityName = universityRes.rows[0].university_name ?? null;
      }
    }

    const shopResult = await pool.query(
      `SELECT shop_uid, shop_name, status FROM shop WHERE owner_uid = $1`,
      [user.uid],
    );

    return {
      username: user.username,
      email: userData.email,
      phone: userData.phone ?? null,
      role: userData.role,
      university_uid: universityUid,
      university_name: universityName,
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

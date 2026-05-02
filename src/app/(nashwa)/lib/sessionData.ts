import pool from "@/database/pool";
import { authMe } from "../../(authentication)/lib/authMe";

export const sessionData = async () => {
  const { user: authUser } = await authMe();
  if (!authUser) return [];

  try {
    const result = await pool.query(
      `SELECT session_id, device_type, device_ip, browser_name, os_name, is_revoked, created_at 
       FROM sessions 
       WHERE user_id = $1 
       ORDER BY is_revoked ASC, created_at DESC`,
      [authUser.uid]
    );

    return result.rows.map(session => ({
      ...session,
      device_ip: session.device_ip ?? "Unknown IP",
      formattedDate: new Date(session.created_at).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }));
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};


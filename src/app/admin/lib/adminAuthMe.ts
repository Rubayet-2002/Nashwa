import pool from "@/database/pool";
import { cookies } from "next/headers";
import { cache } from "react";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";

export type AdminAuthResult = {
  admin: {
    admin_uid: string;
    admin_email: string;
  } | null;
  clearCookies: boolean;
};

export const adminAuthMe = cache(async (): Promise<AdminAuthResult> => {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin-token")?.value;

  if (!adminToken) {
    return { admin: null, clearCookies: false };
  }

  const payload: any = await verifyJWT(adminToken);

  if (!payload) {
    return { admin: null, clearCookies: true };
  }

  const { admin_uid } = payload;

  try {
    const adminRes = await pool.query(
      "SELECT uid as admin_uid, email as admin_email FROM users WHERE uid = $1 AND role = 'admin'",
      [admin_uid],
    );

    if ((adminRes.rowCount ?? 0) === 0) {
      return { admin: null, clearCookies: true };
    }

    const adminData = adminRes.rows[0];

    return {
      admin: {
        admin_uid: adminData.admin_uid,
        admin_email: adminData.admin_email,
      },
      clearCookies: false,
    };
  } catch (error) {
    console.error("AdminAuthMe Error:", error);
    return { admin: null, clearCookies: false };
  }
});

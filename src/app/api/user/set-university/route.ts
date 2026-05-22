import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { getUniversityByUid } from "@/app/shop/lib/universities";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { universityUid } = await request.json();
    const university = getUniversityByUid(universityUid);
    if (!university) {
      return NextResponse.json({ message: "Invalid university." }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS university_uid VARCHAR(50)`);

    await pool.query(
      `INSERT INTO partner_university (university_uid, university_name)
       VALUES ($1, $2)
       ON CONFLICT (university_uid) DO UPDATE SET university_name = EXCLUDED.university_name`,
      [university.uid, university.name],
    );

    await pool.query(
      `UPDATE users SET university_uid = $1 WHERE uid = $2`,
      [university.uid, user.uid],
    );

    return NextResponse.json({ success: true, universityName: university.name });
  } catch (error) {
    console.error("set-user-university (profile) error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

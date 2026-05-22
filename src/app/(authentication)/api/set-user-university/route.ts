import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { cookies } from "next/headers";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import { getUniversityByUid } from "@/app/shop/lib/universities";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-email-token")?.value;
    if (!token) return NextResponse.json({ message: "Session missing." }, { status: 400 });

    const payload = await verifyJWT(token);
    if (!payload || payload.purpose !== "verify-account") {
      return NextResponse.json({ message: "Invalid session." }, { status: 400 });
    }

    const body = await request.json();
    const universityUid = body?.universityUid;
    const university = getUniversityByUid(universityUid);
    if (!university) return NextResponse.json({ message: "Invalid university." }, { status: 400 });

    // Upsert partner_university
    await pool.query(
      `INSERT INTO partner_university (university_uid, university_name)
       VALUES ($1, $2)
       ON CONFLICT (university_uid) DO UPDATE SET university_name = EXCLUDED.university_name`,
      [university.uid, university.name],
    );

    // Ensure users.university_uid column exists (for older DBs)
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS university_uid VARCHAR(50)`);
    } catch (e) {
      // ignore - if this fails, the subsequent update will surface an error
    }

    // Update the user row by email from token payload
    await pool.query(`UPDATE users SET university_uid = $1 WHERE email = $2`, [university.uid, payload.email]);

    return NextResponse.json({ success: true, universityName: university.name });
  } catch (error) {
    console.error("set-user-university error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

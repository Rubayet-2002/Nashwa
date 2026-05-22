import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { getUniversityByUid } from "@/app/shop/lib/universities";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { shopUid, universityUid } = await request.json();
    if (!shopUid || !universityUid) return NextResponse.json({ message: "Missing fields." }, { status: 400 });

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const shopRes = await pool.query("SELECT owner_uid FROM shop WHERE shop_uid = $1", [shopUid]);
    if (shopRes.rowCount === 0 || shopRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const university = getUniversityByUid(universityUid);
    if (!university) return NextResponse.json({ message: "Invalid university." }, { status: 400 });

    await pool.query("BEGIN");
    await pool.query(
      `INSERT INTO partner_university (university_uid, university_name)
       VALUES ($1, $2)
       ON CONFLICT (university_uid) DO UPDATE SET university_name = EXCLUDED.university_name`,
      [university.uid, university.name],
    );

    await pool.query(
      `INSERT INTO shop_join_university (shop_uid, university_uid, sid_pdf_url, status)
       VALUES ($1, $2, NULL, 'pending')
       ON CONFLICT (shop_uid) DO UPDATE SET university_uid = EXCLUDED.university_uid, sid_pdf_url = EXCLUDED.sid_pdf_url, status = 'pending'`,
      [shopUid, university.uid],
    );

    await pool.query("COMMIT");
    return NextResponse.json({ success: true, universityName: university.name });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("set-shop-university error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

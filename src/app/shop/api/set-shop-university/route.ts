import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { shopUid, universityUid, studentId, sidPdfUrl } = await request.json();
    if (!shopUid || !universityUid || !studentId || !sidPdfUrl) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    

    const shopRes = await pool.query("SELECT owner_uid FROM shop WHERE shop_uid = $1", [shopUid]);
    if (shopRes.rowCount === 0 || shopRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    

    const uniRes = await pool.query("SELECT university_name FROM partner_university WHERE university_uid = $1", [universityUid]);
    if (uniRes.rowCount === 0) {
      return NextResponse.json({ message: "Invalid university selection." }, { status: 400 });
    }

    const universityName = uniRes.rows[0].university_name;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO shop_join_university (shop_uid, university_uid, student_id, sid_pdf_url, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (shop_uid) DO UPDATE 
         SET university_uid = EXCLUDED.university_uid, 
             student_id = EXCLUDED.student_id,
             sid_pdf_url = EXCLUDED.sid_pdf_url, 
             status = 'pending'`,
        [shopUid, universityUid, studentId, sidPdfUrl],
      );

      await client.query("COMMIT");
      return NextResponse.json({ success: true, message: "University join request submitted successfully.", universityName });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("set-shop-university error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

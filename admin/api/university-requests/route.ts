import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import { sendNotification } from "@/lib/notify";

export async function GET(request: Request) {
  try {
    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const res = await pool.query(`
      SELECT sju.id, sju.shop_uid, sju.university_uid, sju.student_id, sju.sid_pdf_url, sju.status, sju.created_at,
             s.shop_name, s.shop_email, s.owner_uid,
             u.university_name
      FROM shop_join_university sju
      JOIN shop s ON sju.shop_uid = s.shop_uid
      JOIN partner_university u ON sju.university_uid = u.university_uid
      ORDER BY sju.created_at DESC
    `);

    return NextResponse.json({ success: true, requests: res.rows });
  } catch (error) {
    console.error("Admin University Requests GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const { request_id, action } = await request.json();

    if (!request_id || !action) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }

    const statusVal = action === "approve" ? "approved" : "rejected";

    const updateRes = await pool.query(
      `UPDATE shop_join_university 
       SET status = $1, approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END
       WHERE id = $2 
       RETURNING shop_uid, university_uid`,
      [statusVal, request_id]
    );

    if ((updateRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }

    const { shop_uid, university_uid } = updateRes.rows[0];

    // Fetch owner and shop info
    const shopRes = await pool.query(
      "SELECT owner_uid, shop_name FROM shop WHERE shop_uid = $1",
      [shop_uid]
    );
    const uniRes = await pool.query(
      "SELECT university_name FROM partner_university WHERE university_uid = $1",
      [university_uid]
    );

    if ((shopRes.rowCount ?? 0) > 0) {
      const ownerUid = shopRes.rows[0].owner_uid;
      const shopName = shopRes.rows[0].shop_name;
      const uniName = uniRes.rows[0]?.university_name || "University";

      await sendNotification({
        userUid: ownerUid,
        type: action === "approve" ? "university_approved" : "university_rejected",
        title: action === "approve" ? "Community Join Approved!" : "Community Join Rejected",
        body: action === "approve"
          ? `Your request for "${shopName}" to join the "${uniName}" community has been approved.`
          : `Your request for "${shopName}" to join the "${uniName}" community was rejected.`,
        link: "/shop/dashboard",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Request successfully ${statusVal}.`,
    });
  } catch (error) {
    console.error("Admin University Requests POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

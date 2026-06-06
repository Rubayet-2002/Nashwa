import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import { sendNotification } from "@/lib/notify";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const { report_uid, action } = await request.json();

    if (!report_uid || !action) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (action !== "remove_post" && action !== "dismiss") {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }

    const actionTaken = action === "remove_post" ? "removed_post" : "dismissed";

    // 1. Fetch report details
    const reportRes = await client.query(
      `SELECT r.product_uid, r.reporter_uid, p.title AS product_title, s.owner_uid AS seller_uid
       FROM report r
       LEFT JOIN product p ON r.product_uid = p.product_uid
       LEFT JOIN shop s ON p.shop_uid = s.shop_uid
       WHERE r.report_uid = $1`,
      [report_uid]
    );

    if ((reportRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "Report not found." }, { status: 404 });
    }

    const { product_uid, reporter_uid, product_title, seller_uid } = reportRes.rows[0];

    await client.query("BEGIN");
    transactionActive = true;

    // 2. Update report status
    await client.query(
      `UPDATE report 
       SET status = 'resolved', action_taken = $1
       WHERE report_uid = $2`,
      [actionTaken, report_uid]
    );

    // 3. If action is remove_post, mark product as removed
    if (action === "remove_post" && product_uid) {
      await client.query(
        `UPDATE product SET status = 'removed' WHERE product_uid = $1`,
        [product_uid]
      );
    }

    await client.query("COMMIT");
    transactionActive = false;

    // 4. Send Notifications
    if (action === "remove_post") {
      if (seller_uid) {
        await sendNotification({
          userUid: seller_uid,
          type: "report_action_seller",
          title: "Product Removed",
          body: `Your product "${product_title || "Item"}" has been removed by administrators due to violations of community guidelines.`,
          link: "/shop/dashboard",
        });
      }

      if (reporter_uid) {
        await sendNotification({
          userUid: reporter_uid,
          type: "report_action_reporter",
          title: "Report Resolved",
          body: `The product "${product_title || "Item"}" you reported has been removed. Thank you for keeping Nashwa safe!`,
          link: "/notifications",
        });
      }
    } else {
      // Dismissed
      if (reporter_uid) {
        await sendNotification({
          userUid: reporter_uid,
          type: "report_action_reporter",
          title: "Report Reviewed",
          body: `Your report regarding "${product_title || "Item"}" has been reviewed by admins and dismissed as it does not violate guidelines.`,
          link: "/notifications",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Report resolved successfully with action: ${actionTaken}.`,
    });
  } catch (error) {
    if (transactionActive) {
      await client.query("ROLLBACK");
    }
    console.error("Admin Reports POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

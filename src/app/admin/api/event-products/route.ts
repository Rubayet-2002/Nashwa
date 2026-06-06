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
      SELECT ep.event_uid, ep.product_uid, ep.shop_uid, ep.status, ep.reviewed_at,
             p.title AS product_title, p.price AS product_price,
             s.shop_name, s.owner_uid,
             e.title AS event_title,
             (SELECT image_url FROM product_image WHERE product_uid = p.product_uid LIMIT 1) AS product_image
      FROM event_product ep
      JOIN product p ON ep.product_uid = p.product_uid
      JOIN shop s ON ep.shop_uid = s.shop_uid
      JOIN campus_event e ON ep.event_uid = e.event_uid
      ORDER BY ep.status ASC, ep.reviewed_at DESC
    `);

    return NextResponse.json({ success: true, submissions: res.rows });
  } catch (error) {
    console.error("Admin Event Products GET error:", error);
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

    const { event_uid, product_uid, action } = await request.json();

    if (!event_uid || !product_uid || !action) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }

    const statusVal = action === "approve" ? "approved" : "rejected";

    const updateRes = await pool.query(
      `UPDATE event_product 
       SET status = $1, reviewed_at = NOW()
       WHERE event_uid = $2 AND product_uid = $3
       RETURNING shop_uid`,
      [statusVal, event_uid, product_uid]
    );

    if ((updateRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "Submission not found." }, { status: 404 });
    }

    const { shop_uid } = updateRes.rows[0];

    // Fetch shop details to notify the owner
    const shopRes = await pool.query(
      "SELECT owner_uid, shop_name FROM shop WHERE shop_uid = $1",
      [shop_uid]
    );
    const eventRes = await pool.query(
      "SELECT title FROM campus_event WHERE event_uid = $1",
      [event_uid]
    );
    const prodRes = await pool.query(
      "SELECT title FROM product WHERE product_uid = $1",
      [product_uid]
    );

    if ((shopRes.rowCount ?? 0) > 0) {
      const ownerUid = shopRes.rows[0].owner_uid;
      const shopName = shopRes.rows[0].shop_name;
      const eventTitle = eventRes.rows[0]?.title || "Campus Event";
      const productTitle = prodRes.rows[0]?.title || "Product";

      await sendNotification({
        userUid: ownerUid,
        type: action === "approve" ? "event_product_approved" : "event_product_rejected",
        title: action === "approve" ? "Product Approved for Event!" : "Product Rejected for Event",
        body: action === "approve"
          ? `Your product "${productTitle}" from "${shopName}" has been approved to participate in "${eventTitle}".`
          : `Your product "${productTitle}" request to participate in "${eventTitle}" was rejected.`,
        link: "/shop/dashboard",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Product submission successfully ${statusVal}.`,
    });
  } catch (error) {
    console.error("Admin Event Products POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

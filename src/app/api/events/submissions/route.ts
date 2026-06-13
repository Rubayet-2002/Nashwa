import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET submissions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopUid = searchParams.get("shopUid");
    const eventUid = searchParams.get("eventUid");

    if (shopUid) {
      const submissions = await pool.query(
        `SELECT ep.event_uid, ep.product_uid, ep.shop_uid, ep.status, ep.reviewed_at, ep.created_at,
                p.title AS product_title, p.price AS product_price,
                e.title AS event_title, e.image_url AS event_image, e.venue AS event_venue,
                (SELECT image_url FROM product_image WHERE product_uid = p.product_uid LIMIT 1) AS product_image
         FROM event_product ep
         JOIN product p ON ep.product_uid = p.product_uid
         JOIN campus_event e ON ep.event_uid = e.event_uid
         WHERE ep.shop_uid = $1
         ORDER BY ep.created_at DESC`,
        [shopUid]
      );
      return NextResponse.json({ success: true, submissions: submissions.rows });
    }

    if (eventUid) {
      const submissions = await pool.query(
        `SELECT ep.event_uid, ep.product_uid, ep.shop_uid, ep.status, ep.reviewed_at, ep.created_at,
                p.title AS product_title, p.price AS product_price,
                s.shop_name
         FROM event_product ep
         JOIN product p ON ep.product_uid = p.product_uid
         JOIN shop s ON ep.shop_uid = s.shop_uid
         WHERE ep.event_uid = $1 AND ep.status = 'approved'
         ORDER BY ep.created_at DESC`,
        [eventUid]
      );
      return NextResponse.json({ success: true, submissions: submissions.rows });
    }

    return NextResponse.json({ message: "Either shopUid or eventUid is required" }, { status: 400 });
  } catch (error) {
    console.error("Submissions GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST submission
export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { user, activeShopUid } = await authMe();
    if (!user || !activeShopUid) {
      return NextResponse.json({ message: "Unauthorized. Please act as a shop owner." }, { status: 401 });
    }

    const { eventUid, productUid } = await request.json();
    if (!eventUid || !productUid) {
      return NextResponse.json({ message: "eventUid and productUid are required." }, { status: 400 });
    }

    // Verify event exists
    const eventRes = await pool.query("SELECT event_uid FROM campus_event WHERE event_uid = $1", [eventUid]);
    if (eventRes.rowCount === 0) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    // Verify product exists and belongs to this shop
    const productRes = await pool.query(
      "SELECT product_uid FROM product WHERE product_uid = $1 AND shop_uid = $2 AND status = 'active'",
      [productUid, activeShopUid]
    );
    if (productRes.rowCount === 0) {
      return NextResponse.json({ message: "Product not found or doesn't belong to your active shop." }, { status: 404 });
    }

    // Check if already submitted
    const existing = await pool.query(
      "SELECT status FROM event_product WHERE event_uid = $1 AND product_uid = $2",
      [eventUid, productUid]
    );

    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ message: `This product is already submitted to this event. Status: ${existing.rows[0].status}` }, { status: 409 });
    }

    // Insert
    await pool.query(
      `INSERT INTO event_product (event_uid, product_uid, shop_uid, status)
       VALUES ($1, $2, $3, 'pending')`,
      [eventUid, productUid, activeShopUid]
    );

    return NextResponse.json({ success: true, message: "Product submitted successfully. Pending administrator verification." });
  } catch (error) {
    console.error("Submissions POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

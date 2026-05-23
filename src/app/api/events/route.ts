import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET /api/events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopUid = searchParams.get("shopUid");

    let eventsRes;
    if (shopUid) {
      eventsRes = await pool.query(
        `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at, e.created_at,
                s.shop_name
         FROM campus_event e
         JOIN shop s ON s.shop_uid = e.shop_uid
         WHERE e.shop_uid = $1
         ORDER BY e.created_at DESC`,
        [shopUid]
      );
    } else {
      eventsRes = await pool.query(
        `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at, e.created_at,
                s.shop_name
         FROM campus_event e
         JOIN shop s ON s.shop_uid = e.shop_uid
         ORDER BY e.created_at DESC`
      );
    }

    return NextResponse.json({ success: true, events: eventsRes.rows });
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json({ message: "Failed to load events" }, { status: 500 });
  }
}

// POST /api/events
export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { shopUid, title, description, imageUrl, hostName, venue, endsAt } = await request.json();
    if (!shopUid || !title || !hostName || !venue || !endsAt) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    // Verify shop exists and that the user is the owner
    const shopRes = await pool.query(
      `SELECT owner_uid FROM shop WHERE shop_uid = $1 LIMIT 1`,
      [shopUid]
    );

    if (shopRes.rowCount === 0) {
      return NextResponse.json({ message: "Shop not found" }, { status: 404 });
    }

    if (shopRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const eventUid = crypto.randomUUID();
    await pool.query(
      `INSERT INTO campus_event (event_uid, shop_uid, title, description, image_url, host_name, venue, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [eventUid, shopUid, title, description || null, imageUrl || null, hostName, venue, new Date(endsAt)]
    );

    const insertedRes = await pool.query(
      `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at, e.created_at,
              s.shop_name
       FROM campus_event e
       JOIN shop s ON s.shop_uid = e.shop_uid
       WHERE e.event_uid = $1 LIMIT 1`,
      [eventUid]
    );

    return NextResponse.json({ success: true, event: insertedRes.rows[0] });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json({ message: "Failed to create event" }, { status: 500 });
  }
}

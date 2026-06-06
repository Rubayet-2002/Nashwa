import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";

export async function GET(request: Request) {
  try {
    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const res = await pool.query(
      "SELECT * FROM campus_event ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, events: res.rows });
  } catch (error) {
    console.error("Admin Events GET error:", error);
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

    const { title, description, image_url, venue, start_at, ends_at } = await request.json();

    if (!title || !image_url || !venue || !start_at || !ends_at) {
      return NextResponse.json({ message: "Title, Banner Image, Venue, Start Time, and End Time are required." }, { status: 400 });
    }

    const eventUid = crypto.randomUUID();

    await pool.query(
      `INSERT INTO campus_event (event_uid, admin_uid, title, description, image_url, venue, start_at, ends_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [eventUid, admin.admin_uid, title, description || null, image_url, venue, start_at, ends_at]
    );

    return NextResponse.json({
      success: true,
      message: `Event "${title}" created successfully.`,
      event: {
        event_uid: eventUid,
        title,
        description,
        image_url,
        venue,
        start_at,
        ends_at,
      },
    });
  } catch (error) {
    console.error("Admin Events POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

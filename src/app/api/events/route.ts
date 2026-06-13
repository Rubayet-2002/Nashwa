import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";



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
         LEFT JOIN shop s ON s.shop_uid = e.shop_uid
         WHERE e.shop_uid = $1
         ORDER BY e.created_at DESC`,
        [shopUid]
      );
    } else {
      eventsRes = await pool.query(
        `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at, e.created_at,
                s.shop_name
         FROM campus_event e
         LEFT JOIN shop s ON s.shop_uid = e.shop_uid
         ORDER BY e.created_at DESC`
      );
    }

    return NextResponse.json({ success: true, events: eventsRes.rows });
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json({ message: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ message: "Only administrators can host events." }, { status: 403 });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ message: "Only administrators can delete events." }, { status: 403 });
}

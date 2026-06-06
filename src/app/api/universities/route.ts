import { NextResponse } from "next/server";
import pool from "@/database/pool";

export async function GET() {
  try {
    const res = await pool.query(
      "SELECT university_uid, university_name, description, logo_url FROM partner_university ORDER BY university_name ASC"
    );
    return NextResponse.json({ success: true, universities: res.rows });
  } catch (error) {
    console.error("Public Universities GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await pool.query(`UPDATE product SET share_count = share_count + 1 WHERE product_uid = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

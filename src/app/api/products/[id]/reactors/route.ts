import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await pool.query(
      `SELECT r.user_uid AS uid, u.username, r.created_at
       FROM product_reaction r
       JOIN users u ON u.uid = r.user_uid
       WHERE r.product_uid = $1
       ORDER BY r.created_at DESC`,
      [id],
    );

    return NextResponse.json({ success: true, reactors: res.rows });
  } catch (error) {
    console.error("reactors GET error:", error);
    return NextResponse.json({ message: "Failed to load reactors" }, { status: 500 });
  }
}

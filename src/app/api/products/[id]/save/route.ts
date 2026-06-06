import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await pool.query(`SELECT 1 FROM product_save WHERE product_uid = $1 AND user_uid = $2`, [id, user.uid]);
    if (existing.rowCount! > 0) {
      await pool.query(`DELETE FROM product_save WHERE product_uid = $1 AND user_uid = $2`, [id, user.uid]);
      return NextResponse.json({ saved: false });
    } else {
      await pool.query(`INSERT INTO product_save (product_uid, user_uid) VALUES ($1, $2)`, [id, user.uid]);
      return NextResponse.json({ saved: true });
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ saved: false });
  const r = await pool.query(`SELECT 1 FROM product_save WHERE product_uid = $1 AND user_uid = $2`, [id, user.uid]);
  return NextResponse.json({ saved: r.rowCount! > 0 });
}

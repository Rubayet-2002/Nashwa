import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const res = await pool.query(
      "SELECT COUNT(*)::int AS count FROM product_save WHERE user_uid = $1",
      [user.uid]
    );

    const count = res.rows[0]?.count || 0;
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Saved count fetch error:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

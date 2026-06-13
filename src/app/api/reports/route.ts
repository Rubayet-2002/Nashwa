import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";



export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { productUid, reason } = await req.json();
    if (!productUid || !reason?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const reportUid = crypto.randomUUID();
    await pool.query(`
      INSERT INTO report (report_uid, reporter_uid, product_uid, reason)
      VALUES ($1, $2, $3, $4)
    `, [reportUid, user.uid, productUid, reason.trim()]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Report error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { shopUid } = await req.json();
    if (!shopUid) {
      return NextResponse.json({ error: "Missing shopUid" }, { status: 400 });
    }

    

    const shopRes = await pool.query(
      `SELECT owner_uid, platform_debt FROM shop WHERE shop_uid = $1`,
      [shopUid]
    );

    if (shopRes.rowCount === 0) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shop = shopRes.rows[0];
    if (shop.owner_uid !== user.uid) {
      return NextResponse.json({ error: "Unauthorized shop access" }, { status: 403 });
    }

    

    await pool.query(
      `UPDATE shop 
       SET platform_debt = 0, is_blocked = FALSE, last_payment_at = NOW()
       WHERE shop_uid = $1`,
      [shopUid]
    );

    return NextResponse.json({
      success: true,
      message: "Platform debt paid successfully. Shop reactivated.",
    });
  } catch (err) {
    console.error("Error paying shop debt:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

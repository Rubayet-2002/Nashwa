import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productUid = searchParams.get("productUid");
    if (!productUid) {
      return NextResponse.json({ message: "productUid is required" }, { status: 400 });
    }

    // return simple list of users who reacted to the product
    const res = await pool.query(
      `SELECT r.user_uid AS uid, u.username, r.created_at
       FROM product_reaction r
       JOIN users u ON u.uid = r.user_uid
       WHERE r.product_uid = $1
       ORDER BY r.created_at DESC`,
      [productUid],
    );

    return NextResponse.json({ success: true, reactors: res.rows });
  } catch (error) {
    console.error("product-reactors GET error:", error);
    return NextResponse.json({ message: "Failed to load reactors" }, { status: 500 });
  }
}

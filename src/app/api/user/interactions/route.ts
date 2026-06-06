import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({
        followedShops: [],
        savedProducts: [],
        reactedProducts: [],
      });
    }

    const [followRes, saveRes, reactRes] = await Promise.all([
      pool.query("SELECT shop_uid FROM shop_follow WHERE user_uid = $1", [user.uid]),
      pool.query("SELECT product_uid FROM product_save WHERE user_uid = $1", [user.uid]),
      pool.query("SELECT product_uid FROM product_reaction WHERE user_uid = $1", [user.uid]),
    ]);

    return NextResponse.json({
      followedShops: followRes.rows.map((r: any) => r.shop_uid),
      savedProducts: saveRes.rows.map((r: any) => r.product_uid),
      reactedProducts: reactRes.rows.map((r: any) => r.product_uid),
    });
  } catch (error) {
    console.error("Interactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user interactions" },
      { status: 500 }
    );
  }
}

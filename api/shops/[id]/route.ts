import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  try {
    const [shopRes, postsRes] = await Promise.all([
      pool.query(`
        SELECT s.*, u.username AS owner_name, u.uid AS owner_uid,
               pu.university_name, pu.university_uid,
               (SELECT COUNT(*) FROM shop_follow WHERE shop_uid = s.shop_uid)::int AS follower_count
        FROM shop s
        JOIN users u ON u.uid = s.owner_uid
        LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
        LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
        WHERE s.shop_uid = $1
      `, [id]),
      pool.query(`
        SELECT p.product_uid, p.title, p.price, p.like_count, p.sold_count,
               (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC LIMIT 1) AS image_url
        FROM product p
        WHERE p.shop_uid = $1 AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 12
      `, [id]),
    ]);

    if (!shopRes.rows[0]) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    let isFollowing = false;
    if (user) {
      const fr = await pool.query(`SELECT 1 FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2`, [id, user.uid]);
      isFollowing = fr.rowCount! > 0;
    }

    return NextResponse.json({ shop: shopRes.rows[0], posts: postsRes.rows, isFollowing });
  } catch (err) {
    console.error("Shop GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

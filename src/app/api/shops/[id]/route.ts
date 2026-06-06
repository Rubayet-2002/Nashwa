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
        SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
               p.discount_percent, p.currency, p.category, p.product_type,
               p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
               p.sold_count, p.like_count, p.avg_rating, p.variants, p.created_at,
               (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC, pi.id ASC LIMIT 1) AS image_url,
               COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
               (SELECT COUNT(*)::int FROM product_comment pc WHERE pc.product_uid = p.product_uid) AS comment_count,
               s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url,
               s.avg_rating AS shop_avg_rating, s.is_blocked AS shop_blocked,
               pu.university_name AS shop_university_name,
               ep.status AS event_status
        FROM product p
        JOIN shop s ON s.shop_uid = p.shop_uid
        LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
        LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
        LEFT JOIN event_product ep ON ep.product_uid = p.product_uid
        WHERE p.shop_uid = $1 AND p.status = 'active'
        ORDER BY p.created_at DESC
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

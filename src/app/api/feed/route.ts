import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "explore";
  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 10000);
  const category = searchParams.get("category") || "";
  const communityId = searchParams.get("communityId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const { user } = await authMe();

  let productTypeFilter = "";
  if (tab === "preorder") productTypeFilter = `AND p.product_type = 'preorder'`;
  else if (tab === "explore") productTypeFilter = `AND p.product_type IN ('regular', 'event')`;

  let followingJoin = "";
  let followingFilter = "";
  if (tab === "following" && user) {
    followingJoin = `JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = '${user.uid}'`;
    followingFilter = "";
  } else if (tab === "following" && !user) {
    return NextResponse.json({ products: [], page, hasMore: false });
  }

  let categoryFilter = "";
  if (category) {
    const cats = category.split(",").map(c => `'${c.trim().replace(/'/g, "''")}'`).join(",");
    categoryFilter = `AND p.category IN (${cats})`;
  }

  let communityFilter = "";
  if (communityId) {
    const ids = communityId.split(",").map(id => `'${id.trim().replace(/'/g, "''")}'`).join(",");
    communityFilter = `AND sju.university_uid IN (${ids})`;
  }

  try {
    // Check and block shops with platform debt older than 30 days
    await pool.query(`
      UPDATE shop
      SET is_blocked = TRUE
      WHERE status = 'approved'
        AND is_blocked = FALSE
        AND platform_debt > 0
        AND (
          (last_payment_at IS NOT NULL AND last_payment_at < NOW() - INTERVAL '30 days') OR
          (last_payment_at IS NULL AND approved_at IS NOT NULL AND approved_at < NOW() - INTERVAL '30 days') OR
          (last_payment_at IS NULL AND approved_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
        )
    `);

    const res = await pool.query(`
      SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
             p.discount_percent, p.currency, p.category, p.product_type,
             p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
             p.sold_count, p.like_count, p.avg_rating, p.variants, p.created_at,
             (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC, pi.id ASC LIMIT 1) AS image_url,
             COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
             (SELECT COUNT(*)::int FROM product_comment pc WHERE pc.product_uid = p.product_uid) AS comment_count,
             s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url,
             s.owner_uid AS shop_owner_uid,
             s.avg_rating AS shop_avg_rating, s.is_blocked AS shop_blocked,
             pu.university_name AS shop_university_name,
             ep.status AS event_status
      FROM product p
      JOIN shop s ON s.shop_uid = p.shop_uid
      ${followingJoin}
      LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
      LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
      LEFT JOIN event_product ep ON ep.product_uid = p.product_uid AND ep.status = 'approved'
      WHERE s.status = 'approved'
        AND s.is_blocked = FALSE
        AND p.status = 'active'
        AND p.price >= $1
        AND p.price <= $2
        ${productTypeFilter}
        ${categoryFilter}
        ${communityFilter}
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `, [minPrice, maxPrice, limit, offset]);

    return NextResponse.json({ products: res.rows, page, hasMore: res.rows.length === limit });
  } catch (err) {
    console.error("Feed error:", err);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await pool.query(`
      SELECT p.*,
             COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
             (SELECT COUNT(*)::int FROM product_reaction pr WHERE pr.product_uid = p.product_uid) AS like_count,
             (SELECT COUNT(*)::int FROM product_comment pc WHERE pc.product_uid = p.product_uid) AS comment_count,
             s.shop_uid, s.shop_name, s.shop_description, s.shop_bio,
             s.profile_photo_url AS shop_profile_photo_url,
             s.cover_photo_url AS shop_cover_photo_url,
             s.shop_location, s.shop_email, s.shop_phone,
             s.instagram_url, s.facebook_url, s.whatsapp,
             s.avg_rating AS shop_avg_rating, s.follower_count, s.is_blocked AS shop_blocked,
             s.owner_uid AS shop_owner_uid,
             pu.university_name AS shop_university_name,
             pu.university_uid AS shop_university_uid,
             u.username AS shop_owner_username
      FROM product p
      JOIN shop s ON s.shop_uid = p.shop_uid
      JOIN users u ON u.uid = s.owner_uid
      LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
      LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
      WHERE p.product_uid = $1 AND p.status != 'removed'
    `, [id]);

    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product: res.rows[0] });
  } catch (err) {
    console.error("Product GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/products/[id] — update product details & images
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      price,
      originalPrice,
      discountPercent,
      insideDeliveryCharge,
      outsideDeliveryCharge,
      freeOnCampusDelivery,
      variants = [],
      productDetails = [],
      images = [], // full list of remaining/new image URLs
    } = body;

    // Verify ownership
    const checkRes = await pool.query(
      `SELECT s.owner_uid
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       WHERE p.product_uid = $1`,
      [id]
    );

    if (!checkRes.rows[0]) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (checkRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update product info
    await pool.query(
      `UPDATE product
       SET title = $1, description = $2, category = $3, price = $4,
           original_price = $5, discount_percent = $6,
           inside_delivery_charge = $7, outside_delivery_charge = $8,
           free_on_campus_delivery = $9, variants = $10, product_details = $11
       WHERE product_uid = $12`,
      [
        title,
        description || null,
        category || null,
        price,
        originalPrice || null,
        discountPercent || 0,
        insideDeliveryCharge || 0,
        outsideDeliveryCharge || 0,
        freeOnCampusDelivery,
        JSON.stringify(variants),
        JSON.stringify(productDetails),
        id,
      ]
    );

    // Sync product images: delete existing and insert new position list
    await pool.query(`DELETE FROM product_image WHERE product_uid = $1`, [id]);
    for (let i = 0; i < images.length; i++) {
      await pool.query(
        `INSERT INTO product_image (product_uid, image_url, position)
         VALUES ($1, $2, $3)`,
        [id, images[i], i]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Product PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/products/[id] — soft delete product
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Verify ownership
    const checkRes = await pool.query(
      `SELECT s.owner_uid
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       WHERE p.product_uid = $1`,
      [id]
    );

    if (!checkRes.rows[0]) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (checkRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete product by setting status to removed
    await pool.query(
      `UPDATE product SET status = 'removed' WHERE product_uid = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Product DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

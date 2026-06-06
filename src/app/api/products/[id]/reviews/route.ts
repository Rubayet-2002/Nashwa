import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const reviewsRes = await pool.query(
      `SELECT r.review_uid, r.user_uid, r.rating, r.review_text, r.created_at,
              u.username, u.profile_photo_url
       FROM product_review r
       LEFT JOIN users u ON u.uid = r.user_uid
       WHERE r.product_uid = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    return NextResponse.json({ success: true, reviews: reviewsRes.rows });
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productUid } = await params;
  const { user } = await authMe();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rating, reviewText } = await req.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Enforce that the user has a completed/fulfilled order for this product
    const orderCheck = await pool.query(
      `SELECT 1 FROM order_request o
       JOIN order_request_item oi ON oi.order_uid = o.order_uid
       WHERE o.buyer_uid = $1 AND oi.product_uid = $2 AND o.status = 'completed'
       LIMIT 1`,
      [user.uid, productUid]
    );
    if (orderCheck.rowCount === 0) {
      return NextResponse.json(
        { error: "You can only review products you have successfully purchased and received." },
        { status: 403 }
      );
    }

    const reviewUid = crypto.randomUUID();

    await pool.query("BEGIN");

    // 1. Insert review (no constraint since UNIQUE constraint has been dropped)
    await pool.query(
      `INSERT INTO product_review (review_uid, product_uid, user_uid, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [reviewUid, productUid, user.uid, rating, reviewText || null]
    );

    // 2. Update product avg_rating
    await pool.query(
      `UPDATE product 
       SET avg_rating = (
         SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,2) 
         FROM product_review 
         WHERE product_uid = $1
       )
       WHERE product_uid = $1`,
      [productUid]
    );

    // 3. Update shop avg_rating
    await pool.query(
      `UPDATE shop 
       SET avg_rating = (
         SELECT COALESCE(AVG(avg_rating), 0)::NUMERIC(3,2) 
         FROM product 
         WHERE shop_uid = (SELECT shop_uid FROM product WHERE product_uid = $1)
           AND avg_rating > 0
       )
       WHERE shop_uid = (SELECT shop_uid FROM product WHERE product_uid = $1)`,
      [productUid]
    );

    await pool.query("COMMIT");

    // Fetch product details for returning enriched data to frontend
    const productInfo = await pool.query(
      `SELECT title, (SELECT image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY position ASC LIMIT 1) AS image_url
       FROM product p
       WHERE product_uid = $1`,
      [productUid]
    );
    const productTitle = productInfo.rows[0]?.title || "";
    const productImage = productInfo.rows[0]?.image_url || null;

    const newReview = {
      review_uid: reviewUid,
      product_uid: productUid,
      rating: rating,
      review_text: reviewText || null,
      created_at: new Date().toISOString(),
      product_title: productTitle,
      product_image: productImage
    };

    return NextResponse.json({
      success: true,
      review: newReview,
      message: "Review submitted successfully!"
    });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("Error submitting review:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}

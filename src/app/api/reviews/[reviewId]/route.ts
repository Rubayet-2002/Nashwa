import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const dynamic = "force-dynamic";

// PATCH - edit a review
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;
  const { user } = await authMe();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rating, reviewText } = await req.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // Verify ownership of the review
    const reviewRes = await pool.query(
      "SELECT user_uid, product_uid FROM product_review WHERE review_uid = $1",
      [reviewId]
    );

    if (reviewRes.rowCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = reviewRes.rows[0];
    if (review.user_uid !== user.uid && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await pool.query("BEGIN");

    // 1. Update review
    await pool.query(
      `UPDATE product_review
       SET rating = $1, review_text = $2, created_at = NOW()
       WHERE review_uid = $3`,
      [rating, reviewText || null, reviewId]
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
      [review.product_uid]
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
      [review.product_uid]
    );

    await pool.query("COMMIT");

    return NextResponse.json({ success: true, message: "Review updated successfully!" });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("Error updating review:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE - delete a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;
  const { user } = await authMe();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify ownership of the review
    const reviewRes = await pool.query(
      "SELECT user_uid, product_uid FROM product_review WHERE review_uid = $1",
      [reviewId]
    );

    if (reviewRes.rowCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = reviewRes.rows[0];
    if (review.user_uid !== user.uid && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await pool.query("BEGIN");

    // 1. Delete review
    await pool.query("DELETE FROM product_review WHERE review_uid = $1", [reviewId]);

    // 2. Update product avg_rating
    await pool.query(
      `UPDATE product 
       SET avg_rating = (
         SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,2) 
         FROM product_review 
         WHERE product_uid = $1
       )
       WHERE product_uid = $1`,
      [review.product_uid]
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
      [review.product_uid]
    );

    await pool.query("COMMIT");

    return NextResponse.json({ success: true, message: "Review deleted successfully!" });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("Error deleting review:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

async function ensureReactionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_reaction (
      reaction_uid VARCHAR(50) PRIMARY KEY,
      product_uid VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
      user_uid VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
      reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (product_uid, user_uid)
    );
  `);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productUid = searchParams.get("productUid");
    if (!productUid) {
      return NextResponse.json({ message: "productUid is required" }, { status: 400 });
    }

    await ensureReactionTable();

    const { user } = await authMe();
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM product_reaction WHERE product_uid = $1`,
      [productUid],
    );
    let reacted = false;
    if (user) {
      const myReaction = await pool.query(
        `SELECT 1 FROM product_reaction WHERE product_uid = $1 AND user_uid = $2 LIMIT 1`,
        [productUid, user.uid],
      );
      reacted = myReaction.rowCount > 0;
    }

    return NextResponse.json({ success: true, count: countRes.rows[0].count, reacted });
  } catch (error) {
    console.error("product-reactions GET error:", error);
    return NextResponse.json({ message: "Failed to load reactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    await ensureReactionTable();

    const { productUid } = await request.json();
    if (!productUid) {
      return NextResponse.json({ message: "productUid is required" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const existing = await pool.query(
      `SELECT reaction_uid FROM product_reaction WHERE product_uid = $1 AND user_uid = $2`,
      [productUid, user.uid],
    );

    if (existing.rowCount > 0) {
      await pool.query(
        `DELETE FROM product_reaction WHERE product_uid = $1 AND user_uid = $2`,
        [productUid, user.uid],
      );
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS count FROM product_reaction WHERE product_uid = $1`,
        [productUid],
      );
      return NextResponse.json({ success: true, reacted: false, count: countRes.rows[0].count });
    }

    const reactionUid = crypto.randomUUID();
    await pool.query(
      `INSERT INTO product_reaction (reaction_uid, product_uid, user_uid, reaction_type)
       VALUES ($1, $2, $3, 'like')`,
      [reactionUid, productUid, user.uid],
    );

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM product_reaction WHERE product_uid = $1`,
      [productUid],
    );

    return NextResponse.json({ success: true, reacted: true, count: countRes.rows[0].count });
  } catch (error) {
    console.error("product-reactions POST error:", error);
    return NextResponse.json({ message: "Failed to save reaction" }, { status: 500 });
  }
}

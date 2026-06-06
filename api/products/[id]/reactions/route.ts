import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET — fetch reactions count and whether user has reacted
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM product_reaction WHERE product_uid = $1`, [id]);
    const count = parseInt(countRes.rows[0].count);
    let reacted = false;
    let isOwner = false;
    
    const shopRes = await pool.query(
      `SELECT s.owner_uid FROM product p JOIN shop s ON s.shop_uid = p.shop_uid WHERE p.product_uid = $1`,
      [id]
    );
    
    if (user) {
      const r = await pool.query(`SELECT 1 FROM product_reaction WHERE product_uid = $1 AND user_uid = $2`, [id, user.uid]);
      reacted = r.rowCount! > 0;
      isOwner = shopRes.rows[0]?.owner_uid === user.uid;
    }
    return NextResponse.json({ count, reacted, isOwner });
  } catch (err) {
    return NextResponse.json({ count: 0, reacted: false, isOwner: false });
  }
}

// POST — toggle like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const shopRes = await pool.query(
      `SELECT s.owner_uid FROM product p JOIN shop s ON s.shop_uid = p.shop_uid WHERE p.product_uid = $1`,
      [id]
    );
    const isOwner = shopRes.rows[0]?.owner_uid === user.uid;

    const existing = await pool.query(`SELECT reaction_uid FROM product_reaction WHERE product_uid = $1 AND user_uid = $2`, [id, user.uid]);
    let reacted: boolean;

    if (existing.rowCount! > 0) {
      await pool.query(`DELETE FROM product_reaction WHERE product_uid = $1 AND user_uid = $2`, [id, user.uid]);
      await pool.query(`UPDATE product SET like_count = GREATEST(0, like_count - 1) WHERE product_uid = $1`, [id]);
      reacted = false;
    } else {
      await pool.query(`INSERT INTO product_reaction (reaction_uid, product_uid, user_uid) VALUES ($1, $2, $3)`, [crypto.randomUUID(), id, user.uid]);
      await pool.query(`UPDATE product SET like_count = like_count + 1 WHERE product_uid = $1`, [id]);
      reacted = true;
    }

    const countRes = await pool.query(`SELECT like_count FROM product WHERE product_uid = $1`, [id]);
    const count = countRes.rows[0]?.like_count || 0;

    // Broadcast via Socket.io
    if (global.io) {
      global.io.to(`product:${id}`).emit("product:like", { productId: id, count, reacted, userId: user.uid });
    }

    return NextResponse.json({ count, reacted, isOwner });
  } catch (err) {
    console.error("Reaction error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

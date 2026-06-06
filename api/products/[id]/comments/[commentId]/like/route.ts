import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await pool.query(`SELECT 1 FROM comment_reaction WHERE comment_uid = $1 AND user_uid = $2`, [commentId, user.uid]);
    if (existing.rowCount! > 0) {
      await pool.query(`DELETE FROM comment_reaction WHERE comment_uid = $1 AND user_uid = $2`, [commentId, user.uid]);
      await pool.query(`UPDATE product_comment SET like_count = GREATEST(0, like_count - 1) WHERE comment_uid = $1`, [commentId]);
      return NextResponse.json({ liked: false });
    } else {
      await pool.query(`INSERT INTO comment_reaction (comment_uid, user_uid) VALUES ($1, $2)`, [commentId, user.uid]);
      await pool.query(`UPDATE product_comment SET like_count = like_count + 1 WHERE comment_uid = $1`, [commentId]);
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error("Comment like error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

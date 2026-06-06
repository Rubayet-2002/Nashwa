import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET comments for a product
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  try {
    const commentsRes = await pool.query(`
      SELECT comment_uid, product_uid, author_uid, author_role, author_name,
             author_photo_url, comment_text, parent_comment_uid, reply_to_name,
             like_count, created_at
      FROM product_comment
      WHERE product_uid = $1
      ORDER BY created_at ASC
    `, [id]);

    let liked_comment_uids: string[] = [];
    if (user) {
      const likeRes = await pool.query(`SELECT comment_uid FROM comment_reaction WHERE user_uid = $1`, [user.uid]);
      liked_comment_uids = likeRes.rows.map(r => r.comment_uid);
    }

    return NextResponse.json({ comments: commentsRes.rows, liked_comment_uids });
  } catch (err) {
    console.error("Comments GET error:", err);
    return NextResponse.json({ comments: [], liked_comment_uids: [] });
  }
}

// POST a comment or reply
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, activeShopUid } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { commentText, parentCommentUid, replyToName } = await req.json();
    if (!commentText?.trim()) return NextResponse.json({ error: "Comment text required" }, { status: 400 });

    let author_role = "customer";
    let author_name = "";
    let author_photo_url: string | null = null;

    if (activeShopUid) {
      const shopRes = await pool.query(
        "SELECT shop_name, profile_photo_url FROM shop WHERE shop_uid = $1",
        [activeShopUid]
      );
      if (shopRes.rows[0]) {
        author_role = "seller";
        author_name = shopRes.rows[0].shop_name;
        author_photo_url = shopRes.rows[0].profile_photo_url || null;
      }
    }

    if (author_role === "customer") {
      const userRes = await pool.query(`SELECT username, profile_photo_url FROM users WHERE uid = $1`, [user.uid]);
      if (!userRes.rows[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });
      author_name = userRes.rows[0].username;
      author_photo_url = userRes.rows[0].profile_photo_url || null;
    }

    let reply_to_name: string | null = replyToName || null;
    if (parentCommentUid && !reply_to_name) {
      const parentRes = await pool.query(
        `SELECT author_name FROM product_comment WHERE comment_uid = $1 AND product_uid = $2`,
        [parentCommentUid, id]
      );
      if (parentRes.rows[0]) {
        reply_to_name = parentRes.rows[0].author_name;
      }
    }

    const commentUid = crypto.randomUUID();
    await pool.query(`
      INSERT INTO product_comment (comment_uid, product_uid, author_uid, author_role, author_name, author_photo_url, comment_text, parent_comment_uid, reply_to_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [commentUid, id, user.uid, author_role, author_name, author_photo_url, commentText.trim(), parentCommentUid || null, reply_to_name]);

    const newComment = {
      comment_uid: commentUid,
      product_uid: id,
      author_uid: user.uid,
      author_role: author_role,
      author_name: author_name,
      author_photo_url: author_photo_url,
      comment_text: commentText.trim(),
      parent_comment_uid: parentCommentUid || null,
      reply_to_name,
      like_count: 0,
      created_at: new Date().toISOString(),
    };

    // Broadcast real-time
    if (global.io) {
      global.io.to(`product:${id}`).emit("comment:new", newComment);
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err) {
    console.error("Comment POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

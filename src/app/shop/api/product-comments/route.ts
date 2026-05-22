import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

async function ensureCommentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_comment (
      comment_uid VARCHAR(50) PRIMARY KEY,
      product_uid VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
      author_uid VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
      author_role VARCHAR(20) NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      comment_text TEXT NOT NULL,
      parent_comment_uid VARCHAR(50) REFERENCES product_comment(comment_uid) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function verifyShopOwnership(productUid: string, userUid: string) {
  const result = await pool.query(
    `SELECT s.owner_uid
     FROM product p
     JOIN shop s ON s.shop_uid = p.shop_uid
     WHERE p.product_uid = $1`,
    [productUid],
  );
  return result.rowCount > 0 && result.rows[0].owner_uid === userUid;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productUid = searchParams.get("productUid");

    if (!productUid) {
      return NextResponse.json({ message: "productUid is required" }, { status: 400 });
    }

    await ensureCommentsTable();

    const commentsRes = await pool.query(
      `SELECT comment_uid, product_uid, author_uid, author_role, author_name, comment_text, parent_comment_uid, created_at
       FROM product_comment
       WHERE product_uid = $1
       ORDER BY created_at ASC`,
      [productUid],
    );

    return NextResponse.json({ success: true, comments: commentsRes.rows });
  } catch (error) {
    console.error("product-comments GET error:", error);
    return NextResponse.json({ message: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    await ensureCommentsTable();

    const body = await request.json();
    const action = body?.action;
    const productUid = body?.productUid as string;
    const commentText = (body?.commentText as string | undefined)?.trim();
    const parentCommentUid = (body?.parentCommentUid as string | undefined)?.trim() || null;

    if (!productUid || !commentText) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const productRes = await pool.query(
      `SELECT p.product_uid, s.owner_uid
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       WHERE p.product_uid = $1`,
      [productUid],
    );

    if (productRes.rowCount === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const isOwner = productRes.rows[0].owner_uid === user.uid;
    const commentUid = crypto.randomUUID();

    if (action === "reply") {
      if (!parentCommentUid) {
        return NextResponse.json({ message: "parentCommentUid is required" }, { status: 400 });
      }

      await client.query("BEGIN");
      const parentRes = await client.query(
        `SELECT comment_uid, author_role, parent_comment_uid FROM product_comment WHERE comment_uid = $1 AND product_uid = $2`,
        [parentCommentUid, productUid],
      );
      if (parentRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ message: "Parent comment not found" }, { status: 404 });
      }

      const parentAuthorRole = parentRes.rows[0].author_role;

      // Allow replies when: user is shop owner, OR user is a customer replying to a seller/owner comment
      if (!isOwner) {
        if (parentAuthorRole !== "seller") {
          await client.query("ROLLBACK");
          return NextResponse.json({ message: "Only the shop owner can reply to customer comments" }, { status: 403 });
        }
      }

      // Insert reply (attach to the provided parent)
      await client.query(
        `INSERT INTO product_comment (
          comment_uid, product_uid, author_uid, author_role, author_name, comment_text, parent_comment_uid
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          commentUid,
          productUid,
          user.uid,
          user.role || "customer",
          user.username,
          commentText,
          parentCommentUid,
        ],
      );
      await client.query("COMMIT");

      return NextResponse.json({ success: true, commentUid });
    }

    if (action !== "comment") {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO product_comment (
        comment_uid, product_uid, author_uid, author_role, author_name, comment_text, parent_comment_uid
      ) VALUES ($1,$2,$3,$4,$5,$6,NULL)`,
      [commentUid, productUid, user.uid, user.role || "customer", user.username, commentText],
    );
    await client.query("COMMIT");

    return NextResponse.json({ success: true, commentUid });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {}
    console.error("product-comments POST error:", error);
    return NextResponse.json({ message: "Failed to save comment" }, { status: 500 });
  } finally {
    client.release();
  }
}

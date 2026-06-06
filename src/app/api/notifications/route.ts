import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET notifications for current user or shop
export async function GET(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread_only") === "true";
  const shopUid = searchParams.get("shopUid");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let whereClause = "";
    let queryParams: any[] = [];

    if (shopUid) {
      // Verify shop ownership
      const shopCheck = await pool.query(
        "SELECT 1 FROM shop WHERE shop_uid = $1 AND owner_uid = $2",
        [shopUid, user.uid]
      );
      if (shopCheck.rowCount === 0) {
        return NextResponse.json({ error: "Unauthorized shop access" }, { status: 403 });
      }
      whereClause = "WHERE n.shop_uid = $1";
      queryParams = [shopUid];
    } else {
      whereClause = "WHERE n.user_uid = $1 AND n.shop_uid IS NULL";
      queryParams = [user.uid];
    }

    if (unreadOnly) {
      whereClause += " AND n.is_read = FALSE";
    }

    const res = await pool.query(`
      SELECT n.notif_uid, n.type, n.title, n.body, n.link, n.image_url, n.is_read, n.created_at
      FROM notification n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, limit, offset]);

    const countQuery = `
      SELECT COUNT(*)
      FROM notification n
      ${whereClause.replace("AND n.is_read = FALSE", "")} AND n.is_read = FALSE
    `;
    const unreadRes = await pool.query(countQuery, queryParams);
    const total_unread = parseInt(unreadRes.rows[0].count);

    return NextResponse.json({ notifications: res.rows, total_unread });
  } catch (err) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — mark all as read for user or shop
export async function PATCH(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { shopUid } = await req.json().catch(() => ({ shopUid: null }));

    if (shopUid) {
      // Verify shop ownership
      const shopCheck = await pool.query(
        "SELECT 1 FROM shop WHERE shop_uid = $1 AND owner_uid = $2",
        [shopUid, user.uid]
      );
      if (shopCheck.rowCount === 0) {
        return NextResponse.json({ error: "Unauthorized shop access" }, { status: 403 });
      }
      await pool.query(
        `UPDATE notification SET is_read = TRUE WHERE shop_uid = $1 AND is_read = FALSE`,
        [shopUid]
      );
    } else {
      await pool.query(
        `UPDATE notification SET is_read = TRUE WHERE user_uid = $1 AND shop_uid IS NULL AND is_read = FALSE`,
        [user.uid]
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notifications PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

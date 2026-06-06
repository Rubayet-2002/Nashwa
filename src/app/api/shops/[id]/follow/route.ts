import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// POST — toggle follow
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await pool.query(`SELECT 1 FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2`, [id, user.uid]);
    if (existing.rowCount! > 0) {
      await pool.query(`DELETE FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2`, [id, user.uid]);
      await pool.query(`UPDATE shop SET follower_count = GREATEST(0, follower_count - 1) WHERE shop_uid = $1`, [id]);
      return NextResponse.json({ following: false });
    } else {
      await pool.query(`INSERT INTO shop_follow (shop_uid, user_uid) VALUES ($1, $2)`, [id, user.uid]);
      await pool.query(`UPDATE shop SET follower_count = follower_count + 1 WHERE shop_uid = $1`, [id]);

      // Notification to shop owner
      const shopRes = await pool.query(`SELECT owner_uid, shop_name FROM shop WHERE shop_uid = $1`, [id]);
      if (shopRes.rows[0]) {
        const notifUid = crypto.randomUUID();
        const userRes = await pool.query(`SELECT username FROM users WHERE uid = $1`, [user.uid]);
        const followerName = userRes.rows[0]?.username || "Someone";
        await pool.query(`
          INSERT INTO notification (notif_uid, user_uid, shop_uid, type, title, body, link)
          VALUES ($1, $2, $3, 'follow', $4, $5, $6)
        `, [notifUid, shopRes.rows[0].owner_uid, id, "New Follower", `${followerName} started following your shop`, `/shop/${id}`]);

        if (global.io) {
          global.io.to(`user:${shopRes.rows[0].owner_uid}`).emit("notification:new", { title: `${followerName} started following your shop`, unread: 1, shopUid: id });
        }
      }

      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error("Follow error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — check follow status
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ following: false, follower_count: 0 });
  const r = await pool.query(`SELECT 1 FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2`, [id, user.uid]);
  const shopR = await pool.query(`SELECT follower_count FROM shop WHERE shop_uid = $1`, [id]);
  return NextResponse.json({ following: r.rowCount! > 0, follower_count: shopR.rows[0]?.follower_count || 0 });
}

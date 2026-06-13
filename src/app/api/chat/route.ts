import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";



export async function GET(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shopUid = searchParams.get("shopUid");
  const customerUid = searchParams.get("customerUid");
  const listThreads = searchParams.get("listThreads") === "true";
  const unreadCountParam = searchParams.get("unreadCount") === "true";

  try {
    if (unreadCountParam) {
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS unread_count FROM chat_message WHERE receiver_uid = $1 AND sender_role = 'seller' AND is_read = FALSE`,
        [user.uid]
      );
      return NextResponse.json({ success: true, unread_count: countRes.rows[0].unread_count });
    }

    

    if (listThreads) {
      if (!shopUid) {
        

        const threadsRes = await pool.query(
          `WITH user_chats AS (
             SELECT DISTINCT ON (shop_uid)
               shop_uid,
               message_text,
               created_at
             FROM chat_message
             WHERE (sender_uid = $1 AND sender_role = 'customer') OR (receiver_uid = $1 AND sender_role = 'seller')
             ORDER BY shop_uid, created_at DESC
           )
           SELECT uc.shop_uid, s.shop_name, s.profile_photo_url AS shop_avatar,
                  uc.message_text AS last_message, uc.created_at AS last_message_time,
                  (SELECT COUNT(*)::int FROM chat_message WHERE shop_uid = uc.shop_uid AND receiver_uid = $1 AND sender_role = 'seller' AND is_read = FALSE) AS unread_count
           FROM user_chats uc
           JOIN shop s ON s.shop_uid = uc.shop_uid
           ORDER BY uc.created_at DESC`,
          [user.uid]
        );
        return NextResponse.json({ success: true, threads: threadsRes.rows });
      } else {
        

        const shopRes = await pool.query(`SELECT owner_uid FROM shop WHERE shop_uid = $1`, [shopUid]);
        if (!shopRes.rows[0]) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        if (shopRes.rows[0].owner_uid !== user.uid) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const threadsRes = await pool.query(
          `WITH threads AS (
             SELECT 
               CASE WHEN sender_uid = $2 THEN receiver_uid ELSE sender_uid END AS customer_uid,
               message_text,
               created_at
             FROM chat_message
             WHERE shop_uid = $1
           ),
           latest_msg AS (
             SELECT DISTINCT ON (customer_uid) customer_uid, message_text, created_at
             FROM threads
             ORDER BY customer_uid, created_at DESC
           )
           SELECT lm.customer_uid, u.username AS customer_name, u.profile_photo_url AS customer_avatar, 
                  lm.message_text AS last_message, lm.created_at AS last_message_time,
                  (SELECT COUNT(*)::int FROM chat_message WHERE shop_uid = $1 AND sender_uid = lm.customer_uid AND receiver_uid = $2 AND sender_role = 'customer' AND is_read = FALSE) AS unread_count
           FROM latest_msg lm
           JOIN users u ON u.uid = lm.customer_uid
           ORDER BY lm.created_at DESC`,
          [shopUid, user.uid]
        );
        return NextResponse.json({ success: true, threads: threadsRes.rows });
      }
    }

    

    if (!shopUid) {
      return NextResponse.json({ error: "shopUid required" }, { status: 400 });
    }

    const shopRes = await pool.query(
      `SELECT owner_uid, shop_name, profile_photo_url FROM shop WHERE shop_uid = $1`,
      [shopUid]
    );
    if (!shopRes.rows[0]) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const shopOwnerUid = shopRes.rows[0].owner_uid;
    const targetCustomerUid = customerUid || user.uid;

    if (user.uid !== shopOwnerUid && user.uid !== targetCustomerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messagesRes = await pool.query(
      `SELECT m.message_uid, m.sender_uid, m.receiver_uid, m.shop_uid, m.sender_role, m.message_text,
              m.message_type, m.image_url, m.product_ref_uid, m.created_at,
              u_send.username AS sender_name, u_send.profile_photo_url AS sender_avatar
       FROM chat_message m
       JOIN users u_send ON u_send.uid = m.sender_uid
       WHERE m.shop_uid = $1 AND (
         (m.sender_uid = $2 AND m.receiver_uid = $3) OR
         (m.sender_uid = $3 AND m.receiver_uid = $2)
       )
       ORDER BY m.created_at ASC`,
      [shopUid, targetCustomerUid, shopOwnerUid]
    );

    const isSellerViewParam = searchParams.get("isSellerView") === "true";

    

    if (isSellerViewParam) {
      await pool.query(
        `UPDATE chat_message SET is_read = TRUE 
         WHERE shop_uid = $1 AND receiver_uid = $2 AND sender_role = 'customer' AND is_read = FALSE`,
        [shopUid, user.uid]
      );
    } else {
      await pool.query(
        `UPDATE chat_message SET is_read = TRUE 
         WHERE shop_uid = $1 AND receiver_uid = $2 AND sender_role = 'seller' AND is_read = FALSE`,
        [shopUid, user.uid]
      );
    }

    return NextResponse.json({
      success: true,
      messages: messagesRes.rows,
      shop: shopRes.rows[0],
    });
  } catch (err) {
    console.error("Chat GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}



export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { shopUid, messageText, messageType = "text", productRefUid = null, imageUrl = null, receiverUid, isShopMode } = await req.json();
    if (!shopUid || !messageText?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shopCheck = await pool.query(`SELECT owner_uid FROM shop WHERE shop_uid = $1`, [shopUid]);
    if (!shopCheck.rows[0]) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    const shopOwnerUid = shopCheck.rows[0].owner_uid;

    const actualReceiverUid = isShopMode ? receiverUid : shopOwnerUid;
    if (!actualReceiverUid) {
      return NextResponse.json({ error: "receiverUid is required" }, { status: 400 });
    }

    if (actualReceiverUid === user.uid && !isShopMode && user.uid !== shopOwnerUid) {
      

      return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
    }

    const senderRole = isShopMode ? "seller" : "customer";
    const msgUid = crypto.randomUUID();

    await pool.query(
      `INSERT INTO chat_message (message_uid, sender_uid, receiver_uid, shop_uid, sender_role, message_type, message_text, image_url, product_ref_uid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [msgUid, user.uid, actualReceiverUid, shopUid, senderRole, messageType, messageText.trim(), imageUrl, productRefUid]
    );

    

    const insertedRes = await pool.query(
      `SELECT m.message_uid, m.sender_uid, m.receiver_uid, m.shop_uid, m.sender_role, m.message_text,
              m.message_type, m.image_url, m.product_ref_uid, m.created_at,
              u.username AS sender_name, u.profile_photo_url AS sender_avatar
       FROM chat_message m
       JOIN users u ON u.uid = m.sender_uid
       WHERE m.message_uid = $1 LIMIT 1`,
      [msgUid]
    );

    const message = insertedRes.rows[0];

    

    if (global.io) {
      const customerUid = user.uid === shopOwnerUid ? actualReceiverUid : user.uid;
      global.io.to(`chat:${shopUid}:${customerUid}`).emit("chat:message", message);
      
      

      global.io.to(`user:${actualReceiverUid}`).emit("notification:new", { 
        title: `New message from ${user.uid === shopOwnerUid ? "Shop" : user.username}`, 
        unread: 1 
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("Chat POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

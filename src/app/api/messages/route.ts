import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET /api/messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopUid = searchParams.get("shopUid");
    const customerUid = searchParams.get("customerUid");
    const listThreads = searchParams.get("listThreads") === "true";

    if (!shopUid) {
      return NextResponse.json({ message: "shopUid is required" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    // Get the shop owner UID to verify ownership / routing
    const shopRes = await pool.query(
      `SELECT owner_uid, shop_name FROM shop WHERE shop_uid = $1 LIMIT 1`,
      [shopUid]
    );

    if (shopRes.rowCount === 0) {
      return NextResponse.json({ message: "Shop not found" }, { status: 404 });
    }

    const shopOwnerUid = shopRes.rows[0].owner_uid;

    // Case 1: List all active conversation threads for a shop owner
    if (listThreads) {
      if (user.uid !== shopOwnerUid) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      // Fetch all unique customers who have exchanged messages with this shop
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
                lm.message_text AS last_message, lm.created_at AS last_message_time
         FROM latest_msg lm
         JOIN users u ON u.uid = lm.customer_uid
         ORDER BY lm.created_at DESC`,
        [shopUid, shopOwnerUid]
      );

      return NextResponse.json({ success: true, threads: threadsRes.rows });
    }

    // Case 2: Fetch message history for a specific customer thread (accessed by either shop owner or customer)
    const targetCustomerUid = customerUid || user.uid;

    if (user.uid !== shopOwnerUid && user.uid !== targetCustomerUid) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const messagesRes = await pool.query(
      `SELECT m.message_uid, m.sender_uid, m.receiver_uid, m.shop_uid, m.message_text, m.created_at,
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

    return NextResponse.json({ success: true, messages: messagesRes.rows });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ message: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/messages
export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { shopUid, receiverUid, messageText } = await request.json();
    if (!shopUid || !receiverUid || !messageText) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    // Verify shop exists and get owner
    const shopRes = await pool.query(
      `SELECT owner_uid FROM shop WHERE shop_uid = $1 LIMIT 1`,
      [shopUid]
    );
    if (shopRes.rowCount === 0) {
      return NextResponse.json({ message: "Shop not found" }, { status: 404 });
    }
    const shopOwnerUid = shopRes.rows[0].owner_uid;

    // Verify that the sender is either the customer or the shop owner, and the receiver is the other party
    if (user.uid !== shopOwnerUid && user.uid !== receiverUid && receiverUid !== shopOwnerUid) {
      return NextResponse.json({ message: "Invalid chat routing" }, { status: 400 });
    }

    const messageUid = crypto.randomUUID();
    await pool.query(
      `INSERT INTO chat_message (message_uid, sender_uid, receiver_uid, shop_uid, message_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [messageUid, user.uid, receiverUid, shopUid, messageText]
    );

    // Fetch the inserted message with sender metadata
    const insertedRes = await pool.query(
      `SELECT m.message_uid, m.sender_uid, m.receiver_uid, m.shop_uid, m.message_text, m.created_at,
              u.username AS sender_name, u.profile_photo_url AS sender_avatar
       FROM chat_message m
       JOIN users u ON u.uid = m.sender_uid
       WHERE m.message_uid = $1 LIMIT 1`,
      [messageUid]
    );

    return NextResponse.json({ success: true, message: insertedRes.rows[0] });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ message: "Failed to send message" }, { status: 500 });
  }
}

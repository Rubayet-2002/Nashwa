import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";



export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { status, messageUid } = await req.json();
    if (!["confirmed", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    

    const orderRes = await pool.query(`
      SELECT o.*, s.owner_uid FROM order_request o
      JOIN shop s ON s.shop_uid = o.shop_uid
      WHERE o.order_uid = $1
    `, [id]);
    if (!orderRes.rows[0]) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (orderRes.rows[0].owner_uid !== user.uid && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pool.query(`UPDATE order_request SET status = $1, updated_at = NOW() WHERE order_uid = $2`, [status, id]);

    

    if (status === "completed") {
      const order = orderRes.rows[0];
      await pool.query(`UPDATE shop SET platform_debt = platform_debt + $1, total_revenue = total_revenue + $2, total_sales = total_sales + 1 WHERE shop_uid = $3`, [order.platform_fee, order.total_amount, order.shop_uid]);

      

      const itemsRes = await pool.query(`SELECT product_uid, quantity FROM order_request_item WHERE order_uid = $1`, [id]);
      for (const item of itemsRes.rows) {
        await pool.query(`UPDATE product SET sold_count = sold_count + $1 WHERE product_uid = $2`, [item.quantity, item.product_uid]);
      }
    }

    

    if (messageUid) {
      const msgRes = await pool.query(`SELECT form_data FROM chat_message WHERE message_uid = $1`, [messageUid]);
      if (msgRes.rows[0] && msgRes.rows[0].form_data) {
        const fd = typeof msgRes.rows[0].form_data === "string" ? JSON.parse(msgRes.rows[0].form_data) : msgRes.rows[0].form_data;
        if (fd) {
          fd.status = status;
          await pool.query(`UPDATE chat_message SET form_data = $1 WHERE message_uid = $2`, [JSON.stringify(fd), messageUid]);

          

          if (global.io) {
            const updatedMsgRes = await pool.query(
              `SELECT m.message_uid, m.sender_uid, m.receiver_uid, m.shop_uid, m.message_text,
                      m.message_type, m.image_url, m.form_data, m.product_ref_uid, m.created_at,
                      u.username AS sender_name, u.profile_photo_url AS sender_avatar
               FROM chat_message m
               JOIN users u ON u.uid = m.sender_uid
               WHERE m.message_uid = $1 LIMIT 1`,
              [messageUid]
            );
            if (updatedMsgRes.rows[0]) {
              const customerUid = orderRes.rows[0].buyer_uid;
              global.io.to(`chat:${orderRes.rows[0].shop_uid}:${customerUid}`).emit("chat:message", updatedMsgRes.rows[0]);
            }
          }
        }
      }
    }

    

    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed! 🎉",
      cancelled: "Your order was cancelled.",
      completed: "Your order is completed! Thank you for your purchase.",
    };

    const notifUid = crypto.randomUUID();
    await pool.query(`INSERT INTO notification (notif_uid, user_uid, type, title, body, link) VALUES ($1,$2,'order_update',$3,$4,$5)`,
      [notifUid, orderRes.rows[0].buyer_uid, `Order ${status}`, statusMessages[status], `/profile?tab=orders`]);

    if (global.io) {
      global.io.to(`user:${orderRes.rows[0].buyer_uid}`).emit("notification:new", { title: statusMessages[status], unread: 1 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Order status update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

const PLATFORM_FEE_PERCENT = 0.05;

// POST — create an order
export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      shopUid, items, customerName, customerEmail, customerPhone,
      deliveryAddress, city, postalCode, note = null,
      deliveryType = "standard", paymentMethod = "cod",
      messageUid = null, // from chat order form
    } = body;

    if (!shopUid || !items?.length || !customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify shop is approved and not blocked
    const shopRes = await pool.query(`SELECT owner_uid, shop_name, is_blocked FROM shop WHERE shop_uid = $1 AND status = 'approved'`, [shopUid]);
    if (!shopRes.rows[0]) return NextResponse.json({ error: "Shop not available" }, { status: 400 });
    if (shopRes.rows[0].is_blocked) return NextResponse.json({ error: "This shop is currently unavailable" }, { status: 400 });

    // Calculate totals
    let subtotal = 0;
    const enrichedItems: any[] = [];

    for (const item of items) {
      const productRes = await pool.query(`SELECT product_uid, title, price, status, free_on_campus_delivery, inside_delivery_charge FROM product WHERE product_uid = $1 AND shop_uid = $2`, [item.productUid, shopUid]);
      if (!productRes.rows[0] || productRes.rows[0].status !== "active") {
        return NextResponse.json({ error: `Product "${item.productUid}" is not available` }, { status: 400 });
      }
      const p = productRes.rows[0];
      const lineTotal = Number(p.price) * item.quantity;
      subtotal += lineTotal;
      enrichedItems.push({ productUid: p.product_uid, productTitle: p.title, unitPrice: Number(p.price), quantity: item.quantity, variant: item.variant || null, lineTotal });
    }

    // Assuming single-product order or first product dictates delivery for now
    const firstProductRes = await pool.query(`SELECT free_on_campus_delivery, inside_delivery_charge FROM product WHERE product_uid = $1`, [items[0].productUid]);
    const pDelivery = firstProductRes.rows[0];
    const deliveryCharge = pDelivery?.free_on_campus_delivery ? 0 : Number(pDelivery?.inside_delivery_charge || 0);
    const totalAmount = subtotal + deliveryCharge;
    const platformFee = parseFloat((subtotal * PLATFORM_FEE_PERCENT).toFixed(2));

    const orderUid = crypto.randomUUID();
    await pool.query(`
      INSERT INTO order_request (order_uid, shop_uid, buyer_uid, customer_name, customer_email, customer_phone, delivery_address, city, postal_code, note, delivery_type, payment_method, subtotal, delivery_charge, total_amount, platform_fee, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending')
    `, [orderUid, shopUid, user.uid, customerName, customerEmail, customerPhone, deliveryAddress, city || null, postalCode || null, note, deliveryType, paymentMethod, subtotal, deliveryCharge, totalAmount, platformFee]);

    for (const item of enrichedItems) {
      await pool.query(`INSERT INTO order_request_item (order_uid, product_uid, product_title, variant, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [orderUid, item.productUid, item.productTitle, item.variant, item.unitPrice, item.quantity, item.lineTotal]);
    }

    // If placed from chat order form, update the chat message's form_data
    if (messageUid) {
      const mainItem = enrichedItems[0];
      const updatedFormData = {
        status: "submitted",
        order_uid: orderUid,
        product_uid: mainItem.productUid,
        product_title: mainItem.productTitle,
        unit_price: mainItem.unitPrice,
        quantity: mainItem.quantity,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        city: city || "",
        postal_code: postalCode || "",
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount,
      };

      await pool.query(
        `UPDATE chat_message SET form_data = $1 WHERE message_uid = $2`,
        [JSON.stringify(updatedFormData), messageUid]
      );

      // Emit updated message via socket
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
          global.io.to(`chat:${shopUid}:${user.uid}`).emit("chat:message", updatedMsgRes.rows[0]);
        }
      }
    }

    // Notify shop owner
    const notifUid = crypto.randomUUID();
    await pool.query(`INSERT INTO notification (notif_uid, user_uid, shop_uid, type, title, body, link) VALUES ($1,$2,$3,'order','New Order Request',$4,$5)`,
      [notifUid, shopRes.rows[0].owner_uid, shopUid, `New order request for ৳${totalAmount.toFixed(0)}`, `/shop/dashboard`]);

    if (global.io) {
      global.io.to(`user:${shopRes.rows[0].owner_uid}`).emit("notification:new", { title: "New order request!", unread: 1 });
    }

    return NextResponse.json({ success: true, orderUid, total: totalAmount });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — user's orders
export async function GET(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await pool.query(`
      SELECT o.*, s.shop_name, s.profile_photo_url AS shop_photo,
             COALESCE((SELECT json_agg(row_to_json(oi)) FROM order_request_item oi WHERE oi.order_uid = o.order_uid), '[]') AS items
      FROM order_request o
      JOIN shop s ON s.shop_uid = o.shop_uid
      WHERE o.buyer_uid = $1
      ORDER BY o.created_at DESC
    `, [user.uid]);
    return NextResponse.json({ orders: res.rows });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

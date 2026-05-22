import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const {
      shopUid,
      productUid,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      note,
    } = await request.json();

    if (!shopUid || !productUid || !customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const qty = Number(quantity ?? 1);
    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ message: "Invalid quantity" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in to place an order." }, { status: 401 });
    }

    const shopRes = await client.query(
      "SELECT shop_uid, status FROM shop WHERE shop_uid = $1",
      [shopUid],
    );
    if (shopRes.rowCount === 0 || shopRes.rows[0].status !== "approved") {
      return NextResponse.json({ message: "Shop not available" }, { status: 404 });
    }

    const productRes = await client.query(
      "SELECT product_uid, shop_uid, title, price, currency FROM product WHERE product_uid = $1 AND shop_uid = $2",
      [productUid, shopUid],
    );
    if (productRes.rowCount === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const product = productRes.rows[0];
    const totalAmount = Number(product.price) * qty;
    const orderUid = crypto.randomUUID();

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO order_request (
        order_uid, shop_uid, buyer_uid, customer_name, customer_email, customer_phone,
        delivery_address, note, total_amount, currency, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')`,
      [
        orderUid,
        shopUid,
        user.uid,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        note || null,
        totalAmount,
        product.currency || "BDT",
      ],
    );

    await client.query(
      `INSERT INTO order_request_item (
        order_uid, product_uid, product_title, unit_price, quantity, line_total
      ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [orderUid, product.product_uid, product.title, product.price, qty, totalAmount],
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true, message: "Order placed", orderUid });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("place-order error:", error);
    return NextResponse.json({ message: "Failed to place order" }, { status: 500 });
  } finally {
    client.release();
  }
}
import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

// GET /api/bids?productUid=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productUid = searchParams.get("productUid");
  if (!productUid) return NextResponse.json({ error: "productUid required" }, { status: 400 });

  try {
    const res = await pool.query(`SELECT bid_uid, product_uid, bidder_uid, amount, created_at FROM bids WHERE product_uid = $1 ORDER BY amount DESC, created_at ASC`, [productUid]);
    return NextResponse.json({ bids: res.rows });
  } catch (err) {
    console.error("Bids GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/bids — create a bid
export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { productUid, amount } = body;
    if (!productUid || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // verify product and auction status
    const pRes = await pool.query(`SELECT is_bidding, bidding_starts_at, bidding_ends_at FROM product WHERE product_uid = $1`, [productUid]);
    if (!pRes.rows[0]) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const p = pRes.rows[0];
    if (!p.is_bidding) return NextResponse.json({ error: "Bidding not enabled for this product" }, { status: 400 });

    const now = new Date();
    if (p.bidding_starts_at && new Date(p.bidding_starts_at) > now) return NextResponse.json({ error: "Bidding not started yet" }, { status: 400 });
    if (p.bidding_ends_at && new Date(p.bidding_ends_at) < now) return NextResponse.json({ error: "Bidding has ended" }, { status: 400 });

    // check current highest
    const maxRes = await pool.query(`SELECT MAX(amount) AS max_amount FROM bids WHERE product_uid = $1`, [productUid]);
    const max = maxRes.rows[0]?.max_amount ? parseFloat(maxRes.rows[0].max_amount) : 0;
    if (parseFloat(amount) <= max) return NextResponse.json({ error: "Bid must be higher than current highest bid" }, { status: 400 });

    const bidUid = crypto.randomUUID();
    await pool.query(`INSERT INTO bids (bid_uid, product_uid, bidder_uid, amount) VALUES ($1,$2,$3,$4)`, [bidUid, productUid, user.uid, amount]);

    // notify shop owner about new bid (optional)
    const shopRes = await pool.query(`SELECT s.owner_uid FROM product p JOIN shop s ON s.shop_uid = p.shop_uid WHERE p.product_uid = $1`, [productUid]);
    if (shopRes.rows[0] && (global as any).io) {
      const ownerUid = shopRes.rows[0].owner_uid;
      (global as any).io.to(`user:${ownerUid}`).emit("notification:new", { title: "New bid received", body: `Your product received a new bid of ${amount}` });
    }
    // emit product-level bid event for product rooms
    try {
      if ((global as any).io) (global as any).io.to(`product:${productUid}`).emit("product:bid", { productId: productUid, amount });
    } catch (e) {
      console.error("Socket emit error (product:bid)", e);
    }

    return NextResponse.json({ success: true, bidUid });
  } catch (err) {
    console.error("Bids POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

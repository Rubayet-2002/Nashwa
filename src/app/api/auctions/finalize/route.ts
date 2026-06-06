import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { sendNotification } from "@/lib/notify";

// POST /api/auctions/finalize
export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { productUid } = body;
    if (!productUid) return NextResponse.json({ error: "productUid required" }, { status: 400 });

    // verify ownership (only shop owner can finalize)
    const checkRes = await pool.query(`SELECT p.product_uid, p.is_bidding, p.bidding_ends_at, s.owner_uid FROM product p JOIN shop s ON s.shop_uid = p.shop_uid WHERE p.product_uid = $1`, [productUid]);
    if (!checkRes.rows[0]) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const p = checkRes.rows[0];
    if (p.owner_uid !== user.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!p.is_bidding) return NextResponse.json({ error: "Not an auction product" }, { status: 400 });

    const now = new Date();
    if (p.bidding_ends_at && new Date(p.bidding_ends_at) > now) return NextResponse.json({ error: "Bidding not ended yet" }, { status: 400 });

    // find highest bid
    const bidRes = await pool.query(`SELECT bid_uid, bidder_uid, amount FROM bids WHERE product_uid = $1 ORDER BY amount DESC, created_at ASC LIMIT 1`, [productUid]);
    if (!bidRes.rows[0]) {
      return NextResponse.json({ success: true, message: "No bids placed" });
    }
    const top = bidRes.rows[0];

    // mark product as removed so it no longer appears
    await pool.query(`UPDATE product SET status = 'removed' WHERE product_uid = $1`, [productUid]);

    // notify winner
    const link = `/product/${productUid}`;
    await sendNotification({ userUid: top.bidder_uid, type: 'auction_win', title: 'You won the auction!', body: `You won the auction for this product with a bid of ${top.amount}. Please place your order.`, link });

    // notify shop owner
    await sendNotification({ userUid: user.uid, type: 'auction_finalized', title: 'Auction finalized', body: `Auction finalized. Winner: ${top.bidder_uid} with ${top.amount}.`, link });

    return NextResponse.json({ success: true, winner: top });
  } catch (err) {
    console.error("Auction finalize error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

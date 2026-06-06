import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET /api/products — list shop's products (for dashboard)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopUid = searchParams.get("shopUid");
  if (!shopUid) return NextResponse.json({ error: "shopUid required" }, { status: 400 });

  try {
    const res = await pool.query(`
      SELECT p.*,
             COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
             (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC LIMIT 1) AS image_url
      FROM product p
      WHERE p.shop_uid = $1 AND p.status != 'removed'
      ORDER BY p.created_at DESC
    `, [shopUid]);
    return NextResponse.json({ products: res.rows });
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/products — create a product
export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      shopUid, title, description, category, price, originalPrice,
      discountPercent, currency = "BDT",
      insideDeliveryCharge = 0, outsideDeliveryCharge = 0,
      freeOnCampusDelivery = false, variants = [], productDetails = [],
      eventUid, productType = "regular",
      images = [], // array of base64 strings (already cropped on client)
    } = body;

    if (!shopUid || !title || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const shopRes = await pool.query(`SELECT owner_uid, status, is_blocked FROM shop WHERE shop_uid = $1`, [shopUid]);
    if (!shopRes.rows[0] || shopRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (shopRes.rows[0].status !== "approved") {
      return NextResponse.json({ error: "Shop not approved" }, { status: 403 });
    }
    if (shopRes.rows[0].is_blocked) {
      return NextResponse.json({ error: "Shop is blocked due to unpaid platform fees" }, { status: 403 });
    }

    // Determine product status
    let status: string = "active";
    let finalProductType = productType;
    if (eventUid) {
      status = "event_pending";
      finalProductType = "event";
    }

    const productUid = crypto.randomUUID();
    await pool.query(`
      INSERT INTO product (product_uid, shop_uid, title, description, category,
        product_type, price, original_price, discount_percent, currency,
        inside_delivery_charge, outside_delivery_charge, free_on_campus_delivery,
        variants, product_details, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    `, [
      productUid, shopUid, title, description || null, category || null,
      finalProductType, price, originalPrice || null, discountPercent || 0, currency,
      insideDeliveryCharge, outsideDeliveryCharge, freeOnCampusDelivery,
      JSON.stringify(variants), JSON.stringify(productDetails), status,
    ]);

    // Upload images to Cloudinary or save URLs directly
    for (let i = 0; i < images.length; i++) {
      try {
        const imgStr = images[i];
        if (imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
          // Direct URL (already uploaded client-side)
          await pool.query(`INSERT INTO product_image (product_uid, image_url, position) VALUES ($1, $2, $3)`, [productUid, imgStr, i]);
        } else {
          // Base64 string
          const { url } = await uploadToCloudinary(imgStr, `nashwa/products/${shopUid}`, { width: 1000, height: 1000, crop: "limit", quality: 85 });
          await pool.query(`INSERT INTO product_image (product_uid, image_url, position) VALUES ($1, $2, $3)`, [productUid, url, i]);
        }
      } catch (err) {
        console.error("Image upload/save error:", err);
      }
    }

    // If event product, create event_product record
    if (eventUid) {
      await pool.query(`
        INSERT INTO event_product (event_uid, product_uid, shop_uid, status)
        VALUES ($1, $2, $3, 'pending')
        ON CONFLICT (event_uid, product_uid) DO NOTHING
      `, [eventUid, productUid, shopUid]);
    }

    return NextResponse.json({ success: true, productUid });
  } catch (err) {
    console.error("Product create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

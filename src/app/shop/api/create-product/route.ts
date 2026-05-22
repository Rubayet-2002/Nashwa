import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { shopUid, title, description, price, currency, images } = await request.json();
    if (!shopUid || !title || !price || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const shopRes = await pool.query("SELECT owner_uid FROM shop WHERE shop_uid = $1", [shopUid]);
    if (shopRes.rowCount === 0 || shopRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const productUid = crypto.randomUUID();

    await pool.query("BEGIN");
    await pool.query(
      `INSERT INTO product (product_uid, shop_uid, title, description, price, currency) VALUES ($1,$2,$3,$4,$5,$6)`,
      [productUid, shopUid, title, description || null, price, currency || 'BDT'],
    );

    let pos = 0;
    for (const img of images) {
      await pool.query(
        `INSERT INTO product_image (product_uid, image_url, position) VALUES ($1,$2,$3)`,
        [productUid, img, pos++],
      );
    }

    await pool.query("COMMIT");

    return NextResponse.json({ success: true, message: "Product created", productUid });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("create-product error:", error);
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 });
  }
}

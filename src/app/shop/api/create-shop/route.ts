import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { cookies } from "next/headers";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import { CreateShopPayload } from "@/app/shop/create-shop/lib/utils";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed." },
        { status: 403 },
      );
    }

    const { nidPdfUrl, coverPhotoUrl, profilePhotoUrl } = await request.json();
    if (!nidPdfUrl || !coverPhotoUrl || !profilePhotoUrl) {
      return NextResponse.json(
        { message: "Cover photo, profile photo, and NID document are required." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("create-shop-token")?.value;
    if (!token) {
      return NextResponse.json(
        { 
          message: "Session expired. Please restart.", 
          redirect: "/shop/create-shop" 
        },
        { status: 400 },
      );
    }
    const payload = (await verifyJWT(token)) as CreateShopPayload | null;

    if (
      !payload ||
      !payload.shopName ||
      !payload.shopEmail ||
      !payload.shopPhone ||
      !payload.location ||
      !payload.description
    ) {
      const response = NextResponse.json(
        {
          message: "Session expired or incomplete data. Please restart.",
          redirect: "/shop/create-shop",
        },
        { status: 400 },
      );
      response.cookies.delete("create-shop-token");
      return response;
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    if (user.owned_shops && user.owned_shops.length >= 2) {
      return NextResponse.json(
        { message: "Store limit reached (Max 2)." },
        { status: 400 },
      );
    }

    const shop_uid = crypto.randomUUID();

    await pool.query("BEGIN");
    await pool.query(
      `INSERT INTO shop (
        shop_uid, owner_uid, shop_name, shop_email, shop_phone,
        shop_location, shop_description, cover_photo_url, profile_photo_url, nid_pdf_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
      [
        shop_uid,
        user.uid,
        payload.shopName,
        payload.shopEmail,
        payload.shopPhone,
        payload.location,
        payload.description,
        coverPhotoUrl,
        profilePhotoUrl,
        nidPdfUrl,
      ],
    );
    await pool.query("COMMIT");

    const response = NextResponse.json({
      success: true,
      message: "Shop requested successfully!",
    });

    response.cookies.delete("create-shop-token");
    return response;
  } catch (error: any) {
    await pool.query("ROLLBACK");
    console.error("Error creating shop:", error);
    return NextResponse.json(
      { message: "Failed to submit request." },
      { status: 500 },
    );
  }
}

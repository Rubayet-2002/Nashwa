import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { imageUrl, shopUid } = await request.json();
    if (!imageUrl) return NextResponse.json({ message: "Image URL required" }, { status: 400 });

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const shopRes = await pool.query("SELECT owner_uid FROM shop WHERE shop_uid = $1", [shopUid]);
    if (shopRes.rowCount === 0 || shopRes.rows[0].owner_uid !== user.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await pool.query("UPDATE shop SET profile_photo_url = $1 WHERE shop_uid = $2", [imageUrl, shopUid]);

    return NextResponse.json({ success: true, message: "Profile photo updated", imageUrl });
  } catch (error) {
    console.error("update-profile error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

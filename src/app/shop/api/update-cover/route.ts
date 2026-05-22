## Error Type
Build Error

## Error Message
Module not found: Can't resolve '@/image/shopCover.png'

## Build Output
./src/app/(nashwa)/page.tsx:4:1
Module not found: Can't resolve '@/image/shopCover.png'
  2 | import Link from "next/link";
  3 | import pool from "@/database/pool";
> 4 | import shopCover from "@/image/shopCover.png";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  5 | import shopProfile from "@/image/shopProfile.png";
  6 | import { Store, Pin } from "@mynaui/icons-react";
  7 |

Import map: aliased to relative './src/image/shopCover.png' inside of [project]/

https://nextjs.org/docs/messages/module-not-found

Next.js version: 16.2.6 (Turbopack)
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

    await pool.query("UPDATE shop SET cover_photo_url = $1 WHERE shop_uid = $2", [imageUrl, shopUid]);

    return NextResponse.json({ success: true, message: "Cover photo updated", imageUrl });
  } catch (error) {
    console.error("update-cover error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

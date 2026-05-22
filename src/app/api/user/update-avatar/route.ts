import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      console.error('update-avatar: failed to parse JSON body', e);
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { imageUrl } = body;
    if (!imageUrl) return NextResponse.json({ message: "Image URL required" }, { status: 400 });

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    console.log('update-avatar: user', user);
    console.log('update-avatar: imageUrl', imageUrl);

    await pool.query(
      "UPDATE users SET profile_photo_url = $1 WHERE uid = $2",
      [imageUrl, user.uid],
    );

    return NextResponse.json({ success: true, message: "Profile photo updated", imageUrl });
  } catch (error) {
    console.error("update-avatar error:", error && (error.stack || error));
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

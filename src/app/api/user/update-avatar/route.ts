import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) return NextResponse.json({ message: "Image URL required" }, { status: 400 });

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await pool.query(
      "UPDATE users SET avatar_url = $1, profile_photo_url = $1 WHERE uid = $2",
      [imageUrl, user.uid],
    );

    return NextResponse.json({ success: true, message: "Profile photo updated", imageUrl });
  } catch (error) {
    console.error("update-avatar error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

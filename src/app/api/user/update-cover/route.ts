import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { imageUrl } = await request.json();
    if (!imageUrl) return NextResponse.json({ message: "Image URL required" }, { status: 400 });

    await pool.query(
      "UPDATE users SET cover_photo_url = $1 WHERE uid = $2",
      [imageUrl, user.uid]
    );

    return NextResponse.json({ success: true, message: "Cover photo updated", imageUrl });
  } catch (error) {
    console.error("Update cover error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { user } = await authMe();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await pool.query(
      "UPDATE users SET cover_photo_url = NULL WHERE uid = $1",
      [user.uid]
    );

    return NextResponse.json({ success: true, message: "Cover photo removed" });
  } catch (error) {
    console.error("Remove cover error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

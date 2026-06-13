import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
    }

    

    const userRes = await pool.query("SELECT password_hash FROM users WHERE uid = $1", [user.uid]);
    if (userRes.rowCount === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const dbHash = userRes.rows[0].password_hash;

    

    if (dbHash) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password is required." }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, dbHash);
      if (!isMatch) {
        return NextResponse.json({ message: "Incorrect current password." }, { status: 400 });
      }
    }

    

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE uid = $2", [hashed, user.uid]);

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}

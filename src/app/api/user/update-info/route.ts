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
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { username, email, phone } = await request.json();

    if (!username?.trim() || !email?.trim()) {
      return NextResponse.json({ message: "Username and Email are required." }, { status: 400 });
    }

    // 1. Verify email uniqueness
    const emailCheck = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 AND uid != $2",
      [email.trim().toLowerCase(), user.uid]
    );
    if (emailCheck.rowCount! > 0) {
      return NextResponse.json({ message: "Email is already in use by another account." }, { status: 409 });
    }

    // 2. Verify phone uniqueness if provided
    const trimmedPhone = phone?.trim() || null;
    if (trimmedPhone) {
      const phoneCheck = await pool.query(
        "SELECT 1 FROM users WHERE phone = $1 AND uid != $2",
        [trimmedPhone, user.uid]
      );
      if (phoneCheck.rowCount! > 0) {
        return NextResponse.json({ message: "Phone number is already in use by another account." }, { status: 409 });
      }
    }

    // 3. Perform update
    await pool.query(
      `UPDATE users
       SET username = $1, email = $2, phone = $3
       WHERE uid = $4`,
      [username.trim(), email.trim().toLowerCase(), trimmedPhone, user.uid]
    );

    return NextResponse.json({
      success: true,
      message: "Profile information updated successfully.",
      user: { username, email, phone: trimmedPhone },
    });
  } catch (error) {
    console.error("Update info error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await pool.query(
      `SELECT uid, username, email, phone, address, city, postal_code
       FROM users
       WHERE uid = $1`,
      [user.uid]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error) {
    console.error("GET user info error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

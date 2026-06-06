import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed." },
        { status: 403 },
      );
    }

    const { admin_email, password } = await request.json();
    const configuredAdminEmail = process.env.ADMIN_EMAIL || "admin@nashwa.com";
    const configuredAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!admin_email || !password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 },
      );
    }

    if (admin_email !== configuredAdminEmail || password !== configuredAdminPassword) {
      return NextResponse.json(
        { message: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const adminRes = await pool.query(
      "SELECT uid AS admin_uid, email AS admin_email FROM users WHERE email = $1 AND role = 'admin'",
      [admin_email],
    );

    if ((adminRes.rowCount ?? 0) === 0) {
      return NextResponse.json(
        { message: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const admin = adminRes.rows[0];

    const payload = {
      admin_uid: admin.admin_uid,
      admin_email: admin.admin_email,
      role: "admin",
    };

    const adminToken = await issueJWT(payload, "1d");

    const response = NextResponse.json({
      success: true,
      message: "Admin login successful!",
      redirect: "/admin/dashboard",
    });

    setTokenCookie(response, "admin-token", adminToken, 24 * 60 * 60);

    return response;
  } catch (error) {
    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

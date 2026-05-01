import { NextResponse } from "next/server";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { passwordCheck } from "../../lib/inputValidation";
import { verifyJWT } from "../../lib/jwtUtils";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    const resetToken = cookieStore.get("password-reset-token")?.value;

    if (!resetToken) {
      return NextResponse.json(
        { message: "Unauthorized: No reset token" },
        { status: 401 },
      );
    }

    const payload = resetToken ? await verifyJWT(resetToken) : null;

    if (!payload || payload.purpose !== "reset-password") {
      return NextResponse.json(
        { message: "Unauthorized or expired session" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { password } = body;

    const validation = passwordCheck.safeParse({ password });
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const uid = payload.uid as string;
    const hashedPassword = await bcrypt.hash(password, 12);

    await client.query("BEGIN");
    transactionActive = true;

    const userUpdate = await client.query(
      "UPDATE users SET password_hash = $1 WHERE uid = $2 RETURNING email",
      [hashedPassword, uid],
    );

    if (userUpdate.rowCount === 0) {
      throw new Error("User not found");
    }

    const email = userUpdate.rows[0].email;

    await client.query(
      "UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE",
      [uid],
    );

    await client.query("DELETE FROM otp WHERE email = $1 OR user_id = $2", [
      email,
      uid,
    ]);

    await client.query("COMMIT");
    transactionActive = false;

    const response = NextResponse.json({
      success: true,
      message:
        "Password changed successfully! Please login with your new password.",
      redirect: "/account-email",
    });

    // Delete all authentication cookies to log the user out
    response.cookies.delete("password-reset-token");
    response.cookies.delete("auth-email-token");
    response.cookies.delete("access-token");
    response.cookies.delete("refresh-token");

    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

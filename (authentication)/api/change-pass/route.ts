import { NextResponse } from "next/server";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { passwordCheck } from "@/app/(authentication)/lib/inputValidation";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;

  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    const intentToken = cookieStore.get("auth-intent-token")?.value;

    if (!intentToken) {
      return NextResponse.json(
        { message: "Unauthorized: Session expired" },
        { status: 401 },
      );
    }

    const payload = await verifyJWT(intentToken);

    if (!payload || payload.purpose !== "change-password") {
      return NextResponse.json(
        { message: "Invalid or unauthorized session" },
        { status: 401 },
      );
    }

    const { password } = await request.json();
    const validation = passwordCheck.safeParse({ password });

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const uid = payload.uid as string;
    const email = payload.email as string;
    const hashedPassword = await bcrypt.hash(password, 12);

    await client.query("BEGIN");
    transactionActive = true;

    const userUpdate = await client.query(
      "UPDATE users SET password_hash = $1 WHERE uid = $2",
      [hashedPassword, uid],
    );

    if (userUpdate.rowCount === 0) {
      throw new Error("User update failed: User not found");
    }

    await client.query(
      "UPDATE session SET is_revoked = TRUE WHERE user_uid = $1 AND is_revoked = FALSE",
      [uid],
    );

    await client.query("DELETE FROM otp WHERE email = $1 OR user_uid = $2", [
      email,
      uid,
    ]);

    await client.query("COMMIT");
    transactionActive = false;

    const response = NextResponse.json({
      success: true,
      message: "Password updated! Please log in with your new password.",
      redirect: "/email",
    });

    response.cookies.delete("auth-intent-token");
    response.cookies.delete("access-token");
    response.cookies.delete("refresh-token");

    return response;
  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Reset Password Route Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

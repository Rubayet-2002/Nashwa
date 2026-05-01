import { NextResponse } from "next/server";
import { RegisterInputCheck } from "../../lib/inputValidation";
import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { sendAndSaveOTP } from "../../lib/sendAndSaveOTP";
import { issueJWT, setTokenCookie } from "../../lib/jwtUtils";

export async function POST(request: Request) {
  const client = await pool.connect();
  let transactionActive = false;
  
  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed" }, { status: 403 });
    }

    const body = await request.json();
    const validation = RegisterInputCheck.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }

    const { username, email, password } = validation.data;
    const uid = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 12);

    await client.query("BEGIN");
    transactionActive = true;

    await client.query(
      `INSERT INTO users (uid, username, email, password_hash) VALUES ($1, $2, $3, $4)`,
      [uid, username, email, hashedPassword],
    );

    await client.query("COMMIT");
    transactionActive = false;

    await sendAndSaveOTP(email, "verify-account");

    const emailToken = await issueJWT({ email, purpose: "verify-account" }, "15m");

    const response = NextResponse.json(
      { success: true, message: "Registration successful! Verify your account." },
      { status: 201 },
    );

    setTokenCookie(response, "auth-email-token", emailToken, 15 * 60);

    return response;

  } catch (error) {
    if (transactionActive) await client.query("ROLLBACK");
    console.error("Register Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

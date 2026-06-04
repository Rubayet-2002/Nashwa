import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import { mail_verifyAccountOTP, mail_passwordResetOTP } from "./mail";

export async function sendOTP(
  email: string,
  user_uid: string,
  purpose: "verify-account" | "password-reset",
  otp_exp: number,
) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOTP = await bcrypt.hash(otp, 12);
  const otpExpiry = new Date(Date.now() + otp_exp * 60 * 1000);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM otp WHERE email = $1 AND purpose = $2 AND user_uid = $3",
      [email, purpose, user_uid],
    );

    await client.query(
      "INSERT INTO otp (email, otp_hash, expires_at, purpose, user_uid) VALUES ($1, $2, $3, $4, $5)",
      [email, hashedOTP, otpExpiry, purpose, user_uid],
    );

    switch (purpose) {
      case "password-reset":
        await mail_passwordResetOTP(email, otp, otp_exp);
        break;
      case "verify-account":
        await mail_verifyAccountOTP(email, otp, otp_exp);
        break;
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    throw new Error("Failed to process OTP");
  } finally {
    client.release();
  }
}

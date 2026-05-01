import pool from "@/database/pool";
import bcrypt from "bcryptjs";
import { mail_verifyAccountOTP, mail_passwordResetOTP } from "./mail";

export async function sendAndSaveOTP(
  email: string,
  purpose: "verify-account" | "password-reset",
) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await bcrypt.hash(otp, 12);
  const otp_exp = 5;
  const otpExpiry = new Date(Date.now() + otp_exp * 60 * 1000);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM otp WHERE email = $1 AND purpose = $2", [
      email,
      purpose,
    ]);

    await client.query(
      "INSERT INTO otp (email, otp_hash, expires_at, purpose) VALUES ($1, $2, $3, $4)",
      [email, hashedOTP, otpExpiry, purpose],
    );

    if (purpose === "password-reset") {
      await mail_passwordResetOTP(email, otp, 5);
    } else {
      await mail_verifyAccountOTP(email, otp, 5);
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

import pool from "./pool";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  const client = await pool.connect();

  const admin_uid = crypto.randomUUID();
  const password = process.env.SUPER_ADMIN_PASSWORD || "123456";
  const password_hash = await bcrypt.hash(password, 12);
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@email.com";
  const key = process.env.SUPER_ADMIN_KEY || "super";

  try {
    await client.query("BEGIN");

    await client.query(
      "INSERT INTO users (uid, username, email, role, password_hash, is_verified) VALUES ($1, $2, $3, $4, $5, TRUE) ON CONFLICT (email) DO NOTHING",
      [admin_uid, "Super Admin", email, "admin", password_hash],
    );

    const userRes = await client.query(
      "SELECT uid FROM users WHERE email = $1",
      [email],
    );
    if (userRes.rowCount && userRes.rowCount > 0) {
      const db_uid = userRes.rows[0].uid;
      await client.query(
        "INSERT INTO admin_key (user_uid, admin_key) VALUES ($1, $2) ON CONFLICT (user_uid) DO NOTHING",
        [db_uid, key],
      );
    }

    await client.query("COMMIT");

    console.log("Admin seeded successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding admin", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seedAdmin();

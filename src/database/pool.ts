import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const globalForPg = global as unknown as { pool: Pool };

export const pool =
  globalForPg.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}

async function verify() {
  try {
    await pool.query("SELECT NOW()");
    console.log("DB connected successfully");
  } catch (err) {
    console.error("Error connecting to DB");
  }
}

if (process.env.NODE_ENV === "development") {
  verify();
}

export default pool;

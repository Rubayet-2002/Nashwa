import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

function getAdminConnectionString() {
  const raw = process.env.DATABASE_URL || "";
  try {
    const url = new URL(raw);
    url.pathname = "/postgres";
    return url.toString();
  } catch (err) {
    // fallback: replace last path segment with 'postgres'
    return raw.replace(/\/[^\/]*$/, "/postgres");
  }
}

const adminConn = getAdminConnectionString();
const client = new Client({ connectionString: adminConn });

async function createDatabase() {
  const dbName = "Nashwa";
  try {
    await client.connect();
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE \"${dbName}\"`);
      console.log(`Database created: ${dbName}`);
    } else {
      console.log(`Database already exists: ${dbName}`);
    }
  } catch (err) {
    console.error("Failed to create database:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

createDatabase();

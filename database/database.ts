import pool from "./pool";
import { UserTable, ShopTable, SessionTable, OTPTable } from "./tables";

async function createTable() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(UserTable);
    await client.query(ShopTable);
    await client.query(SessionTable);
    await client.query(OTPTable);
    await client.query("COMMIT");
    console.log("Tables created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating tables");
  } finally {
    client.release();
    await pool.end(); 
    process.exit(0);
  }
}

createTable();

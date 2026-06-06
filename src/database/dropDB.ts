import pool from "./pool";
import { DropAll } from "./table";

async function createTable() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(DropAll);
    await client.query("COMMIT");

    console.log("Tables deleted successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting tables");
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

createTable();

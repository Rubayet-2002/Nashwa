import pool from "./pool";
import { DropTable } from "./table";

async function dropTable() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(DropTable);
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

dropTable();
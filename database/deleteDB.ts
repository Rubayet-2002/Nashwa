import pool from "./pool";
import { DropTableStatements } from "./tables";

async function createTable() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const statement of DropTableStatements) {
      await client.query(statement);
    }
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

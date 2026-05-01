import pool from "./pool";
import { CreateTableStatements } from "./tables";

async function createTable() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const statement of CreateTableStatements) {
      await client.query(statement);
    }
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

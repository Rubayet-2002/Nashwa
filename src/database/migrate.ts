import pool from "./pool";

async function run() {
  const client = await pool.connect();
  try {
    console.log("Dropping UNIQUE constraint on product_review...");
    await client.query("ALTER TABLE product_review DROP CONSTRAINT IF EXISTS product_review_product_uid_user_uid_key");
    console.log("Successfully dropped UNIQUE constraint");
  } catch (error) {
    console.error("Error running migration:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

run();

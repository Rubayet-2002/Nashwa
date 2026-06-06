import pool from "./pool";

async function run() {
  const client = await pool.connect();
  try {
    console.log("Adding auction columns to product table if missing...");
    await client.query(`
      ALTER TABLE product
        ADD COLUMN IF NOT EXISTS is_bidding BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS bidding_starts_at TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS bidding_ends_at TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS bidding_minimum NUMERIC(12,2) DEFAULT NULL
    `);

    console.log("Ensuring bids table exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS bids (
        bid_uid      VARCHAR(50) PRIMARY KEY,
        product_uid  VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
        bidder_uid   VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
        amount       NUMERIC(12,2) NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log("Creating bids lookup index if missing...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bids_product_amount_created
      ON bids (product_uid, amount DESC, created_at ASC)
    `);

    console.log("Auction migration completed successfully.");
  } catch (error) {
    console.error("Error running auction migration:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
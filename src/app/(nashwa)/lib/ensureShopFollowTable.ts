import pool from "@/database/pool";

export async function ensureShopFollowTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shop_follow (
      shop_uid VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,
      user_uid VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (shop_uid, user_uid)
    );
  `);
}

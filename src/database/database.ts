import pool from "./pool";
import {
  Users,
  Shop,
  Product,
  ProductImage,
  OrderRequest,
  OrderRequestItem,
  ProductComment,
  ProductReaction,
  PartnerUniversity,
  ShopJoinUniversity,
  ShopFollow,
  OTP,
  Session,
  AdminKey,
  CampusEvent,
  ChatMessage,
} from "./table";
import bcrypt from "bcryptjs";

async function createTable() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(Users);
    await client.query(Shop);
    await client.query(Product);
    await client.query(ProductImage);
    await client.query(OrderRequest);
    await client.query(OrderRequestItem);
    await client.query(ProductComment);
    await client.query(ProductReaction);
    await client.query(PartnerUniversity);
    await client.query(ShopJoinUniversity);
    await client.query(ShopFollow);
    await client.query(OTP);
    await client.query(Session);
    await client.query(AdminKey);
    await client.query(CampusEvent);
    await client.query(ChatMessage);

    const adminRes = await client.query(
      "SELECT uid FROM users WHERE email = $1",
      ["superadmin@email.com"],
    );

    if (adminRes.rowCount === 0) {
      const admin_uid = crypto.randomUUID();
      const password_hash = await bcrypt.hash("super-8585-admin-pass", 12);
      await client.query(
        "INSERT INTO users (uid, username, email, role, password_hash, is_verified) VALUES ($1, $2, $3, $4, $5, TRUE)",
        [admin_uid, "Super Admin", "superadmin@email.com", "admin", password_hash],
      );
      await client.query(
        "INSERT INTO admin_key (user_uid, admin_key) VALUES ($1, $2)",
        [admin_uid, "super-admin123"],
      );
      console.log("Superadmin seeded successfully: superadmin@email.com / super-admin123 / super-8585-admin-pass");
    }

    await client.query("COMMIT");
    console.log("Tables created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating tables:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

createTable();

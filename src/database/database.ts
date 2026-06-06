import pool from "./pool";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import {
  DropAll,
  Users,
  Session,
  OTP,
  PartnerUniversity,
  Shop,
  ShopFollow,
  ShopJoinUniversity,
  UniversityFavorite,
  Product,
  ProductImage,
  ProductReaction,
  ProductSave,
  ProductComment,
  CommentReaction,
  ProductReview,
  OrderRequest,
  OrderRequestItem,
  ChatMessage,
  Notification,
  CampusEvent,
  EventProduct,
  Report,
} from "./table";

dotenv.config();

async function run() {
  const client = await pool.connect();
  try {
    console.log("🗑  Dropping all tables...");
    await client.query(DropAll);

    console.log("🏗  Creating tables...");
    await client.query(Users);
    await client.query(PartnerUniversity);
    await client.query(Shop);
    await client.query(Session);
    await client.query(OTP);
    await client.query(ShopFollow);
    await client.query(ShopJoinUniversity);
    await client.query(UniversityFavorite);
    await client.query(Product);
    await client.query(ProductImage);
    await client.query(ProductReaction);
    await client.query(ProductSave);
    await client.query(ProductComment);
    await client.query(CommentReaction);
    await client.query(ProductReview);
    await client.query(OrderRequest);
    await client.query(OrderRequestItem);
    await client.query(ChatMessage);
    await client.query(Notification);
    await client.query(CampusEvent);
    await client.query(EventProduct);
    await client.query(Report);
    console.log("✅ Tables created.");

    // Seed admin from .env
    const adminEmail = process.env.ADMIN_EMAIL || "admin@nashwa.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const adminUid = "admin-001";

    await client.query(
      `INSERT INTO users (uid, username, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = 'admin',
             is_verified = TRUE`,
      [adminUid, "Admin", adminEmail, adminHash]
    );
    console.log(`👤 Admin seeded: ${adminEmail} / ${adminPassword}`);

    // Seed partner universities
    const universities = [
      { uid: "nsu", name: "North South University", subtitle: "NSU Campus Community" },
      { uid: "brac", name: "BRAC University", subtitle: "BRACU Campus Community" },
      { uid: "iub", name: "Independent University, Bangladesh", subtitle: "IUB Campus Community" },
      { uid: "uiu", name: "United International University", subtitle: "UIU Campus Community" },
      { uid: "aiub", name: "American International University-Bangladesh", subtitle: "AIUB Campus Community" },
      { uid: "du", name: "University of Dhaka", subtitle: "DU Campus Community" },
      { uid: "buet", name: "Bangladesh University of Engineering & Technology", subtitle: "BUET Campus Community" },
    ];

    for (const uni of universities) {
      await client.query(
        `INSERT INTO partner_university (university_uid, university_name, subtitle)
         VALUES ($1, $2, $3)
         ON CONFLICT (university_uid) DO NOTHING`,
        [uni.uid, uni.name, uni.subtitle]
      );
    }
    console.log("🏫 Seeded partner universities.");

    console.log("🎉 Database ready! Run npm run dev to start.");
  } catch (err) {
    console.error("❌ DB setup error:", err);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

run();

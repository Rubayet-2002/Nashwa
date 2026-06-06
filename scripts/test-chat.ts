import pool from "../src/database/pool";
import dotenv from "dotenv";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

async function run() {
  console.log("=== Testing Database Connection & Query ===");
  try {
    const shopsRes = await pool.query(`
      SELECT s.shop_uid, s.shop_name, s.shop_location, u.university_name 
      FROM shop s
      LEFT JOIN shop_join_university sju ON s.shop_uid = sju.shop_uid
      LEFT JOIN partner_university u ON sju.university_uid = u.university_uid
      LIMIT 50
    `);
    console.log("Shops with universities:", shopsRes.rows);

    const productsRes = await pool.query(`
      SELECT p.product_uid, p.title, p.description, p.price, p.currency,
              (
                SELECT COALESCE(json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC), '[]'::json)
                FROM product_image pi
                WHERE pi.product_uid = p.product_uid
              ) AS image_urls,
              (
                SELECT COUNT(*)::int
                FROM product_comment pc
                WHERE pc.product_uid = p.product_uid
              ) AS comment_count,
              s.shop_name 
      FROM product p
      JOIN shop s ON p.shop_uid = s.shop_uid
      LIMIT 50
    `);
    console.log("Products in database with images & comments count:", productsRes.rows);
  } catch (err: any) {
    console.error("Database Query Failed:", err.message);
    console.error(err);
  }

  console.log("\n=== Fetching Active Free Models ===");
  try {
    const modelsResp = await globalThis.fetch("https://openrouter.ai/api/v1/models");
    if (modelsResp.ok) {
      const modelsData: any = await modelsResp.json();
      const freeModels = modelsData.data
        .filter((m: any) => m.id.endsWith(":free"))
        .map((m: any) => m.id);
      console.log("Active free models:", freeModels);
    } else {
      console.log("Failed to fetch models directory:", modelsResp.status);
    }
  } catch (err: any) {
    console.error("Failed to fetch models directory:", err.message);
  }

  console.log("\n=== Testing OpenRouter Credentials ===");
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiURL = "https://openrouter.ai/api/v1/chat/completions";
  const model = "liquid/lfm-2.5-1.2b-instruct:free";

  console.log("API Key configured:", apiKey ? "Yes (length: " + apiKey.length + ")" : "No");
  console.log("API URL:", apiURL);
  console.log("Model:", model);

  if (!apiKey) {
    console.log("No API key. Stopping.");
    process.exit(1);
  }

  console.log("\n=== Testing General DNS/Fetch (google.com) ===");
  try {
    const testResp = await globalThis.fetch("https://google.com");
    console.log("google.com fetch status:", testResp.status);
  } catch (err: any) {
    console.error("google.com fetch failed:", err.message);
  }

  console.log("\n=== Testing Fetch to OpenRouter ===");
  try {
    const resp = await globalThis.fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a test assistant." },
          { role: "user", content: "Say hello!" },
        ],
        stream: false, // test non-streaming first
      }),
    });

    console.log("Response status:", resp.status);
    console.log("Response OK:", resp.ok);

    const text = await resp.text();
    console.log("Response Text:", text.slice(0, 1000));
  } catch (err: any) {
    console.error("Fetch to OpenRouter failed:", err.message);
    console.error(err);
  }

  pool.end();
}

run();

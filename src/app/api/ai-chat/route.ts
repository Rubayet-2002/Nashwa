import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

const OPENROUTER_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message) return NextResponse.json({ message: "message is required" }, { status: 400 });

    const { user } = await authMe();

    // Fetch shops with university context
    const shopsRes = await pool.query(`
      SELECT s.shop_uid, s.shop_name, s.shop_location, u.university_name 
      FROM shop s
      LEFT JOIN shop_join_university sju ON s.shop_uid = sju.shop_uid
      LEFT JOIN partner_university u ON sju.university_uid = u.university_uid
      LIMIT 50
    `);
    const shops = shopsRes.rows;

    // Fetch products context
    const productsRes = await pool.query(`
      SELECT p.title, p.price, p.description, s.shop_name 
      FROM product p
      JOIN shop s ON p.shop_uid = s.shop_uid
      LIMIT 100
    `);
    const products = productsRes.rows;

    const systemPrompt = `You are Nashwa marketplace assistant, a helpful AI shopping guide. 
Use the provided Platform Shops list (which includes their locations and university affiliations) and the Platform Products list (which includes item names, prices, descriptions, and which shop sells them) to answer questions accurately and concisely.
If a product or shop is not listed, politely state that it is not available. Do not hallucinate or associate products with shops that do not sell them. Explain which shop has a product if asked, and match budgets correctly.`;

    const shopListText = shops
      .map((s: any) => `- ${s.shop_name} (Location: ${s.shop_location || "N/A"}${s.university_name ? `, University: ${s.university_name}` : ""})`)
      .join("\n");

    const productListText = products
      .map((p: any) => `- ${p.title} sold by "${p.shop_name}" for ${p.price} BDT. Description: ${p.description || "No description"}`)
      .join("\n");

    const userContext = `User: ${user ? `${user.username} (uid:${user.uid})` : "anonymous"}`;

    const prompt = `${systemPrompt}\n\nPlatform shops:\n${shopListText}\n\nPlatform products:\n${productListText}\n\nUser context:\n${userContext}\n\nUser question:\n${message}`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "OpenRouter API key not configured on server" }, { status: 500 });
    }

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "liquid/lfm-2.5-1.2b-instruct:free",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("openrouter error", resp.status, text);
      return NextResponse.json({ message: "AI provider error" }, { status: 502 });
    }

    const data = await resp.json();
    // OpenRouter returns choices[0].message.content (openai-compatible)
    const aiText = data?.choices?.[0]?.message?.content || data?.output || JSON.stringify(data);

    return NextResponse.json({ success: true, reply: aiText });
  } catch (error) {
    console.error("ai-chat POST error:", error);
    return NextResponse.json({ message: "Failed to chat with AI" }, { status: 500 });
  }
}

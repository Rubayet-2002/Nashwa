import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

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

    const OPENROUTER_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
    const model = process.env.OPENROUTER_MODEL || "liquid/lfm-2.5-1.2b-instruct:free";

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("openrouter fetch error", resp.status, text);
      return NextResponse.json({ message: "AI provider error" }, { status: 502 });
    }

    const body = resp.body;
    if (!body) {
      return NextResponse.json({ message: "No stream from provider" }, { status: 502 });
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer) {
                processLine(buffer, controller);
              }
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              processLine(line, controller);
            }
          }
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        }
      }
    });

    function processLine(line: string, controller: any) {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed === "data: [DONE]") return;
      if (trimmed.startsWith("data: ")) {
        try {
          const jsonStr = trimmed.slice(6);
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        } catch (e) {
          // ignore parsing error for incomplete JSON lines
        }
      }
    }

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("ai-chat stream POST error:", error);
    return NextResponse.json({ message: "Failed to chat with AI" }, { status: 500 });
  }
}

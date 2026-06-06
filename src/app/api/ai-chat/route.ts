import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "liquid/lfm-2.5-1.2b-instruct:free";
    const apiUrl = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";

    if (!apiKey) {
      return NextResponse.json({ reply: "AI chat is not configured." }, { status: 500 });
    }

    const systemPrompt = {
      role: "system",
      content: `You are Nashwa AI, a helpful assistant for the Nashwa student entrepreneur marketplace in Bangladesh. 
You help users find products, shops, and information about the platform. 
You speak in a friendly, concise manner. 
When asked about products or shops, suggest they use the search bar or explore the homepage.
Keep responses under 100 words.`,
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        "X-Title": "Nashwa Marketplace",
      },
      body: JSON.stringify({
        model,
        messages: [systemPrompt, ...messages],
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ reply: "I'm having trouble right now. Please try again later." });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json({ reply: "Something went wrong. Please try again." });
  }
}

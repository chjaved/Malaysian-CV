import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const InputSchema = z.object({
  profile_text: z.string().min(50).max(60000),
  experience_level: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
  goal: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = InputSchema.parse(body);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

    const systemPrompt = `You are a Malaysian career coach. Analyze the LinkedIn profile text provided and return ONLY structured data via the return_linkedin_analysis tool. Focus on Malaysian professional standards — local company culture, GLC expectations, MNC requirements and the fresh grad landscape.`;
    const userPrompt = `Context:\n- Experience: ${data.experience_level}\n- Industry: ${data.industry}\n- Goal: ${data.goal}\n\nLINKEDIN PROFILE:\n"""\n${data.profile_text}\n"""\n\nReturn the structured analysis.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let aiRes: Response;
    try {
      aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          tools: [{ type: "function", function: { name: "return_linkedin_analysis", description: "Return the structured LinkedIn analysis.", parameters: { type: "object", properties: { overall_score: { type: "number" }, photo_headline: { type: "object", properties: { score: { type: "number" }, rating: { type: "string" }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, about_section: { type: "object", properties: { score: { type: "number" }, rating: { type: "string" }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, experience: { type: "object", properties: { score: { type: "number" }, rating: { type: "string" }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, skills: { type: "object", properties: { score: { type: "number" }, rating: { type: "string" }, missing_skills: { type: "array", items: { type: "string" } }, present_skills: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "missing_skills", "present_skills"] }, keywords: { type: "object", properties: { score: { type: "number" }, rating: { type: "string" }, missing_keywords: { type: "array", items: { type: "string" } }, present_keywords: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "missing_keywords", "present_keywords"] }, malaysia_market_fit: { type: "object", properties: { score: { type: "number" }, rating: { type: "string" }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, priority_improvements: { type: "array", items: { type: "string" } }, rewritten_headline: { type: "string" } }, required: ["overall_score", "photo_headline", "about_section", "experience", "skills", "keywords", "malaysia_market_fit", "priority_improvements", "rewritten_headline"] } } }],
          tool_choice: { type: "function", function: { name: "return_linkedin_analysis" } },
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") return NextResponse.json({ error: "TIMEOUT" }, { status: 504 });
      throw err;
    }
    clearTimeout(timeoutId);

    if (!aiRes.ok) {
      if (aiRes.status === 429) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
      return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
    }

    const payload = await aiRes.json();
    const args = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return NextResponse.json({ error: "AI returned unexpected response." }, { status: 500 });
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return NextResponse.json({ result: parsed });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

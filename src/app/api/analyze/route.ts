import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const InputSchema = z.object({
  cv_text: z.string().min(50).max(60000),
  company_type: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
  experience_level: z.string().min(1).max(100),
  language_preference: z.string().min(1).max(100),
});

const SYSTEM_PROMPT = `You are an expert Malaysian CV reviewer. Analyze the CV and return ONLY a JSON object with this exact shape:
{
  "overall_score": number (0-100),
  "structure": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "feedback": [3-4 strings] },
  "keywords": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "missing_keywords": [strings], "present_keywords": [strings] },
  "language_balance": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "feedback": [3-4 strings] },
  "malaysia_market_fit": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "feedback": [3-4 strings] },
  "priority_improvements": [5 specific actionable strings]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = InputSchema.parse(body);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 500 });
    }

    const userPrompt = `Context:\n- Target employer type: ${data.company_type}\n- Industry: ${data.industry}\n- Experience level: ${data.experience_level}\n- Language preference: ${data.language_preference}\n\nCV CONTENT:\n"""\n${data.cv_text}\n"""\n\nAnalyze and return ONLY the JSON object as specified.`;

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "function", function: { name: "return_cv_analysis", description: "Return the structured CV analysis.", parameters: { type: "object", properties: { overall_score: { type: "number" }, structure: { type: "object", properties: { score: { type: "number" }, rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, keywords: { type: "object", properties: { score: { type: "number" }, rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] }, missing_keywords: { type: "array", items: { type: "string" } }, present_keywords: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "missing_keywords", "present_keywords"] }, language_balance: { type: "object", properties: { score: { type: "number" }, rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, malaysia_market_fit: { type: "object", properties: { score: { type: "number" }, rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] }, feedback: { type: "array", items: { type: "string" } } }, required: ["score", "rating", "feedback"] }, priority_improvements: { type: "array", items: { type: "string" } } }, required: ["overall_score", "structure", "keywords", "language_balance", "malaysia_market_fit", "priority_improvements"] } } }],
        tool_choice: { type: "function", function: { name: "return_cv_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
      if (aiRes.status === 402) return NextResponse.json({ error: "AI credits exhausted." }, { status: 402 });
      return NextResponse.json({ error: "AI analysis failed." }, { status: 500 });
    }

    const payload = await aiRes.json();
    const args = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return NextResponse.json({ error: "AI returned unexpected response." }, { status: 500 });
    const parsed = typeof args === "string" ? JSON.parse(args) : args;

    // Persist best-effort
    try {
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
        let userId: string | null = null;
        let userEmail: string | null = null;
        if (token) {
          const { data: u } = await admin.auth.getUser(token);
          if (u.user) { userId = u.user.id; userEmail = u.user.email ?? null; }
        }
        await admin.from("analyses").insert({ company_type: data.company_type, industry: data.industry, experience_level: data.experience_level, language_preference: data.language_preference, overall_score: Math.round(parsed.overall_score), full_results: parsed, user_id: userId, email: userEmail });
      }
    } catch (e) { console.error("Failed to save analysis:", e); }

    return NextResponse.json({ result: parsed });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const InputSchema = z.object({
  cv_text: z.string().min(50).max(60000),
  priority_improvements: z.array(z.string()).min(1).max(10),
  company_type: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = InputSchema.parse(body);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

    const prompt = `You are an expert Malaysian career coach. Based on this CV and the listed priority improvements, produce concrete before/after rewrites.\n\nTARGET EMPLOYER TYPE: ${data.company_type}\nINDUSTRY: ${data.industry}\n\nPRIORITY IMPROVEMENTS:\n${data.priority_improvements.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nCV CONTENT:\n"""\n${data.cv_text}\n"""\n\nFor EACH priority improvement (in the same order), return:\n- issue_title: short title (max 8 words) describing what's wrong\n- original: the exact problematic excerpt copied from the CV (1-3 lines). If nothing exists in the CV for that issue, write "[Not present in your CV]".\n- fix: the rewritten improved version, tailored for the Malaysian job market, ATS-friendly, concise and ready to paste into the CV.\n\nReturn ONLY structured data via the tool call.`;

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "function", function: { name: "return_fixes", description: "Return AI-suggested CV fixes.", parameters: { type: "object", properties: { fixes: { type: "array", items: { type: "object", properties: { issue_title: { type: "string" }, original: { type: "string" }, fix: { type: "string" } }, required: ["issue_title", "original", "fix"] } } }, required: ["fixes"] } } }],
        tool_choice: { type: "function", function: { name: "return_fixes" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
      return NextResponse.json({ error: "AI fixes generation failed." }, { status: 500 });
    }

    const payload = await aiRes.json();
    const args = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return NextResponse.json({ error: "AI returned unexpected response." }, { status: 500 });
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return NextResponse.json({ fixes: parsed.fixes ?? [] });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

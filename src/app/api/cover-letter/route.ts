import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const InputSchema = z.object({
  job_title: z.string().min(1).max(200),
  company_name: z.string().min(1).max(200),
  company_type: z.string().min(1).max(100),
  full_name: z.string().max(200).optional(),
  analysis: z.unknown(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = InputSchema.parse(body);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

    const applicantName = (data.full_name || "").trim() || "Applicant";
    const prompt = `You are a Malaysian career coach. Using this CV analysis data:\n\n${JSON.stringify(data.analysis, null, 2)}\n\nGenerate a professional cover letter for ${data.job_title} at ${data.company_name}.\n\nThe applicant's full name is: ${applicantName}\nAlways sign off and refer to the applicant using this exact name. NEVER use placeholders like [Your Name], [Name], or brackets of any kind.\n\nThe cover letter should:\n- Be tailored specifically for Malaysian professional culture\n- Be formal but personable\n- Be 3 paragraphs maximum\n- Highlight strengths identified in the CV analysis\n- Address gaps mentioned in the analysis\n- Match the tone for the target employer type: ${data.company_type}\n- End with a confident Malaysian professional closing signed with "${applicantName}"\n\nReturn ONLY the cover letter text, no preamble, no markdown, no explanations.`;

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
      return NextResponse.json({ error: "Cover letter generation failed." }, { status: 500 });
    }

    const payload = await aiRes.json();
    const letter = payload?.choices?.[0]?.message?.content;
    if (!letter || typeof letter !== "string") return NextResponse.json({ error: "AI returned unexpected response." }, { status: 500 });
    return NextResponse.json({ letter: letter.trim() });
  } catch (e: any) {
    if (e?.name === "ZodError") return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

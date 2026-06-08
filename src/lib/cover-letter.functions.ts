import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  job_title: z.string().min(1).max(200),
  company_name: z.string().min(1).max(200),
  company_type: z.string().min(1).max(100),
  full_name: z.string().max(200).optional(),
  analysis: z.unknown(),
});

export const generateCoverLetter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      throw new Error("AI service is not configured. Please contact support.");
    }

    const analysisStr = JSON.stringify(data.analysis, null, 2);
    const applicantName = (data.full_name || "").trim() || "Applicant";

    const prompt = `You are a Malaysian career coach. Using this CV analysis data:

${analysisStr}

Generate a professional cover letter for ${data.job_title} at ${data.company_name}.

The applicant's full name is: ${applicantName}
Always sign off and refer to the applicant using this exact name. NEVER use placeholders like [Your Name], [Name], or brackets of any kind. If the name is "Applicant", use "Applicant" literally.

Treat the company name professionally. If "${data.company_name}" appears to be an abbreviation, use it consistently and professionally throughout the letter.

The cover letter should:
- Be tailored specifically for Malaysian professional culture
- Be formal but personable
- Be 3 paragraphs maximum
- Highlight strengths identified in the CV analysis
- Address gaps mentioned in the analysis
- Match the tone for the target employer type: ${data.company_type}
- End with a confident Malaysian professional closing signed with "${applicantName}"

Return ONLY the cover letter text, no preamble, no markdown, no explanations.`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://resumy.my",
        "X-Title": "ResuMY",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        throw new Error("We're handling lots of requests right now. Please try again in a minute.");
      }
      if (aiRes.status === 402) {
        throw new Error("AI credits exhausted. Please contact the site owner.");
      }
      const txt = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, txt);
      throw new Error("Cover letter generation failed. Please try again.");
    }

    const payload = await aiRes.json();
    const letter = payload?.choices?.[0]?.message?.content;
    if (!letter || typeof letter !== "string") {
      throw new Error("AI returned an unexpected response. Please try again.");
    }

    return { letter: letter.trim() };
  });
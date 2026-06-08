import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  cv_text: z.string().min(50).max(60000),
  priority_improvements: z.array(z.string()).min(1).max(10),
  company_type: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
});

export type AiFix = {
  issue_title: string;
  original: string;
  fix: string;
};

export const generateFixes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service is not configured. Please contact support.");
    }

    const prompt = `You are an expert Malaysian career coach. Based on this CV and the listed priority improvements, produce concrete before/after rewrites.

TARGET EMPLOYER TYPE: ${data.company_type}
INDUSTRY: ${data.industry}

PRIORITY IMPROVEMENTS:
${data.priority_improvements.map((p, i) => `${i + 1}. ${p}`).join("\n")}

CV CONTENT:
"""
${data.cv_text}
"""

For EACH priority improvement (in the same order), return:
- issue_title: short title (max 8 words) describing what's wrong
- original: the exact problematic excerpt copied from the CV (1-3 lines). If nothing exists in the CV for that issue, write "[Not present in your CV]".
- fix: the rewritten improved version, tailored for the Malaysian job market, ATS-friendly, concise and ready to paste into the CV.

Return ONLY structured data via the tool call.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "return_fixes",
              description: "Return AI-suggested CV fixes.",
              parameters: {
                type: "object",
                properties: {
                  fixes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        issue_title: { type: "string" },
                        original: { type: "string" },
                        fix: { type: "string" },
                      },
                      required: ["issue_title", "original", "fix"],
                    },
                  },
                },
                required: ["fixes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_fixes" } },
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
      throw new Error("AI fixes generation failed. Please try again.");
    }

    const payload = await aiRes.json();
    const args = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      throw new Error("AI returned an unexpected response. Please try again.");
    }
    let parsed: { fixes: AiFix[] };
    try {
      parsed = typeof args === "string" ? JSON.parse(args) : args;
    } catch {
      throw new Error("AI returned malformed data. Please try again.");
    }

    return { fixes: parsed.fixes ?? [] };
  });
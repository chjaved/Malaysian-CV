import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  profile_text: z.string().min(50).max(60000),
  experience_level: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
  goal: z.string().min(1).max(100),
});

export type LinkedInAnalysis = {
  overall_score: number;
  photo_headline: { score: number; rating: string; feedback: string[] };
  about_section: {
    score: number;
    rating: string;
    feedback: string[];
    rewritten_version?: string;
  };
  experience: { score: number; rating: string; feedback: string[] };
  skills: {
    score: number;
    rating: string;
    missing_skills: string[];
    present_skills: string[];
  };
  keywords: {
    score: number;
    rating: string;
    missing_keywords: string[];
    present_keywords: string[];
  };
  malaysia_market_fit: { score: number; rating: string; feedback: string[] };
  priority_improvements: string[];
  rewritten_headline: string;
  rewritten_about?: string;
};

export const analyzeLinkedIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("AI service is not configured. Please contact support.");
    }

    const systemPrompt = `You are a Malaysian career coach. Analyze the LinkedIn profile text provided and return ONLY structured data via the return_linkedin_analysis tool. Focus on Malaysian professional standards — local company culture, GLC expectations, MNC requirements and the fresh grad landscape.`;

    const userPrompt = `Context:
- Experience: ${data.experience_level}
- Industry: ${data.industry}
- Goal: ${data.goal}

LINKEDIN PROFILE:
"""
${data.profile_text}
"""

Return the structured analysis.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let aiRes: Response;
    try {
      aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_linkedin_analysis",
                description: "Return the structured LinkedIn analysis.",
                parameters: {
                  type: "object",
                  properties: {
                    overall_score: { type: "number" },
                    photo_headline: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        rating: { type: "string" },
                        feedback: { type: "array", items: { type: "string" } },
                      },
                      required: ["score", "rating", "feedback"],
                    },
                    about_section: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        rating: { type: "string" },
                        feedback: { type: "array", items: { type: "string" } },
                      },
                      required: ["score", "rating", "feedback"],
                    },
                    experience: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        rating: { type: "string" },
                        feedback: { type: "array", items: { type: "string" } },
                      },
                      required: ["score", "rating", "feedback"],
                    },
                    skills: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        rating: { type: "string" },
                        missing_skills: { type: "array", items: { type: "string" } },
                        present_skills: { type: "array", items: { type: "string" } },
                      },
                      required: ["score", "rating", "missing_skills", "present_skills"],
                    },
                    keywords: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        rating: { type: "string" },
                        missing_keywords: { type: "array", items: { type: "string" } },
                        present_keywords: { type: "array", items: { type: "string" } },
                      },
                      required: ["score", "rating", "missing_keywords", "present_keywords"],
                    },
                    malaysia_market_fit: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        rating: { type: "string" },
                        feedback: { type: "array", items: { type: "string" } },
                      },
                      required: ["score", "rating", "feedback"],
                    },
                    priority_improvements: { type: "array", items: { type: "string" } },
                    rewritten_headline: { type: "string" },
                  },
                  required: [
                    "overall_score",
                    "photo_headline",
                    "about_section",
                    "experience",
                    "skills",
                    "keywords",
                    "malaysia_market_fit",
                    "priority_improvements",
                    "rewritten_headline",
                  ],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_linkedin_analysis" } },
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        throw new Error("TIMEOUT");
      }
      throw err;
    }
    clearTimeout(timeoutId);

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        throw new Error("We're handling lots of profiles right now. Please try again in a minute.");
      }
      if (aiRes.status === 402) {
        throw new Error("AI credits exhausted. Please contact the site owner.");
      }
      const txt = await aiRes.text();
      console.error("LinkedIn AI gateway error:", aiRes.status, txt);
      throw new Error("Analysis failed. Please try again.");
    }

    const payload = await aiRes.json();
    const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) {
      console.error("No tool call in LinkedIn AI response:", JSON.stringify(payload).slice(0, 500));
      throw new Error("Analysis failed. Please try again.");
    }
    let parsed: LinkedInAnalysis;
    try {
      parsed = typeof args === "string" ? JSON.parse(args) : args;
    } catch {
      throw new Error("Analysis failed. Please try again.");
    }
    return { result: parsed };
  });
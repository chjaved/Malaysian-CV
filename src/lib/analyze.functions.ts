import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequest } from "@tanstack/react-start/server";

const InputSchema = z.object({
  cv_text: z.string().min(50).max(60000),
  company_type: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
  experience_level: z.string().min(1).max(100),
  language_preference: z.string().min(1).max(100),
});

export type AnalysisResult = {
  overall_score: number;
  structure: {
    score: number;
    rating: "Strong" | "Needs Work" | "Weak";
    feedback: string[];
  };
  keywords: {
    score: number;
    rating: "Strong" | "Needs Work" | "Weak";
    missing_keywords: string[];
    present_keywords: string[];
  };
  language_balance: {
    score: number;
    rating: "Strong" | "Needs Work" | "Weak";
    feedback: string[];
  };
  malaysia_market_fit: {
    score: number;
    rating: "Strong" | "Needs Work" | "Weak";
    feedback: string[];
  };
  priority_improvements: string[];
};

const SYSTEM_PROMPT = `You are an expert Malaysian career coach and HR consultant with deep knowledge of Malaysia's job market across local companies, GLCs, MNCs and government sectors. Analyze the CV provided and return ONLY a valid JSON response with exactly this structure:

{
  "overall_score": number between 0-100,
  "structure": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "feedback": [3-4 strings] },
  "keywords": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "missing_keywords": [strings], "present_keywords": [strings] },
  "language_balance": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "feedback": [3-4 strings] },
  "malaysia_market_fit": { "score": number, "rating": "Strong" | "Needs Work" | "Weak", "feedback": [3-4 strings] },
  "priority_improvements": [5 specific actionable strings]
}

Focus feedback specifically on Malaysian job market expectations. For fresh graduates include CGPA presentation, co-curriculum and internship advice. For GLC applications include Bumiputera policy awareness. For MNCs focus on global readiness while maintaining local context. For government roles focus on proper BM formatting and required certifications.`;

export const analyzeCv = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      throw new Error("AI service is not configured. Please contact support.");
    }

    const userPrompt = `Context:
- Target employer type: ${data.company_type}
- Industry: ${data.industry}
- Experience level: ${data.experience_level}
- Language preference: ${data.language_preference}

CV CONTENT:
"""
${data.cv_text}
"""

Analyze and return ONLY the JSON object as specified.`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://resumy.my",
        "X-Title": "ResuMY",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_cv_analysis",
              description: "Return the structured CV analysis.",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number" },
                  structure: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] },
                      feedback: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "rating", "feedback"],
                  },
                  keywords: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] },
                      missing_keywords: { type: "array", items: { type: "string" } },
                      present_keywords: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "rating", "missing_keywords", "present_keywords"],
                  },
                  language_balance: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] },
                      feedback: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "rating", "feedback"],
                  },
                  malaysia_market_fit: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] },
                      feedback: { type: "array", items: { type: "string" } },
                    },
                    required: ["score", "rating", "feedback"],
                  },
                  priority_improvements: { type: "array", items: { type: "string" } },
                },
                required: [
                  "overall_score",
                  "structure",
                  "keywords",
                  "language_balance",
                  "malaysia_market_fit",
                  "priority_improvements",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_cv_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        throw new Error("We're handling lots of CVs right now. Please try again in a minute.");
      }
      if (aiRes.status === 402) {
        throw new Error("AI credits exhausted. Please contact the site owner.");
      }
      const txt = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, txt);
      throw new Error("AI analysis failed. Please try again.");
    }

    const payload = await aiRes.json();
    const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) {
      console.error("No tool call in AI response:", JSON.stringify(payload).slice(0, 500));
      throw new Error("AI returned an unexpected response. Please try again.");
    }

    let parsed: AnalysisResult;
    try {
      parsed = typeof args === "string" ? JSON.parse(args) : args;
    } catch (e) {
      console.error("Failed to parse AI args:", e);
      throw new Error("AI returned malformed data. Please try again.");
    }

    // Persist (best-effort, don't block returning result on failure)
    try {
      let userId: string | null = null;
      let userEmail: string | null = null;
      try {
        const req = getRequest();
        const authHeader = req?.headers.get("authorization");
        const token = authHeader?.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7)
          : null;
        if (token) {
          const { data: u } = await supabaseAdmin.auth.getUser(token);
          if (u.user) {
            userId = u.user.id;
            userEmail = u.user.email ?? null;
          }
        }
      } catch (e) {
        console.error("Auth lookup failed:", e);
      }
      await supabaseAdmin.from("analyses").insert({
        company_type: data.company_type,
        industry: data.industry,
        experience_level: data.experience_level,
        language_preference: data.language_preference,
        overall_score: Math.round(parsed.overall_score),
        full_results: parsed as unknown as never,
        user_id: userId,
        email: userEmail,
      });
    } catch (e) {
      console.error("Failed to save analysis:", e);
    }

    return { result: parsed };
  });
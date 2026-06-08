export type AnalysisResult = {
  overall_score: number;
  structure: { score: number; rating: "Strong" | "Needs Work" | "Weak"; feedback: string[] };
  keywords: { score: number; rating: "Strong" | "Needs Work" | "Weak"; missing_keywords: string[]; present_keywords: string[] };
  language_balance: { score: number; rating: "Strong" | "Needs Work" | "Weak"; feedback: string[] };
  malaysia_market_fit: { score: number; rating: "Strong" | "Needs Work" | "Weak"; feedback: string[] };
  priority_improvements: string[];
};

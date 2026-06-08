"use client";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload, CheckCircle2, Loader2, Linkedin, AlertCircle, Search, Globe2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { extractPdfText } from "@/lib/pdf-extract";
import { AnalysisLoader } from "@/components/analysis-loader";

const INDUSTRIES = ["Technology & IT", "Finance & Banking", "Marketing & Communications", "Engineering", "Healthcare", "Education", "Operations & Logistics", "Others"];
const EXPERIENCE_LEVELS = ["Fresh Graduate (0-1 year)", "Junior (1-3 years)", "Mid Level (3-6 years)", "Senior (6+ years)"];
const GOALS = ["Get a job in Malaysia", "Switch industries", "Get promoted / senior role", "Attract recruiters / headhunters", "Build personal brand"];

type LinkedInAnalysis = {
  overall_score: number;
  photo_headline: { score: number; rating: string; feedback: string[] };
  about_section: { score: number; rating: string; feedback: string[] };
  experience: { score: number; rating: string; feedback: string[] };
  skills: { score: number; rating: string; missing_skills: string[]; present_skills: string[] };
  keywords: { score: number; rating: string; missing_keywords: string[]; present_keywords: string[] };
  malaysia_market_fit: { score: number; rating: string; feedback: string[] };
  priority_improvements: string[];
  rewritten_headline: string;
};

export default function LinkedInReviewPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profileText, setProfileText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LinkedInAnalysis | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setExtractError(null);
    if (f.type !== "application/pdf") { setExtractError("Only PDF files are supported."); return; }
    if (f.size > 5 * 1024 * 1024) { setExtractError("File too large. Max 5MB."); return; }
    setFile(f);
    setExtracting(true);
    try {
      const text = await extractPdfText(f);
      if (!text || text.trim().length < 50) {
        setExtractError("Your PDF appears to be image-based. Please upload a text-based PDF.");
        setProfileText("");
      } else { setProfileText(text); }
    } catch (e) {
      console.error(e);
      setExtractError("We couldn't read your PDF. Make sure it's not password protected.");
      setProfileText("");
    } finally { setExtracting(false); }
  }, []);

  const canSubmit = profileText && industry && experienceLevel && goal && !submitting && !extracting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_text: profileText, experience_level: experienceLevel, industry, goal }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 504 || (err.error === "TIMEOUT")) throw new Error("Analysis took too long. Please try again.");
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const { result: r } = await res.json();
      setResult(r);
    } catch (e: any) {
      toast.error(e?.message || "Analysis failed. Please try again.", { duration: 6000 });
    } finally { setSubmitting(false); }
  };

  if (result) return <ResultsView result={result} onReset={() => { setResult(null); setFile(null); setProfileText(""); setIndustry(""); setExperienceLevel(""); setGoal(""); }} />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-3">
            <Linkedin className="size-8 text-[#0A66C2]" />
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">LinkedIn Profile Reviewer</h1>
          </div>
          <p className="mt-2 text-muted-foreground">AI feedback built for Malaysian professionals and fresh graduates.</p>

          <div className="mt-8">
            <Label className="text-base font-semibold">Step 1 — Upload your LinkedIn PDF</Label>
            <p className="mt-1 text-sm text-muted-foreground">Go to your LinkedIn profile → More → Save to PDF, then upload here.</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f); }}
              onClick={() => inputRef.current?.click()}
              className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/20 hover:bg-secondary/40"}`}
            >
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
              {extracting ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground"><Loader2 className="size-8 animate-spin text-primary" /><p>Reading your PDF…</p></div>
              ) : file && profileText ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-10 text-[var(--success)]" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · text extracted</p>
                  <p className="mt-2 text-xs text-muted-foreground underline">Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-10 text-primary" />
                  <p className="text-base font-medium text-foreground">Drag your LinkedIn PDF here or click to upload</p>
                  <p className="text-sm">PDF only, max 5MB</p>
                </div>
              )}
            </div>
            {extractError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{extractError}</span>
              </div>
            )}
          </div>

          <div className="mt-10 space-y-5">
            <Label className="text-base font-semibold">Step 2 — Your context</Label>
            {[
              { label: "Your Industry:", value: industry, onChange: setIndustry, placeholder: "Select industry", items: INDUSTRIES },
              { label: "Your Experience Level:", value: experienceLevel, onChange: setExperienceLevel, placeholder: "Select experience", items: EXPERIENCE_LEVELS },
              { label: "Your Goal:", value: goal, onChange: setGoal, placeholder: "Select your goal", items: GOALS },
            ].map((f) => (
              <div key={f.label} className="grid gap-2">
                <Label className="text-sm font-medium text-foreground">{f.label}</Label>
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder} /></SelectTrigger>
                  <SelectContent>{f.items.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="mt-10">
            {submitting ? <AnalysisLoader /> : (
              <Button variant="navy" size="xl" className="w-full" disabled={!canSubmit} onClick={onSubmit}>
                <Linkedin className="mr-2" /> Review My LinkedIn
              </Button>
            )}
            {!canSubmit && !submitting && <p className="mt-3 text-center text-xs text-muted-foreground">Upload a PDF and fill in all three details to continue.</p>}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ratingColor(r: string) {
  if (r === "Strong") return "bg-[var(--success)] text-[var(--success-foreground)]";
  if (r === "Needs Work") return "bg-[#F97316] text-white";
  return "bg-destructive text-destructive-foreground";
}
function scoreColor(s: number) {
  if (s >= 71) return "var(--success)";
  if (s >= 41) return "var(--warning)";
  return "var(--destructive)";
}

function ResultsView({ result, onReset }: { result: LinkedInAnalysis; onReset: () => void }) {
  const clamped = Math.max(0, Math.min(100, result.overall_score));
  const color = scoreColor(clamped);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">LinkedIn Profile Score</p>
            <div className="relative mx-auto mt-4 size-44">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--secondary)" strokeWidth="12" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(clamped / 100) * 326.7} 326.7`} style={{ transition: "stroke-dasharray 800ms ease-out" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-primary">{clamped}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>

          {result.rewritten_headline && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-primary"><Star className="size-5" /><h2 className="text-lg font-bold">Suggested Headline</h2></div>
              <p className="mt-3 rounded-xl bg-primary/5 p-4 text-base font-medium text-foreground italic">&ldquo;{result.rewritten_headline}&rdquo;</p>
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              { icon: <Linkedin className="size-5" />, title: "Photo & Headline", data: result.photo_headline },
              { icon: <Search className="size-5" />, title: "About Section", data: result.about_section },
              { icon: <Globe2 className="size-5" />, title: "Experience", data: result.experience },
              { icon: <MapPin className="size-5" />, title: "Malaysia Market Fit", data: result.malaysia_market_fit },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{card.icon}</div>
                    <h3 className="font-semibold text-foreground">{card.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ratingColor(card.data.rating)}`}>{card.data.rating}</span>
                    <span className="text-sm font-bold text-primary">{card.data.score}</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {card.data.feedback.map((f, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{f}</span></li>)}
                </ul>
              </div>
            ))}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Search className="size-5" /></div>
                  <h3 className="font-semibold text-foreground">Skills</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ratingColor(result.skills.rating)}`}>{result.skills.rating}</span>
                  <span className="text-sm font-bold text-primary">{result.skills.score}</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {result.skills.missing_skills.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">Missing</p><div className="flex flex-wrap gap-2">{result.skills.missing_skills.map((k) => <span key={k} className="rounded-full bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">{k}</span>)}</div></div>}
                {result.skills.present_skills.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--success)]">Present</p><div className="flex flex-wrap gap-2">{result.skills.present_skills.map((k) => <span key={k} className="rounded-full bg-[var(--success)]/15 px-3 py-1.5 text-sm font-medium text-[var(--success)]">{k}</span>)}</div></div>}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Globe2 className="size-5" /></div>
                  <h3 className="font-semibold text-foreground">Keywords</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ratingColor(result.keywords.rating)}`}>{result.keywords.rating}</span>
                  <span className="text-sm font-bold text-primary">{result.keywords.score}</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {result.keywords.missing_keywords.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">Missing</p><div className="flex flex-wrap gap-2">{result.keywords.missing_keywords.map((k) => <span key={k} className="rounded-full bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">{k}</span>)}</div></div>}
                {result.keywords.present_keywords.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--success)]">Present</p><div className="flex flex-wrap gap-2">{result.keywords.present_keywords.map((k) => <span key={k} className="rounded-full bg-[var(--success)]/15 px-3 py-1.5 text-sm font-medium text-[var(--success)]">{k}</span>)}</div></div>}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="text-xl font-bold text-primary">Priority Improvements</h2>
            <ol className="mt-6 space-y-4">
              {result.priority_improvements.map((imp, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <p className="pt-1 text-sm leading-relaxed text-foreground">{imp}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="lg" onClick={onReset}>Review Another Profile</Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

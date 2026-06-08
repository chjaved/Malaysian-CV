"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, CheckCircle2, Loader2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { extractPdfText } from "@/lib/pdf-extract";
import { AnalysisLoader } from "@/components/analysis-loader";

const COMPANY_TYPES = ["Local Malaysian Company (SME/Private)", "GLC (Petronas, Maybank, TNB, etc.)", "MNC in Malaysia (Shell, IBM, Deloitte, etc.)", "Government / Civil Service", "Startup"];
const INDUSTRIES = ["Technology & IT", "Finance & Banking", "Marketing & Communications", "Engineering", "Healthcare", "Education", "Operations & Logistics", "Others"];
const EXPERIENCE = ["Fresh Graduate (0-1 year)", "Junior (1-3 years)", "Mid Level (3-6 years)", "Senior (6+ years)"];
const LANGUAGES = ["English", "Bahasa Malaysia", "Bilingual (Both)"];

export default function AnalyzePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [companyType, setCompanyType] = useState("");
  const [industry, setIndustry] = useState("");
  const [experience, setExperience] = useState("");
  const [language, setLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setExtractError(null);
    if (f.type !== "application/pdf") { setExtractError("Only PDF files are supported."); return; }
    if (f.size > 5 * 1024 * 1024) { setExtractError("File too large. Max 5MB."); return; }
    setFile(f);
    setExtracting(true);
    try {
      const text = await extractPdfText(f);
      if (!text || text.trim().length < 50) {
        setExtractError("Your PDF appears to be image-based. Please upload a text-based PDF for best results.");
        setCvText("");
      } else { setCvText(text); }
    } catch (e) {
      console.error(e);
      setExtractError("We couldn't read your PDF. Please make sure it's not password protected.");
      setCvText("");
    } finally { setExtracting(false); }
  }, []);

  const canSubmit = cvText && companyType && industry && experience && language && !submitting && !extracting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: cvText, company_type: companyType, industry, experience_level: experience, language_preference: language }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const { result } = await res.json();
      sessionStorage.setItem("resumy:lastResult", JSON.stringify({ result, cv_text: cvText, meta: { companyType, industry, experience, language } }));
      router.push("/results");
    } catch (e: any) {
      const msg = e?.message || "";
      let friendly = "Analysis failed. Please check your connection and try again.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) friendly = "Network error. Please check your internet connection.";
      else if (msg.includes("429")) friendly = "We're handling lots of CVs right now. Please try again in a minute.";
      else if (msg) friendly = msg;
      toast.error(friendly, { duration: 6000 });
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Analyze Your CV</h1>
          <p className="mt-2 text-muted-foreground">Step 1 — Upload your CV · Step 2 — Tell us your target</p>
          <div className="mt-8">
            <Label className="text-base font-semibold">Step 1 of 2 — Upload</Label>
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
              ) : file && cvText ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-10 text-[var(--success)]" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · text extracted</p>
                  <p className="mt-2 text-xs text-muted-foreground underline">Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-10 text-primary" />
                  <p className="text-base font-medium text-foreground">Drag your CV here or click to upload</p>
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
            <Label className="text-base font-semibold">Step 2 of 2 — Your Details</Label>
            {[
              { label: "I am applying to:", value: companyType, onChange: setCompanyType, placeholder: "Select target employer", items: COMPANY_TYPES },
              { label: "Your Industry:", value: industry, onChange: setIndustry, placeholder: "Select industry", items: INDUSTRIES },
              { label: "Your Experience Level:", value: experience, onChange: setExperience, placeholder: "Select experience", items: EXPERIENCE },
              { label: "Preferred CV Language:", value: language, onChange: setLanguage, placeholder: "Select language", items: LANGUAGES },
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
                <FileText className="mr-2" /> Analyze My CV Now
              </Button>
            )}
            {!canSubmit && !submitting && <p className="mt-3 text-center text-xs text-muted-foreground">Upload a CV and fill in all four details to continue.</p>}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

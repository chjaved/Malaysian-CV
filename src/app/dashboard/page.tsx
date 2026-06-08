"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-header";

type AnalysisRow = { id: string; created_at: string; company_type: string; industry: string; experience_level: string; overall_score: number; full_results: Record<string, unknown> | null };

function scoreColor(s: number) {
  if (s >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s >= 60) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); }

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<AnalysisRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error: err } = await supabase.from("analyses").select("id, created_at, company_type, industry, experience_level, overall_score, full_results").eq("user_id", user.id).order("created_at", { ascending: false });
      if (err) { setError(err.message); return; }
      setRows((data ?? []) as AnalysisRow[]);
    })();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {authLoading || !user ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-primary">Welcome back</h1>
              <p className="mt-1 text-muted-foreground">{user.email}</p>
            </header>
            {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Couldn&apos;t load your analyses: {error}</div>}
            {!error && rows === null && <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}
            {!error && rows && rows.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">You haven&apos;t analyzed a CV yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">Get instant, Malaysia-specific feedback on your CV.</p>
                <Link href="/analyze" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Analyze your CV</Link>
              </div>
            )}
            {rows && rows.length > 0 && (
              <div className="space-y-3">
                {rows.map((r) => {
                  const open = expanded === r.id;
                  return (
                    <div key={r.id} className="rounded-xl border border-border bg-card shadow-sm">
                      <button onClick={() => setExpanded(open ? null : r.id)} className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left sm:p-5" aria-expanded={open}>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                            <span>{r.industry}</span><span className="text-muted-foreground">·</span><span>{r.company_type}</span><span className="text-muted-foreground">·</span><span>{r.experience_level}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</div>
                        </div>
                        <div className={`shrink-0 inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm font-semibold ${scoreColor(r.overall_score)}`}>{r.overall_score}</div>
                        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      {open && (
                        <div className="space-y-4 border-t border-border p-4 sm:p-5">
                          <ResultsDetail data={r.full_results} score={r.overall_score} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ResultsDetail({ data, score }: { data: Record<string, unknown> | null; score: number }) {
  if (!data || typeof data !== "object") return <p className="text-sm text-muted-foreground">No detailed results stored.</p>;
  const sections = [{ key: "structure", label: "Structure" }, { key: "keywords", label: "Keywords" }, { key: "language_balance", label: "Language Balance" }, { key: "malaysia_market_fit", label: "Malaysia Market Fit" }];
  const priority = (data as any).priority_improvements as string[] | undefined;
  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3"><div className="text-4xl font-bold text-primary">{score}</div><div className="text-sm text-muted-foreground">overall score</div></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => {
          const v = (data as any)[s.key];
          if (!v || typeof v !== "object") return null;
          return (
            <div key={s.key} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">{s.label}</div>
                {typeof v.score === "number" && <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${scoreColor(v.score)}`}>{v.score}</span>}
              </div>
              {Array.isArray(v.present_keywords) && v.present_keywords.length > 0 && <KeywordList label="Present" items={v.present_keywords} tone="ok" />}
              {Array.isArray(v.missing_keywords) && v.missing_keywords.length > 0 && <KeywordList label="Missing" items={v.missing_keywords} tone="warn" />}
              {Array.isArray(v.feedback) && v.feedback.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{v.feedback.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>}
            </div>
          );
        })}
      </div>
      {Array.isArray(priority) && priority.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <div className="text-sm font-semibold text-foreground">Priority Improvements</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{priority.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function KeywordList({ label, items, tone }: { label: string; items: string[]; tone: "ok" | "warn" }) {
  const cls = tone === "ok" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200";
  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">{items.map((k, i) => <span key={i} className={`inline-flex rounded-md border px-2 py-0.5 text-xs ${cls}`}>{k}</span>)}</div>
    </div>
  );
}

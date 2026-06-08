import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/employer/dashboard")({
  component: EmployerDashboardPage,
  head: () => ({
    meta: [
      { title: "Employer Dashboard — ResuMY" },
      { name: "description", content: "Post jobs and manage your listings." },
    ],
  }),
});

type JobRow = {
  id: string;
  created_at: string;
  job_title: string;
  company_name: string;
  employer_type: string;
  location: string;
  status: string;
};

const EMPLOYER_TYPES = ["GLC", "MNC", "Local", "Government"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function EmployerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [checkingRole, setCheckingRole] = useState(true);
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employerType, setEmployerType] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  // Auth + role gate
  useEffect(() => {
    if (authLoading) return;
    if (!user) { void navigate({ to: "/employer/login" }); return; }
    (async () => {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "employer") {
        void navigate({ to: "/employer/login" });
        return;
      }
      setCheckingRole(false);
    })();
  }, [authLoading, user, navigate]);

  const loadJobs = async () => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from("jobs")
      .select("id, created_at, job_title, company_name, employer_type, location, status")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    if (err) { setError(err.message); return; }
    setJobs((data ?? []) as JobRow[]);
  };

  useEffect(() => {
    if (!checkingRole && user) void loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingRole, user]);

  const resetForm = () => {
    setJobTitle(""); setCompanyName(""); setEmployerType("");
    setIndustry(""); setLocation(""); setDescription(""); setRequirements("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!jobTitle || !companyName || !employerType || !industry || !location || !description || !requirements) {
      toast.error("Please fill in all fields."); return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from("jobs").insert({
      employer_id: user.id,
      job_title: jobTitle,
      company_name: companyName,
      employer_type: employerType,
      industry,
      location,
      description,
      requirements,
      status: "open",
    });
    setSubmitting(false);
    if (err) { toast.error(err.message); return; }
    toast.success("Job posted!");
    resetForm();
    setShowForm(false);
    void loadJobs();
  };

  if (authLoading || checkingRole) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For Employers</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">Employer Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">Post and manage your job listings.</p>
            </div>
            <Button variant="navy" onClick={() => setShowForm((v) => !v)}>
              <Plus className="mr-2 size-4" /> {showForm ? "Close" : "Post a Job"}
            </Button>
          </div>

          {showForm && (
            <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="job_title">Job title</Label>
                <Input id="job_title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_name">Company name</Label>
                <Input id="company_name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employer_type">Employer type</Label>
                <Select value={employerType} onValueChange={setEmployerType}>
                  <SelectTrigger id="employer_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kuala Lumpur" required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea id="requirements" rows={5} value={requirements} onChange={(e) => setRequirements(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <Button variant="navy" type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Posting…</> : "Post Job"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-primary">Your job posts</h2>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            {jobs === null && !error ? (
              <div className="mt-6 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : jobs && jobs.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <Briefcase className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">You haven't posted any jobs yet.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {jobs?.map((j) => (
                  <li key={j.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-primary">{j.job_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {j.company_name} · {j.employer_type} · {j.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(j.created_at)}</span>
                        <span className="inline-flex items-center rounded-full border border-border bg-secondary/40 px-2 py-0.5 font-medium capitalize text-foreground">
                          {j.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
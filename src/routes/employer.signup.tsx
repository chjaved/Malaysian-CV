import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/employer/signup")({
  component: EmployerSignupPage,
  head: () => ({
    meta: [
      { title: "Employer Sign Up — ResuMY" },
      { name: "description", content: "Create an employer account on ResuMY to post jobs." },
    ],
  }),
});

function EmployerSignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Email and password are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSubmitting(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/employer/login`,
        data: { role: "employer" },
      },
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    if (data.session) {
      // Ensure profile role is employer (in case trigger didn't pick up metadata)
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, role: "employer" });
      }
      toast.success("Welcome to ResuMY for Employers!");
      void navigate({ to: "/employer/dashboard" });
    } else {
      toast.success("Check your email to confirm your account.");
      void navigate({ to: "/employer/login" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For Employers</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">Create an employer account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Post jobs and reach Malaysian talent.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="navy" type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating account…</> : "Sign Up as Employer"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an employer account? <Link to="/employer/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Looking for a job? <Link to="/signup" className="hover:underline">Job seeker sign up</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
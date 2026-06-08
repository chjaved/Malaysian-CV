"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export default function EmployerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Email and password are required."); return; }
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setSubmitting(false);
      const msg = err.message.toLowerCase();
      if (msg.includes("not confirmed")) setError("Please confirm your email address before logging in.");
      else if (msg.includes("invalid login")) setError("Incorrect email or password.");
      else setError(err.message);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    let role = "job_seeker";
    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if (profile?.role) role = profile.role;
    }
    setSubmitting(false);
    if (role !== "employer") {
      await supabase.auth.signOut();
      setError("This account isn't an employer account. Use the job seeker login instead.");
      return;
    }
    toast.success("Welcome back!");
    router.push("/employer/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For Employers</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">Employer log in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your job postings.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="navy" type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Logging in…</> : "Log In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New employer? <Link href="/employer/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Looking for a job? <Link href="/login" className="hover:underline">Job seeker login</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

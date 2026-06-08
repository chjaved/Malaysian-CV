import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log In — ResuMY" },
      { name: "description", content: "Log in to your ResuMY account." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
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
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setError("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
      } else if (msg.includes("invalid login")) {
        setError("Incorrect email or password.");
      } else {
        setError(err.message);
      }
      return;
    }
    // Branch by role
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    let role = "job_seeker";
    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if (profile?.role) role = profile.role;
    }
    setSubmitting(false);
    toast.success("Welcome back!");
    void navigate({ to: role === "employer" ? "/employer/dashboard" : "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in to access your saved CV analyses.</p>
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
            New here? <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

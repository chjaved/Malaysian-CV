import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Upload, Target, Sparkles, Globe2, Search, MapPin, GraduationCap, ArrowRight, Linkedin, FileDown, UploadCloud, Settings2, BarChart3, FileText, FilePlus, Briefcase, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ResuMY — Get Your CV Ready for Malaysia's Job Market" },
      { name: "description", content: "AI-powered CV feedback built specifically for Malaysian employers, GLCs, MNCs and government roles. Free first analysis, no signup required." },
    ],
  }),
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--secondary)_0%,_transparent_70%)]"
          />
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span aria-hidden>🇲🇾</span> Built for Malaysia. Not translated for it.
            </div>
            <h1 className="text-[24px] font-extrabold leading-[1.15] tracking-tight text-primary sm:text-4xl">
              Get Your CV Ready for{" "}
              <span className="whitespace-nowrap">Malaysia's Job Market</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-[15px] text-muted-foreground sm:text-xl">
              AI-powered CV analysis, cover letters, LinkedIn review and interview prep — all built for how Malaysian employers actually hire.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3">
              <Button asChild variant="navy" size="xl">
                <Link to="/analyze">
                  Analyze My CV Free <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                No signup required for first analysis
              </p>
            </div>
          </div>
        </section>

        {/* EVERYTHING YOU NEED */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[22px] font-bold tracking-tight text-primary sm:text-4xl">
                Everything You Need to Land the Job
              </h2>
              <p className="mt-3 text-[15px] text-muted-foreground">
                One platform. Every step of your Malaysian job search.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { icon: FileText, title: "CV Analyzer", desc: "Get a 0–100 score and fixes tailored to GLCs, MNCs, local firms or government.", href: "/analyze" },
                { icon: FilePlus, title: "AI Cover Letters", desc: "Generate a Malaysia-specific cover letter for any job in seconds.", href: null },
                { icon: Linkedin, title: "LinkedIn Review", desc: "Get your LinkedIn profile scored for the Malaysian market.", href: "/linkedin-review" },
                { icon: Briefcase, title: "Job Matches", desc: "See real Malaysian jobs matched to your CV.", href: null },
                { icon: MessageSquare, title: "Interview Prep", desc: "Practice with a mock interviewer tuned to your target employer.", href: null, comingSoon: true },
              ].map((f) => {
                const Card = (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                      {f.comingSoon && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[15px] text-muted-foreground">{f.desc}</p>
                  </div>
                );
                return f.href ? (
                  <Link key={f.title} to={f.href} className="block">
                    {Card}
                  </Link>
                ) : (
                  Card
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[22px] font-bold tracking-tight text-primary sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-[15px] text-muted-foreground">
                Three steps. Thirty seconds. Real Malaysian context.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { icon: Upload, title: "Upload your CV", desc: "Drop in your PDF — we extract the text instantly." },
                { icon: Target, title: "Tell us your target", desc: "GLC, MNC, government, startup or local SME." },
                { icon: Sparkles, title: "Get instant feedback", desc: "AI-graded report in about 30 seconds." },
              ].map((s, i) => (
                <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    Step {i + 1}
                  </div>
                  <s.icon className="mb-4 size-8 text-[var(--brand-red)]" />
                  <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-[15px] text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* LinkedIn Profile Reviewer */}
            <div className="mx-auto mt-20 max-w-2xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Linkedin className="size-3.5" /> Also available
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-primary sm:text-3xl">
                Review Your LinkedIn Profile
              </h3>
              <p className="mt-3 text-[15px] text-muted-foreground">
                AI feedback on your headline, about section, experience, skills and Malaysian market fit.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              {[
                { icon: Linkedin, title: "Open your profile", desc: "Go to your LinkedIn profile." },
                { icon: FileDown, title: "Save to PDF", desc: "Click More → Save to PDF." },
                { icon: UploadCloud, title: "Upload to ResuMY", desc: "Drop your LinkedIn PDF in." },
                { icon: Settings2, title: "Set your target", desc: "Pick experience, industry and goal." },
                { icon: BarChart3, title: "Get AI feedback", desc: "Headline, about, skills and market fit." },
              ].map((s, i) => (
                <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    Step {i + 1}
                  </div>
                  <s.icon className="mb-4 size-8 text-[var(--brand-red)]" />
                  <h4 className="text-base font-semibold text-foreground">{s.title}</h4>
                  <p className="mt-2 text-[15px] text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button asChild variant="navy" size="lg">
                <Link to="/linkedin-review">
                  Review My LinkedIn <ArrowRight className="ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[22px] font-bold tracking-tight text-primary sm:text-4xl">
                What Makes ResuMY Different
              </h2>
              <p className="mt-3 text-[15px] text-muted-foreground">
                Generic CV tools miss Malaysia. We don't.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
              { icon: MapPin, title: "Knows Your Target Employer", desc: "A Petronas CV and a startup CV aren't the same document. We score yours against the exact employer type you're targeting — GLC, MNC, local or government." },
                { icon: Globe2, title: "BM / English Balance", desc: "Government roles may expect Bahasa. MNCs want sharp English. We flag where your language choice wins points — or quietly costs you them." },
                { icon: Search, title: "Beats the Local ATS", desc: "We pull keywords from real Malaysian listings, so your CV clears the filters local recruiters actually use — not ones built for a US job market." },
                { icon: GraduationCap, title: "Fresh Grad Mode", desc: "Overseas tools tell you to drop your photo and CGPA. Malaysian employers often expect both. We guide fresh grads on what local recruiters really look for." },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-[15px] text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EMPLOYER BAND */}
        <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
            <h2 className="text-[22px] font-bold sm:text-4xl">
              Hiring in Malaysia?
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-primary-foreground/80">
              Post a job and reach candidates whose CVs are already optimized for the Malaysian market.
            </p>
            <Button asChild variant="navy" size="xl" className="mt-8 bg-background text-primary hover:bg-background/90">
              <Link to="/employer/login">For Employers</Link>
            </Button>
          </div>
        </section>

        {/* CTA strip */}
        <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
            <h2 className="text-[22px] font-bold sm:text-4xl">
              Ready to stand out to Malaysian employers?
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-primary-foreground/80">
              First analysis is free. No signup. No credit card.
            </p>
            <Button asChild variant="navy" size="xl" className="mt-8 bg-background text-primary hover:bg-background/90">
              <Link to="/analyze">Analyze My CV Free</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

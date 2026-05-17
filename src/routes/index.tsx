import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroPhone } from "@/components/sections/HeroPhone";
import { AppCard } from "@/components/AppCard";
import { PhoneFrame } from "@/components/PhoneFrame";
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Zap,
  Upload,
  ScanSearch,
  Gauge,
  Check,
  Star,
  Trash2,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DateShield — Spot fake dating profiles in seconds" },
      {
        name: "description",
        content:
          "Upload a screenshot of any dating profile and get an instant AI risk analysis. Detect catfish, scams and reused photos with DateShield.",
      },
      { property: "og:title", content: "DateShield — Spot fake dating profiles in seconds" },
      {
        property: "og:description",
        content:
          "AI-powered scam and catfish detection for dating apps. Upload, scan, stay safe.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="relative mx-auto w-full max-w-[440px] px-4 pb-16 pt-8 sm:max-w-[480px]">
      {/* Top nav */}
      <header className="mb-8 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-azure shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">DateShield</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="glass rounded-full px-4 py-1.5 text-xs font-medium text-white/90 hover:text-white">
            Sign in
          </Link>
          <Link to="/signup" className="gradient-azure rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-glow hover:scale-[1.02]">
            Sign up
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="mb-20 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] text-white/80 animate-fade-up">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-pulse-ring" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          AI scanner online
        </div>
        <h1
          className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          Check dating profiles{" "}
          <span className="text-gradient-azure">instantly</span>
        </h1>
        <p
          className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-white/70 animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          Upload a screenshot and get a full risk analysis in seconds. Catch catfish, scams and
          fake photos before you swipe.
        </p>

        <div
          className="mx-auto mt-6 flex max-w-xs flex-col gap-3 animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <Link to="/signup" className="gradient-azure rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] active:scale-[0.98]">
            Start Scan →
          </Link>
          <button className="glass rounded-full px-6 py-3 text-sm font-medium text-white/90 hover:text-white">
            Free trial for 1 month
          </button>
        </div>

        <div className="mt-12 animate-float" style={{ animationDelay: "240ms" }}>
          <HeroPhone />
        </div>
      </section>

      {/* APP PREVIEW — stacked screens */}
      <SectionHeader eyebrow="Inside the app" title="Three taps to safety" />
      <div className="mb-20 space-y-5">
        {/* Upload screen */}
        <PreviewMini title="1 · Upload">
          <div className="glass-strong flex flex-col items-center gap-2 rounded-2xl border-dashed py-6">
            <Upload className="h-5 w-5 text-azure-glow" />
            <p className="text-sm font-medium text-white">Drop screenshot</p>
            <p className="text-[10px] text-white/50">or tap to browse</p>
          </div>
        </PreviewMini>

        {/* Scanning */}
        <PreviewMini title="2 · Scanning">
          <div className="relative overflow-hidden rounded-2xl bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-azure-glow" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Analyzing image…</p>
                <p className="text-[11px] text-white/50">Reverse search · bio NLP · metadata</p>
              </div>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 gradient-azure" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-azure/30 to-transparent animate-scan" />
          </div>
        </PreviewMini>

        {/* Result */}
        <PreviewMini title="3 · Result">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/50">Verdict</span>
              <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                LIKELY FAKE
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-white">87 / 100</p>
            <p className="mt-1 text-xs text-white/60">3 red flags detected</p>
          </div>
        </PreviewMini>
      </div>

      {/* HOW IT WORKS */}
      <SectionHeader eyebrow="How it works" title="From swipe to safe in 3 steps" />
      <div className="mb-20 space-y-3">
        {[
          { icon: Upload, title: "Upload screenshot", desc: "Drop the profile pic or full bio." },
          { icon: ScanSearch, title: "AI scans everything", desc: "Reverse image, bio, metadata." },
          { icon: Gauge, title: "Get risk score", desc: "Clear 0–100 verdict with reasons." },
        ].map((s, i) => (
          <AppCard key={s.title} className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-azure text-white shadow-glow">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-azure-glow">
                Step {i + 1}
              </p>
              <h3 className="text-base font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-white/60">{s.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/40" />
          </AppCard>
        ))}
      </div>

      {/* FEATURES */}
      <SectionHeader eyebrow="Features" title="Built for the modern dater" />
      <div className="mb-20 grid grid-cols-2 gap-3">
        {[
          { icon: Sparkles, title: "AI image analysis", desc: "Detects deepfakes & filters." },
          { icon: ShieldCheck, title: "Scam detection", desc: "Catches romance fraud patterns." },
          { icon: Lock, title: "Privacy first", desc: "End-to-end encrypted uploads." },
          { icon: Zap, title: "Fast results", desc: "Full report in under 8 seconds." },
        ].map((f) => (
          <AppCard key={f.title} className="flex flex-col gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-azure/20">
              <f.icon className="h-4 w-4 text-azure-glow" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">{f.desc}</p>
            </div>
          </AppCard>
        ))}
      </div>

      {/* PRICING */}
      <SectionHeader eyebrow="Pricing" title="Pick your shield" />
      <div className="mb-20 space-y-4">
        {[
          { id: "basic", name: "Basic", price: "3", per: "/mo", scans: "30 scans / month", popular: false, features: ["Risk score", "Basic flags"] },
          { id: "pro", name: "Pro", price: "9", per: "/mo", scans: "100 scans / month", popular: true, features: ["Everything in Basic", "Reverse image search", "Bio NLP analysis", "Priority queue"] },
          { id: "unlimited", name: "Unlimited", price: "19", per: "/mo", scans: "Unlimited scans", popular: false, features: ["Everything in Pro", "API access", "History & exports"] },
        ].map((p) => (
          <div
            key={p.name}
            className={`relative rounded-3xl p-5 transition hover:-translate-y-1 ${
              p.popular
                ? "glass-strong shadow-glow ring-1 ring-azure/50"
                : "glass"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full gradient-azure px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow">
                <Star className="h-3 w-3 fill-white" /> Most Popular
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-bold text-white">{p.name}</h3>
              <div className="text-right">
                <span className="font-display text-3xl font-bold text-white">${p.price}</span>
                <span className="ml-1 text-xs text-white/50">{p.per}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-azure-glow">{p.scans}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-white/80">
                  <div className="grid h-4 w-4 place-items-center rounded-full bg-azure/20">
                    <Check className="h-2.5 w-2.5 text-azure-glow" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/trial"
              search={{ plan: p.id as "basic" | "pro" | "unlimited" }}
              className={`mt-5 block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                p.popular
                  ? "gradient-azure text-white shadow-glow hover:scale-[1.02]"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              Choose {p.name}
            </Link>
          </div>
        ))}
      </div>

      {/* TRUST */}
      <SectionHeader eyebrow="Trust" title="Your privacy is the product" />
      <div className="mb-20 space-y-3">
        {[
          { icon: Lock, title: "Your data is secure", desc: "256-bit encryption end-to-end." },
          { icon: Trash2, title: "Auto-delete screenshots", desc: "Removed within 60 seconds of scan." },
          { icon: EyeOff, title: "No permanent storage", desc: "We never see who you're looking at." },
        ].map((t) => (
          <AppCard key={t.title} className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success/20">
              <t.icon className="h-4 w-4 text-success" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t.title}</h3>
              <p className="text-[11px] text-white/60">{t.desc}</p>
            </div>
          </AppCard>
        ))}
      </div>

      {/* FINAL CTA */}
      <section className="mb-12">
        <div className="glass-strong rounded-3xl p-6 text-center shadow-glow">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-azure shadow-glow">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Date with confidence</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-white/70">
            Join thousands of US daters using DateShield to spot fake profiles before it's too
            late.
          </p>
          <button className="mt-5 w-full gradient-azure rounded-full py-4 text-sm font-bold text-white shadow-glow transition hover:scale-[1.02] active:scale-[0.98]">
            Start Your First Scan
          </button>
          <p className="mt-3 text-[11px] text-white/50">No credit card required · 3 free scans</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md gradient-azure">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display text-sm font-bold">DateShield</span>
        </div>
        <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/60">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Support</a>
          <a href="#" className="hover:text-white">Twitter</a>
        </nav>
        <p className="text-[11px] text-white/40">© 2026 DateShield · Made for safer dating in the USA</p>
      </footer>
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-azure-glow">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{title}</h2>
    </div>
  );
}

function PreviewMini({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AppCard>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/50">
        {title}
      </p>
      {children}
    </AppCard>
  );
}

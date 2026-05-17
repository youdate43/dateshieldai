import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Lock, Mail, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign In — DateShield" },
      {
        name: "description",
        content:
          "Sign in to DateShield to scan dating profiles safely with AI-powered risk detection.",
      },
      { property: "og:title", content: "Sign In — DateShield" },
      {
        property: "og:description",
        content: "Sign in to DateShield and continue scanning dating profiles safely.",
      },
    ],
  }),
});

function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-10">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-azure)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.18 50 / 0.6), transparent 70%)",
          }}
        />
      </div>

      <PhoneFrame>
        <div className="flex h-full flex-col">
          {/* Header */}
          <header className="mb-6 mt-2 flex items-center justify-between">
            <Link
              to="/"
              className="text-xs font-medium text-white/60 transition-colors hover:text-white"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-1.5 rounded-full glass px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-[var(--azure-glow)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                DateShield
              </span>
            </div>
          </header>

          {/* Title */}
          <div className="mb-7 animate-fade-up">
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl glass-strong shadow-glow">
              <Lock className="h-5 w-5 text-[var(--azure-glow)]" />
            </div>
            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              Sign in to continue scanning safely
            </p>
          </div>

          {/* Form Card */}
          <form
            className="glass-strong space-y-3.5 rounded-3xl p-5 animate-fade-up"
            style={{ animationDelay: "80ms" }}
            onSubmit={(e) => e.preventDefault()}
          >
            <Field
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="Email address"
              autoComplete="email"
            />
            <Field
              icon={<KeyRound className="h-4 w-4" />}
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-white/50 transition-colors hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-white/70">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className={`flex h-4 w-4 items-center justify-center rounded-md border transition-all ${
                    remember
                      ? "border-transparent bg-[var(--azure)] shadow-glow"
                      : "border-white/25 bg-white/5"
                  }`}
                  aria-label="Remember me"
                >
                  {remember && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
                      <path
                        d="M2.5 6.5l2.5 2.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                Remember me
              </label>
              <a
                href="#"
                className="font-medium text-[var(--azure-glow)] transition-colors hover:text-white"
              >
                Forgot password?
              </a>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{ background: "var(--gradient-azure)" }}
            >
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

          </form>

          {/* Sign up link */}
          <p className="mt-5 text-center text-sm text-white/60">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-[var(--azure-glow)] transition-colors hover:text-white"
            >
              Sign up
            </Link>
          </p>

          {/* Privacy note */}
          <div className="mt-4 flex items-start gap-2 rounded-2xl glass px-3.5 py-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--success)]" />
            <p className="text-[11px] leading-relaxed text-white/60">
              Protected by end-to-end encryption. Your data stays private.
            </p>
          </div>

          {/* Footer */}
          <footer className="mt-auto pt-6 text-center">
            <div className="flex items-center justify-center gap-3 text-[11px] text-white/40">
              <a href="#" className="transition-colors hover:text-white/80">
                Privacy Policy
              </a>
              <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
              <a href="#" className="transition-colors hover:text-white/80">
                Terms of Service
              </a>
            </div>
          </footer>
        </div>
      </PhoneFrame>
    </main>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  trailing?: React.ReactNode;
}

function Field({ icon, trailing, ...props }: FieldProps) {
  return (
    <label className="group relative flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 transition-all duration-200 focus-within:border-[var(--azure)]/60 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_0_4px_oklch(0.68_0.18_240/0.15)]">
      <span className="text-white/40 transition-colors group-focus-within:text-[var(--azure-glow)]">
        {icon}
      </span>
      <input
        {...props}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
      />
      {trailing}
    </label>
  );
}


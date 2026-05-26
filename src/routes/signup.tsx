import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Lock, Mail, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleLoginModal } from "@/components/GoogleLoginModal";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Sign Up — DateShield" },
      {
        name: "description",
        content:
          "Create your DateShield account and start scanning dating profiles safely with AI-powered risk detection.",
      },
      { property: "og:title", content: "Sign Up — DateShield" },
      {
        property: "og:description",
        content: "Create your DateShield account in seconds. Scan dating profiles safely.",
      },
    ],
  }),
});

function SignUpPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/trial` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Verify your identity to continue.");
    navigate({ to: "/verify-identity" });
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-10">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-azure)" }}
        />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.18 50 / 0.6), transparent 70%)" }}
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
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              Start scanning dating profiles safely
            </p>
          </div>

          {/* Form Card */}
          <form
            className="glass-strong space-y-3.5 rounded-3xl p-5 animate-fade-up"
            style={{ animationDelay: "80ms" }}
            onSubmit={handleSubmit}
          >
            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => setGoogleOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C41.4 35.5 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-wider text-white/40">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Field
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              icon={<KeyRound className="h-4 w-4" />}
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            <Field
              icon={<KeyRound className="h-4 w-4" />}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="text-white/50 transition-colors hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: "var(--gradient-azure)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

          </form>

          <GoogleLoginModal open={googleOpen} onClose={() => setGoogleOpen(false)} />

          {/* Login link */}
          <p className="mt-5 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-semibold text-[var(--azure-glow)] transition-colors hover:text-white"
            >
              Log in
            </Link>
          </p>

          {/* Privacy note */}
          <div className="mt-4 flex items-start gap-2 rounded-2xl glass px-3.5 py-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--success)]" />
            <p className="text-[11px] leading-relaxed text-white/60">
              We respect your privacy. Your data is encrypted and never shared.
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

function Field({ icon, trailing, className, ...props }: FieldProps) {
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


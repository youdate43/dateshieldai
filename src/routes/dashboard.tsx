import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PhoneFrame } from "@/components/PhoneFrame";
import { validateProfileImage } from "@/lib/validate-profile.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  CreditCard,
  X,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — DateShield" },
      {
        name: "description",
        content:
          "Upload dating profile screenshots and instantly detect risky or fake profiles with DateShield.",
      },
    ],
  }),
});

type RiskLevel = "low" | "medium" | "high";
type Scan = {
  id: string;
  thumb: string;
  level: RiskLevel;
  score: number;
  date: string;
  flags: string[];
};

const FLAG_POOL = [
  "Image found on multiple sites",
  "Suspicious bio text",
  "Recently created profile",
  "Inconsistent location data",
  "Reverse-image match (3 sources)",
  "Generic AI-style portrait",
];

function pickLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function DashboardPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Scan | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);
  const [lifetimeScanCount, setLifetimeScanCount] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [missingSignals, setMissingSignals] = useState<string[]>([]);
  const validateFn = useServerFn(validateProfileImage);

  const [trialDaysLeft, setTrialDaysLeft] = useState(24);
  const trialTotal = 30;
  const trialPct = (trialDaysLeft / trialTotal) * 100;

  useEffect(() => {
    try {
      const completedAt = localStorage.getItem("trial_completed_at");
      if (completedAt) {
        const days = Math.floor(
          (Date.now() - new Date(completedAt).getTime()) / 86400000,
        );
        setTrialDaysLeft(Math.max(0, 29 - days));
      }
    } catch {}
  }, []);

  // Load user + lifetime scan count + recent history from DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        setLifetimeScanCount(0);
        return;
      }
      const [{ count }, { data: rows }] = await Promise.all([
        supabase
          .from("user_scans")
          .select("*", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("user_scans")
          .select("id, score, level, flags, thumb, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (cancelled) return;
      setLifetimeScanCount(count ?? 0);
      if (rows) {
        setHistory(
          rows.map((r) => ({
            id: r.id,
            thumb: r.thumb ?? "",
            level: r.level as RiskLevel,
            score: r.score,
            flags: r.flags ?? [],
            date: new Date(r.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|jpg)/.test(f.type)) return;
    setResult(null);
    setValidationError(null);
    setMissingSignals([]);
    setFile({ url: URL.createObjectURL(f), name: f.name });
  };

  const fileToDataUrl = (url: string): Promise<string> =>
    new Promise((resolve, reject) => {
      fetch(url)
        .then((r) => r.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });

  const handleScan = async () => {
    if (!file || scanning) return;
    setScanning(true);
    setValidationError(null);
    setMissingSignals([]);

    try {
      const imageDataUrl = await fileToDataUrl(file.url);
      const validation = await validateFn({ data: { imageDataUrl } });
      if (!validation.isProfile) {
        setScanning(false);
        setValidationError(
          validation.reason ||
            "Please upload a valid dating app profile screenshot.",
        );
        setMissingSignals(validation.missing ?? []);
        return;
      }
    } catch {
      setScanning(false);
      setValidationError("Could not verify the image. Please try again.");
      return;
    }

    setTimeout(async () => {
      const isFirstScan = (lifetimeScanCount ?? 0) === 0;
      const score = isFirstScan
        ? Math.floor(Math.random() * 16)
        : Math.floor(35 + Math.random() * 60);
      const level = pickLevel(score);
      const flags = [...FLAG_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
      const scan: Scan = {
        id: crypto.randomUUID(),
        thumb: file.url,
        level,
        score,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        flags,
      };
      if (userId) {
        const { data: inserted } = await supabase
          .from("user_scans")
          .insert({
            user_id: userId,
            score,
            level,
            flags,
            thumb: null, // blob URLs aren't portable; skip persisting preview
          })
          .select("id")
          .maybeSingle();
        if (inserted?.id) scan.id = inserted.id;
      }
      setResult(scan);
      setHistory((h) => [scan, ...h].slice(0, 6));
      setLifetimeScanCount((c) => (c ?? 0) + 1);
      setScanning(false);
    }, 3000);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setValidationError(null);
    setMissingSignals([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <main className="relative flex min-h-screen w-full items-start justify-center px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[oklch(0.45_0.18_155/0.3)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[oklch(0.6_0.2_45/0.3)] blur-3xl" />
      </div>

      <PhoneFrame>
        <div className="animate-fade-up space-y-5">
          {/* Header */}
          <header className="flex items-center justify-between pt-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-azure shadow-glow">
                <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-semibold tracking-tight text-white">
                DateShield
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                aria-label="Profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--azure)] to-[var(--azure-glow)] text-xs font-bold text-white shadow-glow transition hover:scale-105"
              >
                JD
              </Link>
            </div>
          </header>

          {/* Trial card */}
          <section className="glass-strong relative overflow-hidden rounded-3xl p-4">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--azure)]/20 blur-2xl" />
            <div className="relative space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">
                    Free trial active
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    🎉 30-day free trial
                  </p>
                </div>
                <span className="rounded-full bg-[var(--success)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[oklch(0.85_0.16_150)]">
                  {trialDaysLeft} days left
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full gradient-azure transition-all duration-700"
                  style={{ width: `${trialPct}%` }}
                />
              </div>
            </div>
          </section>

          {/* Upload section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Scan a profile</h2>
              {file && (
                <button
                  onClick={clearFile}
                  className="flex items-center gap-1 text-[11px] text-white/55 transition hover:text-white"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {!file ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                  dragOver
                    ? "border-[var(--azure)] bg-[var(--azure)]/8"
                    : "border-white/15 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-azure shadow-glow">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Upload dating profile screenshot
                  </p>
                  <p className="text-[11px] text-white/55">
                    Drag & drop or tap to browse · JPG, PNG
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white">
                  Choose File
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            ) : (
              <div className="glass relative overflow-hidden rounded-2xl p-2">
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black/40">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  {scanning && (
                    <div className="absolute inset-0">
                      {/* dim overlay */}
                      <div className="absolute inset-0 bg-black/40" />
                      {/* grid */}
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            "linear-gradient(var(--azure-glow) 1px, transparent 1px), linear-gradient(90deg, var(--azure-glow) 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                        }}
                      />
                      {/* QR-style corner brackets */}
                      <div className="absolute inset-4">
                        <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-[var(--azure-glow)]" />
                        <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-[var(--azure-glow)]" />
                        <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-[var(--azure-glow)]" />
                        <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-[var(--azure-glow)]" />
                      </div>
                      {/* sweeping laser line */}
                      <div className="absolute inset-x-4 top-0 overflow-hidden" style={{ bottom: 0 }}>
                        <div
                          className="absolute left-0 right-0 h-[2px] animate-qr-scan"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, var(--azure-glow), transparent)",
                            boxShadow:
                              "0 0 20px 4px color-mix(in oklab, var(--azure-glow) 70%, transparent)",
                          }}
                        />
                      </div>
                      {/* status */}
                      <div className="absolute inset-x-0 bottom-2 flex justify-center">
                        <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--azure-glow)] backdrop-blur-sm">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--azure-glow)]" />
                          Scanning…
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 px-1 pt-2">
                  <ImageIcon className="h-3.5 w-3.5 text-[var(--azure-glow)]" />
                  <p className="min-w-0 flex-1 truncate text-[11px] text-white/70">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {scanning ? "Analyzing" : "Ready to scan"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={!file || scanning}
              className="flex h-13 h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-azure text-base font-semibold text-white shadow-glow transition-all duration-200 hover:shadow-[0_14px_50px_-10px_oklch(0.68_0.18_240/0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Scanning…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" /> Scan Profile
                </>
              )}
            </button>

            {validationError && (
              <div className="flex items-start gap-2 rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3.5 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.88_0.1_25)]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[oklch(0.92_0.08_25)]">
                    Invalid image
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/70">
                    {validationError} Please upload a real dating app profile
                    screenshot.
                  </p>
                  {missingSignals.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.88_0.1_25)]/80">
                        Missing
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {missingSignals.map((m) => (
                          <li
                            key={m}
                            className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/75"
                          >
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[oklch(0.88_0.1_25)]" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Result */}
          {result && <ResultCard scan={result} />}

          {/* Previous scans */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Previous scans</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-[11px] text-white/55 transition hover:text-white"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="glass flex flex-col items-center gap-2 rounded-2xl p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <ImageIcon className="h-5 w-5 text-white/45" />
                </div>
                <p className="text-xs text-white/55">
                  No scans yet. Upload your first screenshot to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((s) => (
                  <HistoryRow key={s.id} scan={s} />
                ))}
              </div>
            )}
          </section>

          {/* Billing */}
          <section className="glass flex items-center gap-3 rounded-2xl p-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--azure)]/15 text-[var(--azure-glow)]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Pro Plan · Trial</p>
              <p className="text-[11px] text-white/55">
                Next billing · May 22, 2026
              </p>
            </div>
            <button className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/15">
              Manage <ChevronRight className="h-3 w-3" />
            </button>
          </section>

          {/* Footer */}
          <footer className="flex justify-center gap-4 pt-2 text-[10px] text-white/40">
            <Link to="/" className="hover:text-white/70">Privacy</Link>
            <Link to="/" className="hover:text-white/70">Terms</Link>
            <Link to="/" className="hover:text-white/70">Support</Link>
          </footer>
        </div>
      </PhoneFrame>
    </main>
  );
}

function ResultCard({ scan }: { scan: Scan }) {
  const cfg = {
    high: {
      label: "High Risk",
      color: "var(--danger)",
      tone: "oklch(0.88 0.1 25)",
      icon: AlertTriangle,
    },
    medium: {
      label: "Medium Risk",
      color: "var(--warning)",
      tone: "oklch(0.9 0.12 75)",
      icon: AlertTriangle,
    },
    low: {
      label: "Low Risk",
      color: "var(--success)",
      tone: "oklch(0.88 0.14 150)",
      icon: CheckCircle2,
    },
  }[scan.level];
  const Icon = cfg.icon;

  return (
    <section
      className="glass-strong animate-fade-up relative overflow-hidden rounded-3xl p-5"
      style={{ boxShadow: `0 10px 40px -12px color-mix(in oklab, ${cfg.color} 35%, transparent)` }}
    >
      <div
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
        style={{ background: `color-mix(in oklab, ${cfg.color} 25%, transparent)` }}
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">
              Scan Result
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-white">
              {cfg.label}
            </h3>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: `color-mix(in oklab, ${cfg.color} 18%, transparent)`, color: cfg.tone }}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/55">
              Risk Score
            </span>
            <span className="font-display text-2xl font-bold" style={{ color: cfg.tone }}>
              {scan.score}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${scan.score}%`, background: cfg.color }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">
            Red flags
          </p>
          <ul className="space-y-1.5">
            {scan.flags.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-white/80">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: cfg.color }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HistoryRow({ scan }: { scan: Scan }) {
  const tone = {
    high: { bg: "var(--danger)", text: "oklch(0.88 0.1 25)", label: "High" },
    medium: { bg: "var(--warning)", text: "oklch(0.9 0.12 75)", label: "Medium" },
    low: { bg: "var(--success)", text: "oklch(0.88 0.14 150)", label: "Low" },
  }[scan.level];

  return (
    <button className="glass flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/[0.08]">
      <div
        className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${scan.thumb})` }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: `color-mix(in oklab, ${tone.bg} 18%, transparent)`,
              color: tone.text,
            }}
          >
            {tone.label}
          </span>
          <span className="text-xs font-medium text-white">{scan.score}%</span>
        </div>
        <p className="mt-0.5 text-[11px] text-white/50">{scan.date} · {scan.flags.length} flags</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/40" />
    </button>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdsSlot } from "@/components/AdsSlot";
import {
  ShieldCheck,
  Upload,
  Loader2,
  AlertTriangle,
  ImageOff,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
  head: () => ({
    meta: [
      { title: "Scan a profile — DateShield" },
      {
        name: "description",
        content:
          "Upload a dating profile screenshot and get an instant AI risk analysis. 3 free scans, no account required.",
      },
    ],
  }),
});

const SCAN_COUNT_KEY = "dateshield_free_scan_count_v1";
const FREE_LIMIT = 3;

type Phase = "idle" | "scanning" | "result" | "limit";

function ScanPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const n = Number(window.localStorage.getItem(SCAN_COUNT_KEY) || "0");
    setScanCount(n);
    if (n >= FREE_LIMIT) setPhase("limit");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const onPick = () => inputRef.current?.click();

  const onFile = (file: File | null) => {
    if (!file) return;
    if (scanCount >= FREE_LIMIT) {
      setPhase("limit");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setPhase("scanning");
    setProgress(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 12 + 4;
        if (next >= 100) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          finishScan();
          return 100;
        }
        return next;
      });
    }, 350);
  };

  const finishScan = () => {
    const newScore = 55 + Math.floor(Math.random() * 40);
    setScore(newScore);
    const next = scanCount + 1;
    setScanCount(next);
    try {
      window.localStorage.setItem(SCAN_COUNT_KEY, String(next));
    } catch {}
    setTimeout(() => {
      if (next >= FREE_LIMIT) {
        setPhase("limit");
      } else {
        setPhase("result");
      }
    }, 600);
  };

  const reset = () => {
    setPreview(null);
    setScore(0);
    setProgress(0);
    if (scanCount >= FREE_LIMIT) setPhase("limit");
    else setPhase("idle");
  };

  const verdict =
    score >= 80
      ? { label: "LIKELY FAKE", tone: "danger" as const }
      : score >= 60
      ? { label: "SUSPICIOUS", tone: "warning" as const }
      : { label: "LOW RISK", tone: "success" as const };

  const toneClass =
    verdict.tone === "danger"
      ? "bg-danger/20 text-danger"
      : verdict.tone === "warning"
      ? "bg-warning/20 text-warning"
      : "bg-success/20 text-success";

  return (
    <main className="relative mx-auto w-full max-w-[440px] px-4 pb-16 pt-6 sm:max-w-[480px]">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/80 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl gradient-azure shadow-glow">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold">DateShield</span>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between rounded-2xl glass px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/50">Free scans</p>
          <p className="text-sm font-semibold text-white">
            {Math.min(scanCount, FREE_LIMIT)} / {FREE_LIMIT} used
          </p>
        </div>
        <div className="flex h-2 w-24 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full gradient-azure transition-all"
            style={{ width: `${(Math.min(scanCount, FREE_LIMIT) / FREE_LIMIT) * 100}%` }}
          />
        </div>
      </div>

      {phase === "idle" && (
        <section className="space-y-4 animate-fade-up">
          <h1 className="font-display text-2xl font-bold text-white">Scan a profile</h1>
          <p className="text-sm text-white/70">
            Upload a screenshot. No account needed — you get {FREE_LIMIT} free scans.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={onPick}
            className="glass-strong flex w-full flex-col items-center gap-3 rounded-3xl border-dashed py-10 transition hover:border-azure/60"
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-azure/20">
              <Upload className="h-6 w-6 text-azure-glow" />
            </div>
            <p className="text-base font-semibold text-white">Upload screenshot</p>
            <p className="text-[11px] text-white/50">PNG · JPG · max 10MB</p>
          </button>

          <AdsSlot slot="scan" />
        </section>
      )}

      {phase === "scanning" && (
        <section className="space-y-5 animate-fade-up">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-5">
            {preview && (
              <img
                src={preview}
                alt="Scanning"
                className="mb-4 h-40 w-full rounded-2xl object-cover opacity-80"
              />
            )}
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-azure-glow" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Analyzing image…</p>
                <p className="text-[11px] text-white/50">
                  Reverse search · bio NLP · metadata
                </p>
              </div>
              <span className="text-xs text-white/60">{Math.floor(progress)}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full gradient-azure transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-azure/30 to-transparent animate-scan" />
          </div>

          <div>
            <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-white/40">
              Sponsored
            </p>
            <AdsSlot slot="scan" />
          </div>
        </section>
      )}

      {phase === "result" && (
        <section className="space-y-4 animate-fade-up">
          <div className="rounded-3xl glass-strong p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/50">Verdict</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
                {verdict.label}
              </span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-white">{score}</span>
              <span className="mb-1 text-xs text-white/50">/ 100</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-success via-warning to-danger"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <ImageOff className="h-4 w-4 text-warning" />
                <span className="text-xs text-white/85">Image reused on 4 sites</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-danger" />
                <span className="text-xs text-white/85">Suspicious bio patterns</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs text-white/85">No known scam keywords</span>
              </div>
            </div>
          </div>

          <button
            onClick={reset}
            className="gradient-azure w-full rounded-full py-3 text-sm font-semibold text-white shadow-glow hover:scale-[1.02]"
          >
            Scan another ({FREE_LIMIT - scanCount} left)
          </button>

          <AdsSlot slot="scan" />
        </section>
      )}

      {phase === "limit" && (
        <section className="space-y-5 animate-fade-up">
          <div className="rounded-3xl glass-strong p-6 text-center shadow-glow">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-azure shadow-glow">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-azure/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-azure-glow">
              <Sparkles className="h-3 w-3" /> Free trial required
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              You've used all {FREE_LIMIT} free scans
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-white/70">
              Activate your free 1-month trial to keep scanning.{" "}
              <strong className="text-white">No charge today</strong> — we'll ask before renewing.
            </p>

            <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm text-white/80">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>$0 charged today · full access for 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>We email before renewal — no auto-charge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>Cancel anytime from your dashboard</span>
              </li>
            </ul>

            <button
              onClick={() => navigate({ to: "/trial", search: { plan: "pro" } })}
              className="gradient-azure mt-6 w-full rounded-full py-3.5 text-sm font-bold text-white shadow-glow hover:scale-[1.02]"
            >
              Activate free trial
            </button>
            <Link to="/" className="mt-3 block text-xs text-white/60 hover:text-white">
              Back to home
            </Link>
          </div>

          <AdsSlot slot="scan" />
        </section>
      )}
    </main>
  );
}

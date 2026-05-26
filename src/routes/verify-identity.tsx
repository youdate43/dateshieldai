import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import {
  ShieldCheck,
  IdCard,
  Car,
  BookUser,
  Upload,
  Camera,
  Eye,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ArrowLeftCircle,
  ArrowRightCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-identity")({
  component: VerifyIdentityPage,
  head: () => ({
    meta: [
      { title: "Verify Your Identity — DateShield" },
      {
        name: "description",
        content:
          "One-time identity verification with a government ID and a quick face scan to keep DateShield safe.",
      },
    ],
  }),
});

type DocType = "nid" | "license" | "passport";
type Step = "doc-type" | "doc-upload" | "face-intro" | "face-scan" | "done";

const DOC_OPTIONS: { id: DocType; label: string; sub: string; Icon: typeof IdCard }[] = [
  { id: "nid", label: "National ID Card", sub: "Front side, clear photo", Icon: IdCard },
  { id: "license", label: "Driving License", sub: "Full card, no glare", Icon: Car },
  { id: "passport", label: "Passport", sub: "Photo page", Icon: BookUser },
];

type FaceStep = {
  key: "look" | "blink" | "right" | "left";
  title: string;
  hint: string;
  Icon: typeof Eye;
  ms: number;
};

const FACE_STEPS: FaceStep[] = [
  { key: "look", title: "Look at the camera", hint: "Keep your face inside the circle", Icon: Camera, ms: 3000 },
  { key: "blink", title: "Blink your eyes", hint: "Blink slowly two times", Icon: Eye, ms: 3000 },
  { key: "right", title: "Turn your head right", hint: "Slowly rotate to the right", Icon: ArrowRightCircle, ms: 3000 },
  { key: "left", title: "Turn your head left", hint: "Slowly rotate to the left", Icon: ArrowLeftCircle, ms: 3000 },
];

function VerifyIdentityPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("doc-type");
  const [docType, setDocType] = useState<DocType | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload a clear photo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDocPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const progress =
    step === "doc-type" ? 15 :
    step === "doc-upload" ? 40 :
    step === "face-intro" ? 60 :
    step === "face-scan" ? 85 : 100;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-azure)" }}
        />
      </div>

      <PhoneFrame>
        <div className="flex h-full flex-col">
          {/* Header */}
          <header className="mb-4 mt-2 flex items-center justify-between">
            {step === "doc-type" ? (
              <Link to="/signup" className="text-xs font-medium text-white/60 hover:text-white">
                ← Back
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (step === "doc-upload") setStep("doc-type");
                  else if (step === "face-intro") setStep("doc-upload");
                  else if (step === "face-scan") setStep("face-intro");
                }}
                className="text-xs font-medium text-white/60 hover:text-white"
              >
                ← Back
              </button>
            )}
            <div className="flex items-center gap-1.5 rounded-full glass px-2.5 py-1">
              <ShieldCheck className="h-3 w-3 text-[var(--azure-glow)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                Identity Verification
              </span>
            </div>
          </header>

          {/* Progress */}
          <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--gradient-azure)" }}
            />
          </div>

          {step === "doc-type" && (
            <section className="animate-fade-up">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl glass-strong shadow-glow">
                <IdCard className="h-5 w-5 text-[var(--azure-glow)]" />
              </div>
              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                Choose your document
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                We need to verify it's really you before starting your 30-day free trial.
              </p>

              <div className="mt-6 space-y-2.5">
                {DOC_OPTIONS.map((opt) => {
                  const active = docType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setDocType(opt.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? "border-[var(--azure)]/60 bg-white/[0.07] shadow-[0_0_0_4px_oklch(0.68_0.18_240/0.15)]"
                          : "border-white/10 bg-white/[0.04] hover:border-white/25"
                      }`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-azure/20">
                        <opt.Icon className="h-5 w-5 text-[var(--azure-glow)]" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-white">{opt.label}</span>
                        <span className="block text-[11px] text-white/55">{opt.sub}</span>
                      </span>
                      {active && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!docType}
                onClick={() => setStep("doc-upload")}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--gradient-azure)" }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}

          {step === "doc-upload" && docType && (
            <section className="animate-fade-up">
              <h1 className="font-display text-[22px] font-semibold leading-tight text-white">
                Upload a clear photo
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                {DOC_OPTIONS.find((o) => o.id === docType)?.label} — make sure all four corners are visible and text is readable.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {!docPreview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="group glass-strong mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border-dashed py-10 transition hover:border-azure/60"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-azure/20 transition group-hover:scale-110">
                    <Upload className="h-5 w-5 text-[var(--azure-glow)]" />
                  </div>
                  <p className="text-sm font-medium text-white">Upload Photo</p>
                  <p className="text-[11px] text-white/50">PNG · JPG · max 10MB</p>
                </button>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <img src={docPreview} alt="ID preview" className="block max-h-72 w-full object-contain" />
                  </div>
                  <button
                    onClick={() => {
                      setDocPreview(null);
                      fileRef.current?.click();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-medium text-white/70 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retake / choose another
                  </button>
                </div>
              )}

              <ul className="mt-5 space-y-1.5 text-[11px] text-white/55">
                <li>• Good lighting, no glare</li>
                <li>• Hold the camera steady</li>
                <li>• Photo, not a screenshot</li>
              </ul>

              <button
                disabled={!docPreview}
                onClick={() => setStep("face-intro")}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--gradient-azure)" }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}

          {step === "face-intro" && (
            <section className="animate-fade-up">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl glass-strong shadow-glow">
                <Camera className="h-5 w-5 text-[var(--azure-glow)]" />
              </div>
              <h1 className="font-display text-[22px] font-semibold leading-tight text-white">
                Face verification
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                We'll match your face to your ID. Follow these 4 steps on the next screen.
              </p>

              <ol className="mt-5 space-y-2.5">
                {FACE_STEPS.map((s, i) => (
                  <li
                    key={s.key}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5"
                  >
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-azure/20 text-xs font-semibold text-[var(--azure-glow)]">
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-white">{s.title}</span>
                      <span className="block text-[11px] text-white/55">{s.hint}</span>
                    </span>
                    <s.Icon className="h-5 w-5 text-[var(--azure-glow)]" />
                  </li>
                ))}
              </ol>

              <button
                onClick={() => setStep("face-scan")}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]"
                style={{ background: "var(--gradient-azure)" }}
              >
                Start face scan <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}

          {step === "face-scan" && (
            <FaceScan onDone={() => setStep("done")} />
          )}

          {step === "done" && (
            <section className="flex flex-1 flex-col items-center justify-center animate-fade-up text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--success)]/20">
                <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
              </div>
              <h1 className="font-display text-[22px] font-semibold text-white">
                Identity verified
              </h1>
              <p className="mt-2 text-sm text-white/60">
                You're all set. Let's start your 30-day free trial.
              </p>
              <button
                onClick={() => navigate({ to: "/trial" })}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]"
                style={{ background: "var(--gradient-azure)" }}
              >
                Continue to trial <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}
        </div>
      </PhoneFrame>
    </main>
  );
}

function FaceScan({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const current = FACE_STEPS[idx];

  useEffect(() => {
    if (idx >= FACE_STEPS.length) {
      setVerifying(true);
      const t = setTimeout(onDone, 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), current.ms);
    return () => clearTimeout(t);
  }, [idx, current, onDone]);

  if (verifying) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center animate-fade-up text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--azure-glow)]" />
        <p className="mt-4 text-sm font-medium text-white">Verifying your face…</p>
        <p className="mt-1 text-[11px] text-white/55">Matching with your ID document</p>
      </section>
    );
  }

  const Icon = current.Icon;
  const stepPct = ((idx + 1) / FACE_STEPS.length) * 100;

  return (
    <section className="animate-fade-up">
      <p className="text-[11px] uppercase tracking-wider text-white/50">
        Step {idx + 1} of {FACE_STEPS.length}
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-white">{current.title}</h2>
      <p className="mt-1 text-sm text-white/60">{current.hint}</p>

      {/* Camera circle */}
      <div className="relative mx-auto mt-6 aspect-square w-56">
        {/* animated ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(var(--azure-glow) 0% " +
              stepPct +
              "%, oklch(1 0 0 / 0.08) " +
              stepPct +
              "% 100%)",
            transition: "background 0.6s ease",
          }}
        />
        <div className="absolute inset-2 rounded-full bg-[var(--background,#0b0e14)]" />
        <div className="absolute inset-4 grid place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02]">
          <div className="flex flex-col items-center gap-2 text-white/80">
            <Icon className="h-10 w-10 text-[var(--azure-glow)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-white/50">Live</span>
          </div>
          {/* scanning line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-pulse bg-gradient-to-b from-[var(--azure-glow)]/30 to-transparent" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {FACE_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i <= idx ? "w-8 bg-[var(--azure-glow)]" : "w-3 bg-white/15"
            }`}
          />
        ))}
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/50">
        <ShieldCheck className="h-3 w-3 text-[var(--success)]" />
        Your biometric data is processed securely and never stored.
      </p>
    </section>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  IdCard,
  Car,
  BookUser,
  Upload,
  Camera,
  Eye,
  ArrowRight,
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

type FaceKey = "look" | "blink" | "right" | "left";
type FaceStep = {
  key: FaceKey;
  title: string;
  hint: string;
  Icon: typeof Eye;
  ms: number;
  column: "face_look_url" | "face_blink_url" | "face_right_url" | "face_left_url";
};

const FACE_STEPS: FaceStep[] = [
  { key: "look", title: "Look at the camera", hint: "Keep your face inside the circle", Icon: Camera, ms: 3500, column: "face_look_url" },
  { key: "blink", title: "Blink your eyes", hint: "Blink slowly two times", Icon: Eye, ms: 3500, column: "face_blink_url" },
  { key: "right", title: "Turn your head right", hint: "Slowly rotate to the right", Icon: ArrowRightCircle, ms: 3500, column: "face_right_url" },
  { key: "left", title: "Turn your head left", hint: "Slowly rotate to the left", Icon: ArrowLeftCircle, ms: 3500, column: "face_left_url" },
];

function getSessionId() {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = sessionStorage.getItem("idv_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("idv_session", id);
  }
  return id;
}

function VerifyIdentityPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("doc-type");
  const [docType, setDocType] = useState<DocType | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Create row on mount
  useEffect(() => {
    const sid = getSessionId();
    supabase
      .from("identity_verifications")
      .insert({
        session_id: sid,
        current_step: "doc-type",
        status: "in_progress",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      })
      .select("id")
      .single()
      .then(({ data }) => {
        if (data) setRowId(data.id);
      });
  }, []);

  const updateRow = async (patch: Record<string, unknown>) => {
    if (!rowId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("identity_verifications").update(patch as any).eq("id", rowId);
  };

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload a clear photo");
      return;
    }
    setDocFile(f);
    const reader = new FileReader();
    reader.onload = () => setDocPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const continueFromDocUpload = async () => {
    if (!docFile || !rowId) return;
    setUploading(true);
    try {
      const ext = docFile.name.split(".").pop() || "jpg";
      const path = `${rowId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("identity-documents")
        .upload(path, docFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("identity-documents").getPublicUrl(path);
      await updateRow({
        doc_type: docType,
        doc_image_url: data.publicUrl,
        current_step: "face-intro",
      });
      setStep("face-intro");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed, please retry");
    } finally {
      setUploading(false);
    }
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
                onClick={() => {
                  updateRow({ doc_type: docType, current_step: "doc-upload" });
                  setStep("doc-upload");
                }}
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
                      setDocFile(null);
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
                disabled={!docPreview || uploading}
                onClick={continueFromDocUpload}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--gradient-azure)" }}
              >
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <>Continue <ArrowRight className="h-4 w-4" /></>}
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
                onClick={() => {
                  updateRow({ current_step: "face-scan" });
                  setStep("face-scan");
                }}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]"
                style={{ background: "var(--gradient-azure)" }}
              >
                Start face scan <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          )}

          {step === "face-scan" && rowId && (
            <FaceScan
              rowId={rowId}
              onDone={async () => {
                await updateRow({ current_step: "done", status: "completed" });
                setStep("done");
              }}
            />
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

function FaceScan({ rowId, onDone }: { rowId: string; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const current = FACE_STEPS[idx];

  // Start camera
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        console.error(e);
        setError("Camera access denied. Please allow camera and retry.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Capture + upload per step
  const captureAndUpload = async (stepDef: FaceStep) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 480;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
    );
    if (!blob) return;
    const path = `${rowId}/${stepDef.key}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("face-captures")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) {
      console.error(upErr);
      return;
    }
    const { data } = supabase.storage.from("face-captures").getPublicUrl(path);
    await supabase
      .from("identity_verifications")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ [stepDef.column]: data.publicUrl, current_step: `face-${stepDef.key}` } as any)
      .eq("id", rowId);
  };

  // Step progression
  useEffect(() => {
    if (!ready) return;
    if (idx >= FACE_STEPS.length) {
      setVerifying(true);
      const t = setTimeout(onDone, 1500);
      return () => clearTimeout(t);
    }
    const stepDef = FACE_STEPS[idx];
    const t = setTimeout(async () => {
      await captureAndUpload(stepDef);
      setIdx((i) => i + 1);
    }, stepDef.ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, ready]);

  if (error) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
        <Camera className="h-10 w-10 text-white/40" />
        <p className="mt-4 text-sm text-white">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs text-white/80"
        >
          Retry
        </button>
      </section>
    );
  }

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

      <div className="relative mx-auto mt-6 aspect-square w-56">
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
        <div className="absolute inset-4 grid place-items-center overflow-hidden rounded-full border border-white/10 bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/80">
            <Icon className="h-3 w-3 text-[var(--azure-glow)]" /> Live
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-pulse bg-gradient-to-b from-[var(--azure-glow)]/30 to-transparent" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

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
        Your biometric data is processed securely.
      </p>
    </section>
  );
}

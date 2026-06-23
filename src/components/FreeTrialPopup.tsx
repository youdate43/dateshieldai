import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, X, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "dateshield_free_trial_popup_seen_v1";

export function FreeTrialPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const t = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 px-4 pb-6 pt-10 backdrop-blur-sm sm:items-center sm:p-6 animate-fade-up"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-azure/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-azure-glow">
          <Sparkles className="h-3 w-3" /> Free 1-month trial
        </div>

        <h2 className="font-display text-2xl font-bold leading-tight text-white">
          Start your free month of DateShield — no charge today.
        </h2>

        <ul className="mt-5 space-y-3 text-sm text-white/80">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              <strong className="text-white">$0 charged today.</strong> Full access for 30 days, completely free.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              <strong className="text-white">We ask before we renew.</strong> After 1 month we'll send a confirmation —
              no payment is taken without your approval.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              <strong className="text-white">Cancel any time</strong> from your dashboard — zero hidden fees.
            </span>
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/trial"
            search={{ plan: "pro" }}
            onClick={close}
            className="gradient-azure flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02]"
          >
            <ShieldCheck className="h-4 w-4" /> Start free trial
          </Link>
          <button
            onClick={close}
            className="rounded-full px-5 py-2 text-xs text-white/60 hover:text-white"
          >
            Maybe later
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-white/40">
          No card charged today. We'll email you before the trial ends and only renew after you confirm.
        </p>
      </div>
    </div>
  );
}

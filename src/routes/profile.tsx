import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — DateShield" },
      {
        name: "description",
        content: "Manage your DateShield account, subscription, and preferences.",
      },
    ],
  }),
});

function ProfilePage() {
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
            <Link
              to="/dashboard"
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full glass text-white/70 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="font-display text-base font-semibold tracking-tight text-white">
              Profile
            </span>
            <div className="h-9 w-9" />
          </header>

          {/* Avatar + identity */}
          <section className="glass-strong flex flex-col items-center gap-3 rounded-3xl p-5 text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--azure)] to-[var(--azure-glow)] text-2xl font-bold text-white shadow-glow">
                JD
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)] ring-2 ring-black">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">
                Jordan Davis
              </p>
              <p className="text-[11px] text-white/55">Verified member · Pro Trial</p>
            </div>
            <span className="rounded-full bg-[var(--azure)]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--azure-glow)]">
              <Shield className="mr-1 inline h-3 w-3" /> Protected
            </span>
          </section>

          {/* Personal info */}
          <section className="space-y-2">
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Personal info
            </h2>
            <div className="glass space-y-0 divide-y divide-white/5 rounded-2xl">
              <InfoRow icon={Mail} label="Email" value="jordan.davis@email.com" />
              <InfoRow icon={Phone} label="Phone" value="+1 (555) 213-4498" />
              <InfoRow icon={MapPin} label="Location" value="Brooklyn, NY" />
              <InfoRow icon={Calendar} label="Member since" value="May 2026" />
            </div>
          </section>

          {/* Account */}
          <section className="space-y-2">
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Account
            </h2>
            <div className="glass space-y-0 divide-y divide-white/5 rounded-2xl">
              <ActionRow icon={CreditCard} label="Billing & subscription" />
              <ActionRow icon={Bell} label="Notifications" />
              <ActionRow icon={Lock} label="Privacy & security" />
            </div>
          </section>

          {/* Sign out */}
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm font-medium text-[oklch(0.92_0.08_25)] transition hover:bg-[var(--danger)]/15">
            <LogOut className="h-4 w-4" /> Sign out
          </button>

          <footer className="flex justify-center gap-4 pt-2 text-[10px] text-white/40">
            <Link to="/" className="hover:text-white/70">Privacy</Link>
            <Link to="/" className="hover:text-white/70">Terms</Link>
          </footer>
        </div>
      </PhoneFrame>
    </main>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--azure)]/15 text-[var(--azure-glow)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
        <p className="truncate text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
}: {
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/70">
        <Icon className="h-4 w-4" />
      </div>
      <p className="flex-1 text-sm text-white">{label}</p>
      <ChevronRight className="h-4 w-4 text-white/40" />
    </button>
  );
}
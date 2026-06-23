import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, LogOut, ShieldAlert, UserPlus, Trash2 } from "lucide-react";

type Status = "loading" | "signed-out" | "not-admin" | "admin";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      const user = userData.user;
      if (!user) {
        setStatus("signed-out");
        setEmail(null);
        setUserId(null);
        return;
      }
      setEmail(user.email ?? null);
      setUserId(user.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      setStatus(roles ? "admin" : "not-admin");
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </main>
    );
  }

  if (status === "signed-out") return <SignIn />;

  if (status === "not-admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({email}) does not have admin permission. Ask an existing admin to grant you access.
          </p>
          <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
            User ID: {userId}
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <AdminTopbar email={email} />
      {children}
      <AdminManageAccess />
    </>
  );
}

function AdminTopbar({ email }: { email: string | null }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 text-xs backdrop-blur">
      <span className="text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{email}</span>
      </span>
      <button
        onClick={() => supabase.auth.signOut()}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Admin sign in</h1>
            <p className="text-xs text-muted-foreground">Authorized accounts only</p>
          </div>
        </div>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        {err && <p className="mb-3 text-xs text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

type AdminRow = { id: string; user_id: string; created_at: string };

function AdminManageAccess() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("id,user_id,created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (data) setRows(data as AdminRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const id = newUserId.trim();
    if (!id) {
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: id, role: "admin" });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setNewUserId("");
    setMsg("Admin granted.");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Revoke admin access?")) return;
    await supabase.from("user_roles").delete().eq("id", id);
    load();
  };

  return (
    <section className="mx-auto mt-10 max-w-7xl px-4 pb-12 md:px-8">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <UserPlus className="h-5 w-5 text-primary" /> Admin Access
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Only users listed here can open the admin panel. Paste the User ID of an existing signed-up user to grant access.
        </p>
        <form onSubmit={add} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="User ID (UUID) of the user to promote"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Granting…" : "Grant admin"}
          </button>
        </form>
        {msg && <p className="mb-3 text-xs text-muted-foreground">{msg}</p>}
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-mono text-xs text-foreground">{r.user_id}</span>
              <button
                onClick={() => remove(r.id)}
                className="rounded-md p-1.5 text-destructive transition hover:bg-destructive/10"
                title="Revoke"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-2 text-xs text-muted-foreground">No admins yet.</li>
          )}
        </ul>
      </div>
    </section>
  );
}

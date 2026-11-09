"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!response.ok) { await supabase.auth.signOut(); throw new Error("This account is not authorized for the BandhanNama dashboard."); }
      router.replace("/admin"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return <main className="admin-login-wrap"><section className="admin-login-card">
    <div className="admin-mark">✦</div><p className="eyebrow">PRIVATE CONTROL ROOM</p>
    <h1>Welcome back.</h1><p className="admin-muted">Sign in to manage the BandhanNama experience.</p>
    <form onSubmit={submit} className="admin-form">
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="admin-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
    </form><p className="admin-footnote">Access is restricted to accounts explicitly added to the admin directory.</p>
    <a className="admin-back" href="/">← Return to the celebration</a>
  </section></main>;
}

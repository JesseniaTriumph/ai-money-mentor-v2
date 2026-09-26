"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import CharlotteLogo from "./Logo";

const C = { forest: "#1a5c35", forestDeep: "#0e3d22", gold: "#c9a94e", goldLight: "#e8c97a", sageMid: "#c8d9a8", white: "#fafdf5", cardBg: "#f0f7e6", border: "#d5e8c0", text: "#0e2d1a", textLight: "#3a6b4a", textMuted: "#6b9a7a", red: "#c0392b" };

const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "#f5faf0", border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 14, fontFamily: "DM Sans, sans-serif", color: C.text, outline: "none", boxSizing: "border-box" };

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string, name: string, email: string) => void }) {
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) setError(error.message);
      else setMessage("✅ Magic link sent! Check your email and click the link to sign in.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.user) { onSuccess(data.user.id, name || email.split("@")[0], data.user.email ?? email); onClose(); }
      else setMessage("Check your email to confirm your account.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      const displayName = data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "there";
      onSuccess(data.user?.id ?? "", displayName, data.user?.email ?? email);
      onClose();
    }
    setLoading(false);
  }

  return (
    /* Overlay */
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.white, borderRadius: 20, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            <CharlotteLogo size={32} showText={true} dark={false} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.forestDeep, marginTop: 10 }}>
            {mode === "signup" ? "Create your account" : mode === "magic" ? "Sign in with email link" : "Welcome back"}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Save your progress and goals across devices</div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", background: C.cardBg, borderRadius: 11, padding: 3, marginBottom: 20 }}>
          {[["signin", "Sign In"], ["signup", "Sign Up"], ["magic", "Magic Link"]] .map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m as typeof mode); setError(""); setMessage(""); }}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: "none", fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", background: mode === m ? C.forest : "transparent", color: mode === m ? "white" : C.textMuted, transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          {mode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name" style={inputStyle} />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required style={inputStyle} />
          {mode !== "magic" && (
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)" required minLength={6} style={inputStyle} />
          )}

          {error && <div style={{ background: "#fff0f0", border: "1px solid #f0c0c0", borderRadius: 9, padding: "10px 12px", fontSize: 13, color: C.red }}>{error}</div>}
          {message && <div style={{ background: "#f0f7e6", border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px", fontSize: 13, color: C.forest }}>{message}</div>}

          <button type="submit" disabled={loading}
            style={{ padding: "13px", background: loading ? C.sageMid : C.forest, color: "white", border: "none", borderRadius: 12, fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", transition: "background 0.2s" }}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : mode === "magic" ? "Send Magic Link" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          By signing in you agree this is an <strong>educational tool only</strong> — not professional financial advice.
        </div>

        <button onClick={onClose} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 13 }}>
          Continue without signing in →
        </button>
      </div>
    </div>
  );
}

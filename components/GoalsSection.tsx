"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

const C = {
  forest: "#1a5c35", forestDeep: "#0e3d22", forestMid: "#2d7a4a",
  gold: "#c9a94e", goldLight: "#e8c97a", sageMid: "#c8d9a8",
  white: "#fafdf5", cardBg: "#f0f7e6", border: "#d5e8c0",
  text: "#0e2d1a", textLight: "#3a6b4a", textMuted: "#6b9a7a",
  red: "#c0392b",
};

export type GoalType = "house" | "vacation" | "wedding" | "baby" | "college" | "emergency" | "retirement" | "car" | "custom";

const GOAL_PRESETS: Record<GoalType, { icon: string; label: string; color: string; tip: string; suggestedMonths: number }> = {
  house:      { icon: "🏡", label: "Buying a Home",      color: "#1a5c35", tip: "Include down payment + 3-5% for closing costs + first month expenses.", suggestedMonths: 36 },
  vacation:   { icon: "✈️", label: "Vacation / Travel",  color: "#1a56a0", tip: "Use a dedicated savings bucket. Travel costs 40% less when booked 6+ weeks ahead.", suggestedMonths: 12 },
  wedding:    { icon: "💍", label: "Wedding",            color: "#7b2fbe", tip: "Average US wedding: $35K. Off-peak dates and micro-weddings can cut costs by $15K+.", suggestedMonths: 24 },
  baby:       { icon: "👶", label: "Baby / Newborn",     color: "#2d7a4a", tip: "First year avg: $12-15K. Buy clothes & gear secondhand — never buy used car seats.", suggestedMonths: 9 },
  college:    { icon: "🎓", label: "College / 529",      color: "#c9a94e", tip: "Open a 529 plan — tax-free growth. Even $25/month from birth grows to $12K+ by 18.", suggestedMonths: 120 },
  emergency:  { icon: "🛡️", label: "Emergency Fund",    color: "#c0392b", tip: "Start with $1,000. Then build to 3-6 months of essential expenses in a HYSA.", suggestedMonths: 6 },
  retirement: { icon: "🎯", label: "Retirement",         color: "#0e3d22", tip: "Maximize 401(k) match first — it's free money. Then Roth IRA up to $7K/year.", suggestedMonths: 240 },
  car:        { icon: "🚗", label: "Car / Vehicle",      color: "#5a9a6a", tip: "Save for a used car in cash if possible — avoids interest. Credit union loans beat dealerships.", suggestedMonths: 18 },
  custom:     { icon: "🎯", label: "Custom Goal",        color: "#1a5c35", tip: "Set your own goal. Name it, set a target, and let Charlotte help you get there.", suggestedMonths: 12 },
};

type Goal = {
  id?: string;
  title: string;
  goal_type: GoalType;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string;
  notes: string;
};

function monthsUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ── Google Calendar deep-link generator ── */
function googleCalendarUrl(goal: Goal): string {
  if (!goal.target_date) return "";
  const date = goal.target_date.replace(/-/g, "");
  const title = encodeURIComponent(`🎯 Goal Deadline: ${goal.title}`);
  const details = encodeURIComponent(
    `Target: ${formatCurrency(goal.target_amount)}\nCurrent: ${formatCurrency(goal.current_amount)}\nMonthly contribution: ${formatCurrency(goal.monthly_contribution)}\n\nTracked in AI Money Mentor — ai-money-mentor-v2.vercel.app`
  );
  return `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${date}/${date}&details=${details}&sf=true`;
}

/* ── iCal file builder (works with Apple Calendar, Outlook, any calendar) ── */
function downloadIcal(goal: Goal) {
  if (!goal.target_date) return;
  const date = goal.target_date.replace(/-/g, "");
  const uid = `aimm-goal-${Date.now()}@ai-money-mentor`;
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Money Mentor//Goal Reminder//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${date}`,
    `SUMMARY:🎯 Goal Deadline: ${goal.title}`,
    `DESCRIPTION:Target: ${formatCurrency(goal.target_amount)}\\nMonthly: ${formatCurrency(goal.monthly_contribution)}\\nTracked in AI Money Mentor`,
    "BEGIN:VALARM",
    "TRIGGER:-P30D",
    "ACTION:DISPLAY",
    `DESCRIPTION:30 days until your goal: ${goal.title}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:1 week until your goal: ${goal.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${goal.title.replace(/\s+/g, "-")}-goal.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── GOAL FORM ── */
function GoalForm({ onSave, onCancel }: { onSave: (g: Omit<Goal, "id">) => void; onCancel: () => void }) {
  const [type, setType] = useState<GoalType>("emergency");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [monthly, setMonthly] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const preset = GOAL_PRESETS[type];

  const autoMonthly = target && date
    ? Math.max(0, (parseFloat(target) - parseFloat(current || "0")) / monthsUntil(date)).toFixed(0)
    : "";

  const autoDate = target && monthly && parseFloat(monthly) > 0
    ? addMonths(Math.ceil((parseFloat(target) - parseFloat(current || "0")) / parseFloat(monthly)))
    : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const g: Omit<Goal, "id"> = {
      title: title || preset.label,
      goal_type: type,
      icon: preset.icon,
      color: preset.color,
      target_amount: parseFloat(target) || 0,
      current_amount: parseFloat(current) || 0,
      monthly_contribution: parseFloat(monthly || autoMonthly || "0"),
      target_date: date || autoDate,
      notes,
    };
    onSave(g);
  }

  return (
    <form onSubmit={submit} style={{ background: C.white, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.forestDeep, marginBottom: 14 }}>➕ New Savings Goal</div>

      {/* Goal type picker */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 14 }}>
        {(Object.entries(GOAL_PRESETS) as [GoalType, typeof preset][]).map(([key, p]) => (
          <button key={key} type="button" onClick={() => { setType(key); setTitle(""); }}
            style={{ padding: "8px 4px", borderRadius: 10, border: `2px solid ${type === key ? p.color : C.border}`, background: type === key ? `${p.color}18` : C.cardBg, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
            <div style={{ fontSize: 18 }}>{p.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: type === key ? p.color : C.textMuted, marginTop: 2, lineHeight: 1.2 }}>{p.label}</div>
          </button>
        ))}
      </div>

      {/* Charlotte tip for this goal type */}
      <div style={{ background: `${preset.color}12`, border: `1px solid ${preset.color}40`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.text, lineHeight: 1.5, marginBottom: 14 }}>
        💡 <strong>Charlotte's tip:</strong> {preset.tip}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`Goal name (e.g. "${preset.label}")`}
          style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Target Amount ($)</label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 10000" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Already Saved ($)</label>
            <input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Monthly Contribution ($) {autoMonthly && <span style={{ color: C.gold }}>→ auto: ${autoMonthly}</span>}</label>
            <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder={autoMonthly || "e.g. 200"} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Target Date {autoDate && <span style={{ color: C.gold }}>→ auto: {autoDate}</span>}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} style={inputStyle} />
          </div>
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional — e.g. 'Downtown 2BR condo')"
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button type="submit" style={{ flex: 1, background: C.forest, color: "white", border: "none", borderRadius: 11, padding: "12px", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Save Goal
        </button>
        <button type="button" onClick={onCancel} style={{ padding: "12px 18px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 11, fontFamily: "DM Sans, sans-serif", fontSize: 14, cursor: "pointer", color: C.textLight }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── GOAL CARD ── */
function GoalCard({ goal, onDeposit, onDelete }: { goal: Goal; onDeposit: (id: string, amount: number) => void; onDelete: (id: string) => void }) {
  const [depositInput, setDepositInput] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
  const remaining = goal.target_amount - goal.current_amount;
  const months = monthsUntil(goal.target_date);
  const preset = GOAL_PRESETS[goal.goal_type];
  const gcalUrl = googleCalendarUrl(goal);

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 12, borderLeft: `4px solid ${goal.color}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${goal.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{goal.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{goal.title}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{preset.label}</div>
          </div>
        </div>
        <button onClick={() => goal.id && onDelete(goal.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 17, padding: 4 }} title="Remove goal">✕</button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
          <span style={{ color: C.textLight }}>{formatCurrency(goal.current_amount)} saved</span>
          <span style={{ fontWeight: 700, color: goal.color }}>{pct}% — {formatCurrency(remaining)} to go</span>
        </div>
        <div style={{ height: 10, background: "#e8f0e0", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`, borderRadius: 5, transition: "width 0.8s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: C.textMuted }}>
          <span>Goal: {formatCurrency(goal.target_amount)}</span>
          {goal.target_date && <span>📅 {months} months left ({goal.target_date})</span>}
        </div>
      </div>

      {goal.monthly_contribution > 0 && (
        <div style={{ background: C.cardBg, borderRadius: 9, padding: "8px 12px", fontSize: 12, color: C.textLight, marginBottom: 10 }}>
          📆 Saving <strong style={{ color: C.forest }}>{formatCurrency(goal.monthly_contribution)}/month</strong>
          {months > 0 && ` → on track to reach goal in ${months} months`}
        </div>
      )}

      {/* Add to calendar buttons */}
      {goal.target_date && (
        <div style={{ display: "flex", gap: 7, marginBottom: 10, flexWrap: "wrap" }}>
          <a href={gcalUrl} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#eaf2ff", border: "1px solid #b8d4f0", borderRadius: 9, fontSize: 11, fontWeight: 600, color: "#1a56a0", textDecoration: "none", cursor: "pointer" }}>
            📅 Add to Google Calendar
          </a>
          <button onClick={() => downloadIcal(goal)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#f5f0ff", border: "1px solid #d4c8f0", borderRadius: 9, fontSize: 11, fontWeight: 600, color: "#7b2fbe", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            📱 Add to iPhone/Outlook
          </button>
        </div>
      )}

      {/* Log a deposit */}
      {showDeposit ? (
        <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
          <input type="number" value={depositInput} onChange={e => setDepositInput(e.target.value)}
            placeholder="Amount added ($)" style={{ ...inputStyle, flex: 1, padding: "9px 12px" }} />
          <button onClick={() => { if (depositInput && goal.id) { onDeposit(goal.id, parseFloat(depositInput)); setDepositInput(""); setShowDeposit(false); } }}
            style={{ background: C.forest, color: "white", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Log
          </button>
          <button onClick={() => setShowDeposit(false)} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif", color: C.textLight }}>
            ✕
          </button>
        </div>
      ) : (
        <button onClick={() => setShowDeposit(true)}
          style={{ width: "100%", padding: "9px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.forest, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
          + Log a Deposit
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "#f5faf0",
  border: `1px solid #d5e8c0`, borderRadius: 10, fontSize: 13,
  fontFamily: "DM Sans, sans-serif", color: "#0e2d1a", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#3a6b4a", marginBottom: 5,
};

/* ── MAIN GOALS SECTION ── */
export default function GoalsSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isLoggedIn) {
      loadGoals();
    } else {
      try {
        const local = localStorage.getItem("aimm_guest_goals");
        if (local) setGoals(JSON.parse(local));
      } catch { /* ignore parse error */ }
    }
  }, [isLoggedIn]);

  function persistGuestGoals(updated: Goal[]) {
    try {
      localStorage.setItem("aimm_guest_goals", JSON.stringify(updated));
    } catch { /* ignore storage error */ }
  }

  async function loadGoals() {
    setLoading(true);
    const res = await fetch("/api/goals");
    if (res.ok) { const d = await res.json(); setGoals(d.goals ?? []); }
    setLoading(false);
  }

  async function saveGoal(g: Omit<Goal, "id">) {
    if (isLoggedIn) {
      const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(g) });
      if (res.ok) { const d = await res.json(); setGoals(prev => [d.goal, ...prev]); }
    } else {
      const newGoal: Goal = { ...g, id: `local-${Date.now()}` };
      const updated = [newGoal, ...goals];
      setGoals(updated);
      persistGuestGoals(updated);
    }
    setShowForm(false);
  }

  async function logDeposit(id: string, amount: number) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newAmount = goal.current_amount + amount;
    if (isLoggedIn) {
      const res = await fetch("/api/goals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, current_amount: newAmount, is_completed: newAmount >= goal.target_amount }) });
      if (res.ok) setGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: newAmount } : g));
    } else {
      const updated = goals.map(g => g.id === id ? { ...g, current_amount: newAmount } : g);
      setGoals(updated);
      persistGuestGoals(updated);
    }
  }

  async function deleteGoal(id: string) {
    if (isLoggedIn) {
      await fetch("/api/goals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    }
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    if (!isLoggedIn) persistGuestGoals(updated);
  }

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, #0e3d22, #1a5c35, #2d7a4a)`, padding: "24px 20px 30px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,78,0.12), transparent 70%)" }} />
        <div style={{ color: "#c8d9a8", fontSize: 12, marginBottom: 3 }}>Life Goals</div>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>🎯 My Savings Goals</div>
        {goals.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(201,169,78,0.3)", borderRadius: 13, padding: "13px 16px", backdropFilter: "blur(10px)" }}>
            <div style={{ color: "#c8d9a8", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Total across {goals.length} goal{goals.length !== 1 ? "s" : ""}</div>
            <div style={{ color: "white", fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
              <span style={{ color: "#e8c97a", fontSize: 15 }}>$</span>{totalSaved.toLocaleString()}{" "}
              <span style={{ color: "#c8d9a8", fontSize: 13 }}>of ${totalTarget.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 18px" }}>
        {!isLoggedIn && (
          <div style={{ background: "#fdf7e8", border: `1px solid #e8c97a`, borderRadius: 12, padding: "12px 14px", fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <div><strong>Sign in to save your goals</strong> across devices and get calendar reminders. Goals added now are saved locally in this session.</div>
          </div>
        )}

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ width: "100%", padding: "14px", background: C.forest, color: "white", border: "none", borderRadius: 13, fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ➕ Add New Savings Goal
          </button>
        )}

        {showForm && <GoalForm onSave={saveGoal} onCancel={() => setShowForm(false)} />}

        {loading && <div style={{ textAlign: "center", padding: 24, color: C.textMuted }}>Loading your goals... 🌿</div>}

        {!loading && goals.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: C.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.forestDeep, marginBottom: 8 }}>No goals yet</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>Add your first savings goal above — Charlotte will help you plan it out with a monthly target and calendar reminders.</div>
          </div>
        )}

        {goals.map(g => (
          <GoalCard key={g.id} goal={g} onDeposit={logDeposit} onDelete={deleteGoal} />
        ))}
      </div>
    </div>
  );
}

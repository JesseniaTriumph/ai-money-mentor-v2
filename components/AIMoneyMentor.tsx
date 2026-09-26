"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import dynamic from "next/dynamic";
import CharlotteLogo from "./Logo";
import NavIcon from "./NavIcon";

const GoalsSection    = dynamic(() => import("./GoalsSection"),    { ssr: false });
const LinksSection    = dynamic(() => import("./LinksSection"),    { ssr: false });
const AuthModal       = dynamic(() => import("./AuthModal"),       { ssr: false });
const CharlotteAvatar = dynamic(() => import("./CharlotteAvatar"), { ssr: false });

function GoldStar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <defs>
        <linearGradient id="gstarGrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#e8c97a" />
          <stop offset="100%" stopColor="#a07820" />
        </linearGradient>
      </defs>
      <path d="M12 2L13.9 10.1L22 12L13.9 13.9L12 22L10.1 13.9L2 12L10.1 10.1Z" fill="url(#gstarGrad)" />
    </svg>
  );
}

/* ─────────────── DESIGN TOKENS ─────────────── */
const C = {
  sage: "#e8f0d8",
  sageMid: "#c8d9a8",
  sageDark: "#a8c088",
  forest: "#1a5c35",
  forestDeep: "#0e3d22",
  forestMid: "#2d7a4a",
  gold: "#c9a94e",
  goldLight: "#e8c97a",
  goldPale: "#fdf7e8",
  white: "#fafdf5",
  offWhite: "#f5faf0",
  text: "#0e2d1a",
  textLight: "#3a6b4a",
  textMuted: "#6b9a7a",
  cardBg: "#f0f7e6",
  border: "#d5e8c0",
  red: "#c0392b",
  redLight: "#fdf2f2",
  blue: "#1a56a0",
  sidebar: "#07291a",
};

/* ─────────────── TYPES ─────────────── */
type SectionId =
  | "home" | "budget" | "charlotte" | "learn" | "progress"
  | "goals" | "links"
  | "home-buying" | "credit" | "investments" | "retirement"
  | "education-529" | "taxes-personal" | "taxes-business" | "estate-planning";

type Message = { role: "user" | "assistant"; content: string };

/* ─────────────── NAVIGATION SECTIONS ─────────────── */
const NAV_GROUPS = [
  {
    label: "Dashboard",
    items: [
      { id: "home" as SectionId,      icon: "🏠", label: "Home",          short: "Home" },
      { id: "budget" as SectionId,    icon: "📊", label: "Budget",        short: "Budget" },
      { id: "charlotte" as SectionId, icon: "✨", label: "Ask Charlotte",  short: "Charlotte" },
      { id: "learn" as SectionId,     icon: "📚", label: "Learn",         short: "Learn" },
      { id: "progress" as SectionId,  icon: "🏆", label: "Progress",      short: "Progress" },
      { id: "goals" as SectionId,     icon: "🎯", label: "Savings Goals", short: "Goals" },
      { id: "links" as SectionId,     icon: "🔗", label: "My Links",      short: "Links" },
    ],
  },
  {
    label: "Life Goals",
    items: [
      { id: "home-buying" as SectionId,     icon: "🏡", label: "Buying a Home",      short: "Home" },
      { id: "credit" as SectionId,          icon: "💳", label: "Credit & Debt",       short: "Credit" },
      { id: "investments" as SectionId,     icon: "📈", label: "Investments",         short: "Invest" },
      { id: "retirement" as SectionId,      icon: "🎯", label: "Retirement",          short: "Retire" },
      { id: "education-529" as SectionId,   icon: "🎓", label: "529 College Savings", short: "529" },
      { id: "taxes-personal" as SectionId,  icon: "📝", label: "Taxes (Personal)",    short: "Taxes" },
      { id: "taxes-business" as SectionId,  icon: "🏢", label: "Taxes (Business)",    short: "Biz Tax" },
      { id: "estate-planning" as SectionId, icon: "🏛️", label: "Estate Planning",    short: "Estate" },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);
const MOBILE_BOTTOM = ALL_ITEMS.slice(0, 5); // first 5 for bottom nav on mobile

/* ─────────────── GAMIFIED CURRICULUM ─────────────── */
const CURRICULUM = [
  {
    level: 1, name: "Budget Rookie", xp: 0, unlocks: ["Budget Basics", "What's a Bank Account?", "Emergency Fund 101", "Understanding Paychecks"],
    badge: "🌱", color: C.sageDark,
  },
  {
    level: 2, name: "Savings Starter", xp: 200, unlocks: ["Credit Score Basics", "Debt Avalanche vs Snowball", "Building Your Emergency Fund", "Banking: Fees & HYSAs"],
    badge: "🏦", color: C.forestMid,
  },
  {
    level: 3, name: "Apprentice Saver", xp: 500, unlocks: ["Home Buying 101", "Renting vs Buying", "Taxes 101", "529 Plans Introduction"],
    badge: "⭐", color: C.forest,
  },
  {
    level: 4, name: "Financial Explorer", xp: 1000, unlocks: ["Investing Fundamentals", "Index Funds & ETFs", "Retirement Accounts (401k/IRA)", "Personal Tax Strategy"],
    badge: "📈", color: C.blue,
  },
  {
    level: 5, name: "Money Master", xp: 2000, unlocks: ["Advanced Investing", "Estate Planning Basics", "Business Taxes", "Advanced Retirement"],
    badge: "🏆", color: C.gold,
  },
  {
    level: 6, name: "Financial Elite", xp: 4000, unlocks: ["Wealth Building", "Real Estate Investing", "Legacy Planning", "Tax-Loss Harvesting"],
    badge: "💎", color: "#7b2fbe",
  },
];

const QUIZ_BANK: Record<string, { q: string; options: string[]; correct: number; explanation: string; xp: number }[]> = {
  budget: [
    { q: "In the 50/30/20 budget rule, what does the '20' represent?", options: ["Food spending", "Savings & debt payoff", "Housing costs", "Entertainment"], correct: 1, explanation: "20% goes to savings and debt payoff. This is how you build wealth over time — every dollar you save today is a dollar working for your future.", xp: 50 },
  ],
  credit: [
    { q: "Which factor has the BIGGEST impact on your credit score?", options: ["How many credit cards you have", "Your income level", "Payment history (paying on time)", "How old you are"], correct: 2, explanation: "Payment history = 35% of your score! Set up autopay for at least the minimum payment. Missing even one payment can drop your score 50-100 points.", xp: 60 },
  ],
  investments: [
    { q: "What does 'dollar-cost averaging' mean?", options: ["Buying stocks when they're cheap", "Investing the same amount every month regardless of price", "Only investing in American companies", "Splitting investments evenly"], correct: 1, explanation: "DCA means you invest the same amount regularly (like $100/month). When prices are high you buy fewer shares; when low you buy more. It removes emotion from investing.", xp: 75 },
  ],
  retirement: [
    { q: "What's the #1 rule for 401(k) contributions?", options: ["Max it out every year", "Contribute enough to get your full employer match", "Only invest in bonds", "Wait until you're 40"], correct: 1, explanation: "Employer match is FREE money — if your employer matches 3%, contribute at least 3% or you're leaving free money on the table. Always capture the full match first.", xp: 70 },
  ],
  "home-buying": [
    { q: "What is PMI (Private Mortgage Insurance)?", options: ["A type of homeowner's insurance", "Insurance you pay when you put down less than 20%", "A government mortgage program", "Property tax insurance"], correct: 1, explanation: "PMI protects the LENDER (not you) when you put down less than 20%. It adds $50-200/month to your payment. A 20% down payment eliminates PMI entirely.", xp: 65 },
  ],
  "taxes-personal": [
    { q: "What is the Earned Income Tax Credit (EITC)?", options: ["A tax you owe if you earn income", "A refundable credit for low-to-moderate income workers", "A deduction for investment income", "A tax penalty for early retirement withdrawals"], correct: 1, explanation: "EITC is a refundable credit — meaning you get it even if you don't owe taxes! In 2024, it can be up to $7,830. Always file, even if you don't think you owe anything.", xp: 60 },
  ],
  "education-529": [
    { q: "What changed about 529 plans under the SECURE 2.0 Act?", options: ["You can no longer use them for K-12", "Unused funds can now be rolled into a Roth IRA", "Contributions are federally tax-deductible", "They were eliminated"], correct: 1, explanation: "SECURE 2.0 (2022) allows rolling up to $35,000 of unused 529 funds into a Roth IRA — no more \"what if they don't go to college\" fear! (After 15 years, lifetime limit $35K)", xp: 80 },
  ],
  estate: [
    { q: "Which document overrides your will for bank accounts and retirement funds?", options: ["Your will", "Beneficiary designations", "A trust", "Power of attorney"], correct: 1, explanation: "Beneficiary designations on accounts (bank, 401k, IRA, life insurance) automatically transfer assets and OVERRIDE your will. Review them every 2-3 years and after major life events.", xp: 70 },
  ],
};

/* ─────────────── STATIC DATA ─────────────── */
const BUDGET_ITEMS = [
  { cat: "Housing",          spent: 0, total: 0, color: C.forest },
  { cat: "Food & Groceries", spent: 0, total: 0, color: C.gold },
  { cat: "Transportation",   spent: 0, total: 0, color: C.forestMid },
  { cat: "Emergency Fund",   spent: 0, total: 0, color: C.goldLight },
  { cat: "Personal",         spent: 0, total: 0, color: "#5a9a6a" },
];

/* CharlotteLogo is imported from ./Logo */

/* ─────────────── SHARED UI ─────────────── */
function Disclaimer({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ background: C.redLight, borderBottom: `2px solid ${C.red}`, padding: "9px 16px", display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: C.red, lineHeight: 1.45, fontWeight: 500 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <strong>Educational Purposes Only</strong> — Charlotte is an AI financial education guide, not a licensed financial advisor, CPA, or attorney. Always consult a qualified professional for major financial, tax, or legal decisions.
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 15, flexShrink: 0, padding: "0 4px" }} aria-label="Dismiss">✕</button>
    </div>
  );
}

function HeroSection({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: `linear-gradient(160deg, ${C.forestDeep} 0%, ${C.forest} 60%, ${C.forestMid} 100%)`, padding: "12px 20px 14px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,78,0.12) 0%, transparent 70%)" }} />
      <div style={{ color: C.sageMid, fontSize: 12, marginBottom: 3 }}>{subtitle}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 22, fontWeight: 700, marginBottom: children ? 14 : 0, display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <NavIcon id={icon} size={22} color="rgba(255,255,255,0.9)" strokeWidth={1.6} />}
        {title}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ pct, gold }: { pct: number; gold?: boolean }) {
  return (
    <div style={{ height: 7, background: C.sageMid, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: gold ? `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` : `linear-gradient(90deg, ${C.forest}, ${C.forestMid})`, transition: "width 1s ease" }} />
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.forestDeep, marginBottom: 13, display: "flex", alignItems: "center", gap: 8 }}>{children}</div>;
}

function CharlotteTip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.forestDeep}, ${C.forest})`, borderRadius: 16, padding: "16px 18px", margin: "0 0 14px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 12, top: 10, opacity: 0.3 }}><GoldStar size={26} /></div>
      <div style={{ background: C.gold, color: C.forestDeep, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 9px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 7 }}><GoldStar size={10} /> Charlotte's Tip</div>
      <div style={{ background: "rgba(255,255,255,0.1)", borderLeft: `3px solid ${C.gold}`, borderRadius: "0 9px 9px 0", padding: "10px 12px", color: C.sageMid, fontSize: 13, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

// ── Live Market Snapshot (Alpha Vantage) ──────────────────────────────────
function StockTicker() {
  const [quotes, setQuotes] = useState<{ symbol: string; label: string; price: string; change: string; changePercent: string; isPositive: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stocks")
      .then(r => r.json())
      .then(d => { if (d.quotes) { setQuotes(d.quotes); setTs(d.ts); } else setError("Market data unavailable"); })
      .catch(() => setError("Market data unavailable"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: `linear-gradient(135deg, ${C.forestDeep} 0%, #0a2e18 100%)`, border: `1px solid rgba(201,169,78,0.3)`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GoldStar size={13} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" }}>Live Market Snapshot</span>
        </div>
        {ts && <span style={{ fontSize: 10, color: C.sageMid }}>Updated {new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
      {loading && <div style={{ color: C.sageMid, fontSize: 12 }}>Loading market data…</div>}
      {error && <div style={{ color: "#f87171", fontSize: 12 }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {quotes.map(q => (
            <div key={q.symbol} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", border: `1px solid ${q.isPositive ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{q.symbol}</div>
                  <div style={{ fontSize: 10, color: C.sageMid, marginTop: 1 }}>{q.label}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>${q.price}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: q.isPositive ? "#4ade80" : "#f87171" }}>{q.changePercent}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 10 }}>Data via Alpha Vantage • For educational purposes only • Not investment advice</div>
    </div>
  );
}

// ── Live Mortgage Rates (FRED) ────────────────────────────────────────────
function MortgageRates() {
  const [rates, setRates] = useState<{ rate30: string; rate15: string; asOf: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/mortgage")
      .then(r => r.json())
      .then(d => { if (d.rate30) setRates(d); else setError("Rate data unavailable"); })
      .catch(() => setError("Rate data unavailable"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: `linear-gradient(135deg, ${C.forestDeep} 0%, #0a2e18 100%)`, border: `1px solid rgba(201,169,78,0.3)`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <GoldStar size={13} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "1px", textTransform: "uppercase" }}>Current Mortgage Rates</span>
      </div>
      {loading && <div style={{ color: C.sageMid, fontSize: 12 }}>Loading rates…</div>}
      {error && <div style={{ color: "#f87171", fontSize: 12 }}>{error}</div>}
      {!loading && !error && rates && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(201,169,78,0.15)", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.goldLight }}>{rates.rate30}%</div>
            <div style={{ fontSize: 11, color: C.sageMid, marginTop: 3 }}>30-Year Fixed</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(201,169,78,0.15)", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.goldLight }}>{rates.rate15}%</div>
            <div style={{ fontSize: 11, color: C.sageMid, marginTop: 3 }}>15-Year Fixed</div>
          </div>
          <div style={{ gridColumn: "1/-1", fontSize: 11, color: C.textMuted }}>Source: Federal Reserve (FRED) • Updated weekly • Week of {rates.asOf}</div>
        </div>
      )}
    </div>
  );
}

function ApiNote({ api, description, url }: { api: string; description: string; url: string }) {
  return (
    <Card style={{ background: "#f0f7ff", border: `1px solid #b8d4f0`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔗</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{api}</div>
          <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{description}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, wordBreak: "break-all" }}>{url}</div>
        </div>
      </div>
    </Card>
  );
}

function QuizWidget({ sectionKey, onEarnXP }: { sectionKey: string; onEarnXP?: (xp: number, sectionKey: string) => void }) {
  const questions = QUIZ_BANK[sectionKey];
  const q = questions?.[0];
  const [selected, setSelected] = useState<number | null>(null);
  if (!q) return null;

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct && onEarnXP) {
      onEarnXP(q.xp, sectionKey);
    }
  };

  return (
    <div style={{ background: `linear-gradient(135deg, rgba(201,169,78,0.12), rgba(201,169,78,0.04))`, border: `2px solid ${C.gold}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.forestDeep }}>Quiz Time 🎯</div>
        <div style={{ background: C.gold, color: C.forestDeep, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 9 }}>+{q.xp} XP</div>
      </div>
      <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5, marginBottom: 12 }}>{q.q}</div>
      <div style={{ display: "grid", gap: 7 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = selected === i;
          let bg = C.cardBg, border = `1px solid ${C.sageMid}`, color = C.text;
          if (selected !== null) {
            if (isCorrect) { bg = C.forest; border = `1px solid ${C.forest}`; color = "white"; }
            else if (isSelected) { bg = "#fff0f0"; border = "1px solid #d44"; color = "#d44"; }
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
              style={{ padding: "9px 12px", background: bg, border, borderRadius: 10, fontSize: 13, cursor: selected === null ? "pointer" : "default", textAlign: "left", fontFamily: "DM Sans, sans-serif", color, transition: "all 0.2s" }}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 11 }}>
          {selected === q.correct ? (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <CharlotteAvatar state="celebrating" size={60} showBubble={true} message={`Correct! +${q.xp} XP! 🏅`} />
            </div>
          ) : null}
          <div style={{ padding: 11, background: selected === q.correct ? "rgba(26,92,53,0.1)" : "#fff0f0", borderRadius: 10, color: selected === q.correct ? C.forest : "#c0392b", fontSize: 13, lineHeight: 1.5 }}>
            {selected === q.correct ? "✅ " : "❌ "}<strong>{selected === q.correct ? "Correct!" : "Not quite."}</strong> {q.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── TAB CONTENT ─────────────── */

/* Guest landing auth card — shown in hero when no user is signed in */
function GuestAuthCard({ onAuthSuccess }: { onAuthSuccess: (id: string, name: string, email: string) => void }) {
  const supabase = createClient();
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inp: React.CSSProperties = {
    width: "100%", padding: "7px 10px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(201,169,78,0.22)",
    borderRadius: 7, color: "white", fontSize: 12,
    fontFamily: "DM Sans, sans-serif", outline: "none", marginBottom: 6,
    boxSizing: "border-box",
  };

  const handleSignIn = async () => {
    if (!siEmail || !siPassword) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPassword });
    setLoading(false);
    if (e) { setError(e.message); return; }
    const name = data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "there";
    onAuthSuccess(data.user?.id ?? "", name, data.user?.email ?? siEmail);
  };

  const handleSignUp = async () => {
    if (!suName || !suEmail || !suPassword) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.signUp({
      email: suEmail, password: suPassword,
      options: { data: { full_name: suName } },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    const name = suName || data.user?.email?.split("@")[0] || "there";
    onAuthSuccess(data.user?.id ?? "", name, data.user?.email ?? suEmail);
  };

  return (
    <div style={{ flex: 1, background: "rgba(0,0,0,0.28)", border: "1px solid rgba(201,169,78,0.28)", borderRadius: 15, padding: "14px 16px", backdropFilter: "blur(8px)", minWidth: 0 }}>
      <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 15, fontWeight: 700, marginBottom: 1 }}>Welcome to AI Money Mentor</div>
      <div style={{ color: C.sageMid, fontSize: 10.5, marginBottom: 11 }}>Your financial journey starts here</div>

      {error && <div style={{ background: "rgba(192,57,43,0.18)", border: "1px solid rgba(192,57,43,0.4)", borderRadius: 7, padding: "6px 9px", color: "#f87171", fontSize: 11, marginBottom: 9 }}>{error}</div>}

      <div style={{ color: C.goldLight, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>SIGN IN</div>
      <input type="email" placeholder="Email" value={siEmail} onChange={e => setSiEmail(e.target.value)} style={inp} />
      <input type="password" placeholder="Password" value={siPassword} onChange={e => setSiPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignIn()} style={{ ...inp, marginBottom: 8 }} />
      <button onClick={handleSignIn} disabled={loading}
        style={{ width: "100%", padding: "7px", background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, border: "none", borderRadius: 8, color: C.forestDeep, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginBottom: 10 }}>
        {loading ? "…" : "Sign In"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(201,169,78,0.18)" }} />
        <span style={{ fontSize: 9.5, color: "rgba(200,217,168,0.4)", fontWeight: 600 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "rgba(201,169,78,0.18)" }} />
      </div>

      <div style={{ color: C.sageMid, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>CREATE FREE ACCOUNT</div>
      <input type="text" placeholder="Full name" value={suName} onChange={e => setSuName(e.target.value)} style={inp} />
      <input type="email" placeholder="Email" value={suEmail} onChange={e => setSuEmail(e.target.value)} style={inp} />
      <input type="password" placeholder="Create a password" value={suPassword} onChange={e => setSuPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignUp()} style={{ ...inp, marginBottom: 8 }} />
      <button onClick={handleSignUp} disabled={loading}
        style={{ width: "100%", padding: "7px", background: C.forestMid, border: `1px solid rgba(201,169,78,0.25)`, borderRadius: 8, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginBottom: 8 }}>
        {loading ? "…" : "Create Free Account"}
      </button>

      <div style={{ fontSize: 9.5, color: "rgba(200,217,168,0.35)", lineHeight: 1.4, textAlign: "center" }}>
        Educational purposes only. Charlotte is not a licensed financial advisor.
      </div>
    </div>
  );
}

function HomeTab({ onNavigate, userName, isLoggedIn, onAuthSuccess, userXP, budgetSpent, budgetTotal, efPct, flScore }: {
  onNavigate: (id: SectionId) => void;
  userName?: string;
  isLoggedIn: boolean;
  onAuthSuccess: (id: string, name: string, email: string) => void;
  userXP: number;
  budgetSpent: number;
  budgetTotal: number;
  efPct: number;
  flScore: number;
}) {
  const currentLevelIdx = Math.max(0, CURRICULUM.findIndex(l => l.xp > userXP) - 1);
  const currentLevel = CURRICULUM[currentLevelIdx];

  /* ── GUEST STATE ─────────────────────────────────────────────────────── */
  if (!isLoggedIn) {
    return (
      <div>
        <div style={{ background: `linear-gradient(160deg, ${C.forestDeep} 0%, ${C.forest} 60%, ${C.forestMid} 100%)`, display: "flex", alignItems: "stretch", overflow: "hidden", position: "relative", minHeight: 380 }}>
          <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,78,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Left: Charlotte avatar + auth card side by side */}
          <div style={{ flex: 1, padding: "20px 16px", display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <CharlotteAvatar state="greeting" size={88} showBubble={true} message="Hi! I'm Charlotte. Sign in to start your financial journey! 💚" />
            </div>
            <GuestAuthCard onAuthSuccess={onAuthSuccess} />
          </div>

          {/* LOCKED — DO NOT CHANGE: right panel charlotte.png */}
          <div style={{ width: 300, flexShrink: 0, alignSelf: "stretch", overflow: "hidden" }}>
            <img src="/charlotte.png" alt="Charlotte at her desk" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── LOGGED-IN STATE — full dashboard ────────────────────────────────── */
  return (
    <div>
      {/* Home welcome — dark green, Charlotte avatar left, full studio image right */}
      <div style={{ background: `linear-gradient(160deg, ${C.forestDeep} 0%, ${C.forest} 60%, ${C.forestMid} 100%)`, display: "flex", alignItems: "flex-start", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,78,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Left: title + avatar + budget */}
        <div style={{ flex: 1, padding: "12px 16px 16px 20px", minWidth: 360 }}>
          <div style={{ color: C.sageMid, fontSize: 12, marginBottom: 3 }}>Good morning</div>
          <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 22, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <NavIcon id="home" size={22} color="rgba(255,255,255,0.9)" strokeWidth={1.6} />
            {`Welcome back, ${userName} 👋`}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <CharlotteAvatar state="greeting" size={96} showBubble={true} message="Good morning! Ready to level up your money game today?" />
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", border: `1px solid rgba(201,169,78,0.3)`, borderRadius: 14, padding: 14, backdropFilter: "blur(10px)" }}>
            <div style={{ color: C.sageMid, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Monthly Budget</div>
            {budgetTotal > 0 ? (
              <>
                <div style={{ color: "white", fontSize: 30, fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
                  <span style={{ color: C.goldLight, fontSize: 16 }}>$</span>{budgetSpent.toLocaleString()} <span style={{ color: C.sageMid, fontSize: 13 }}>of ${budgetTotal.toLocaleString()}</span>
                </div>
                <div style={{ color: C.sageMid, fontSize: 12, marginTop: 3 }}>${(budgetTotal - budgetSpent).toLocaleString()} remaining this month</div>
              </>
            ) : (
              <div style={{ color: C.sageMid, fontSize: 13, marginTop: 4 }}>Set up your budget to get started</div>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, color: C.forestDeep, padding: "5px 12px", borderRadius: 18, fontSize: 11, fontWeight: 700, marginTop: 11 }}>
              {currentLevel.badge} Level {currentLevel.level} — {currentLevel.name}
            </div>
          </div>
        </div>

        {/* LOCKED — DO NOT CHANGE without Paula's explicit approval
            Right panel: 300px wide, charlotte.png cropped to 780x1254 from aimm CHARLOTTE.png
            charlotte-face.png: 400x400 square from Desktop portrait screenshot (Jun 11 2026)
            Avatar size: 96px. These values are final and approved. */}
        <div style={{ width: 300, flexShrink: 0, alignSelf: "stretch", overflow: "hidden" }}>
          <img src="/charlotte.png" alt="Charlotte at her desk" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      </div>

      <div style={{ padding: "16px 18px 0" }}>
        <CharlotteTip>
          Think of an emergency fund like a <strong style={{ color: "white" }}>financial seatbelt</strong> — you hope you never need it, but you'll be really glad it's there. Your starter goal: <strong style={{ color: "white" }}>$1,000 first</strong>. Then grow to 3–6 months of expenses.
        </CharlotteTip>

        <SectionTitle>📈 Your Progress</SectionTitle>
        {[
          { label: "Emergency Fund Goal", pct: efPct },
          { label: "Financial Literacy Score", pct: flScore },
          { label: `Level ${currentLevel.level} → Level ${Math.min(currentLevel.level + 1, CURRICULUM.length)}`, pct: (() => { const next = CURRICULUM[currentLevelIdx + 1]; if (!next) return 100; return Math.round((userXP - currentLevel.xp) / (next.xp - currentLevel.xp) * 100); })(), gold: true, badge: `${userXP} / ${CURRICULUM[currentLevelIdx + 1]?.xp ?? "MAX"} XP` },
        ].map(p => (
          <Card key={p.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.forest }}>{p.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{p.badge ?? `${p.pct}%`}</div>
            </div>
            <ProgressBar pct={p.pct} gold={p.gold} />
          </Card>
        ))}

        <SectionTitle>🌿 Life Goals</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 18 }}>
          {NAV_GROUPS[1].items.map(item => (
            <div key={item.id} onClick={() => onNavigate(item.id)}
              style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 13, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 18px rgba(14,61,34,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
              <div style={{ marginBottom: 7 }}><NavIcon id={item.id} size={26} color={C.forest} strokeWidth={1.5} /></div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.forest }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type BudgetItem = { cat: string; spent: number; total: number; color: string };

const INITIAL_BUDGET_ITEMS: BudgetItem[] = [
  { cat: "Housing (Rent / Mortgage)", spent: 1100, total: 1250, color: C.forest },
  { cat: "Food & Groceries", spent: 340, total: 450, color: C.gold },
  { cat: "Transportation & Gas", spent: 120, total: 200, color: C.forestMid },
  { cat: "Utilities & Phone", spent: 140, total: 180, color: C.sageDark },
  { cat: "Savings & Debt Payoff", spent: 150, total: 300, color: C.blue },
  { cat: "Personal & Wants", spent: 90, total: 180, color: "#7b2fbe" },
];

function BudgetTab({ isLoggedIn, onAuthSuccess, onEarnXP }: {
  isLoggedIn: boolean;
  onAuthSuccess: (id: string, name: string, email: string) => void;
  onEarnXP?: (xp: number, sectionKey: string) => void;
}) {
  const [items, setItems] = useState<BudgetItem[]>(INITIAL_BUDGET_ITEMS);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editSpent, setEditSpent] = useState("");
  const [editTotal, setEditTotal] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aimm_budget_items");
      if (saved) setItems(JSON.parse(saved));
    } catch { /* ignore parse error */ }
  }, []);

  const saveItems = (newItems: BudgetItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("aimm_budget_items", JSON.stringify(newItems));
    } catch { /* ignore storage error */ }
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditSpent(String(items[idx].spent));
    setEditTotal(String(items[idx].total));
  };

  const saveEdit = (idx: number) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      spent: parseFloat(editSpent) || 0,
      total: parseFloat(editTotal) || 0,
    };
    saveItems(updated);
    setEditingIdx(null);
  };

  const total = items.reduce((s, i) => s + i.spent, 0);
  const budgetTotal = items.reduce((s, i) => s + i.total, 0);
  const remaining = budgetTotal - total;

  return (
    <div>
      <HeroSection title="Budget Builder" subtitle="Your Monthly Plan" icon="budget">
        {budgetTotal > 0 ? (
          <div style={{ color: C.sageMid, fontSize: 13 }}>
            Spent: <strong style={{ color: C.goldLight }}>${total}</strong> of ${budgetTotal}
          </div>
        ) : (
          <div style={{ color: C.sageMid, fontSize: 13 }}>Set up your budget to get started</div>
        )}
      </HeroSection>
      <div style={{ padding: "18px 18px 0" }}>
        {!isLoggedIn && (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12 }}>
            <span style={{ color: C.textLight }}>💡 <strong>Guest Mode:</strong> Your budget is stored locally in this browser.</span>
          </div>
        )}

        <SectionTitle>Spending Breakdown (Click any item to edit)</SectionTitle>
        {items.map((item, idx) => (
          <div key={item.cat} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 11, padding: "12px 14px", marginBottom: 8 }}>
            {editingIdx === idx ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 150 }}>{item.cat}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Spent: $</span>
                  <input type="number" value={editSpent} onChange={e => setEditSpent(e.target.value)}
                    style={{ width: 70, padding: "5px 7px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Limit: $</span>
                  <input type="number" value={editTotal} onChange={e => setEditTotal(e.target.value)}
                    style={{ width: 70, padding: "5px 7px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12 }} />
                </div>
                <button onClick={() => saveEdit(idx)} style={{ background: C.forest, color: "white", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditingIdx(null)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <div onClick={() => startEdit(idx)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.cat}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>${item.spent}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>of ${item.total} <span style={{ color: C.gold, fontSize: 10 }}>✏️</span></div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ background: C.forestDeep, borderRadius: 11, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: C.sageMid, fontSize: 13 }}>Remaining from ${budgetTotal}</div>
          <div style={{ color: remaining >= 0 ? C.goldLight : "#f87171", fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
            ${remaining}
          </div>
        </div>

        <QuizWidget sectionKey="budget" onEarnXP={onEarnXP} />

        <CharlotteTip>
          Try the <strong style={{ color: "white" }}>50/30/20 rule</strong>: 50% for needs (rent, food, transport), 30% for wants, 20% for savings & debt. 🥧
        </CharlotteTip>
      </div>
    </div>
  );
}

function LearnTab({ userXP, onEarnXP }: { userXP: number; onEarnXP?: (xp: number, sectionKey: string) => void }) {
  const currentLevelIdx = Math.max(0, CURRICULUM.findIndex(l => l.xp > userXP) - 1);
  const currentLevel = CURRICULUM[currentLevelIdx];

  return (
    <div>
      <HeroSection title="Learn & Earn Points" subtitle="Financial Literacy" icon="learn">
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <div style={{ color: C.goldLight, fontSize: 12 }}>⭐ {userXP} XP earned</div>
          <div style={{ color: C.sageMid, fontSize: 12 }}>{currentLevel.badge} {currentLevel.name}</div>
        </div>
      </HeroSection>
      <div style={{ padding: "18px 18px 0" }}>
        <SectionTitle>🎯 Daily Quiz Challenge</SectionTitle>
        <QuizWidget sectionKey="budget" onEarnXP={onEarnXP} />

        <SectionTitle>🗺️ Your Learning Path</SectionTitle>
        {CURRICULUM.map((lvl, idx) => {
          const isUnlocked = userXP >= lvl.xp;
          const isCurrent = idx === currentLevelIdx;
          return (
            <Card key={lvl.level} style={{ borderColor: isCurrent ? C.gold : isUnlocked ? C.sageDark : C.border, background: isCurrent ? C.forestDeep : isUnlocked ? "rgba(26,92,53,0.05)" : C.cardBg, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isUnlocked ? 8 : 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isUnlocked ? lvl.color : C.sageMid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{isUnlocked ? lvl.badge : "🔒"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isCurrent ? "white" : isUnlocked ? C.forest : C.textMuted }}>
                    Level {lvl.level}: {lvl.name}
                  </div>
                  <div style={{ fontSize: 11, color: isCurrent ? C.sageMid : C.textMuted }}>{lvl.xp} XP to unlock</div>
                </div>
                {isCurrent && <div style={{ color: C.goldLight, fontSize: 10, fontWeight: 700 }}>CURRENT</div>}
                {!isCurrent && isUnlocked && !isCurrent && <div style={{ color: C.gold, fontSize: 14 }}>✓</div>}
              </div>
              {isUnlocked && (
                <div style={{ paddingLeft: 48 }}>
                  {lvl.unlocks.map(module => (
                    <div key={module} style={{ fontSize: 12, color: isCurrent ? C.sageMid : C.textLight, padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: C.gold, fontSize: 10 }}>▸</span> {module}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProgressTab({ userXP, streak, badgeCount, userName }: { userXP: number; streak: number; badgeCount: number; userName?: string }) {
  const currentLevelIdx = Math.max(0, CURRICULUM.findIndex(l => l.xp > userXP) - 1);
  const currentLevel = CURRICULUM[currentLevelIdx];
  const initial = userName ? userName[0].toUpperCase() : "?";

  const BADGES = [
    { emoji: "🌱", label: "Budget Starter", earned: badgeCount >= 1 },
    { emoji: "🏦", label: "Saver",          earned: badgeCount >= 2 },
    { emoji: "📊", label: "Quiz Master",    earned: badgeCount >= 3 },
    { emoji: "⭐", label: "7-Day Streak",   earned: streak >= 7 },
    { emoji: "🏆", label: "Money Master",   earned: userXP >= 2000 },
    { emoji: "💎", label: "Elite",          earned: userXP >= 4000 },
  ];

  return (
    <div>
      <HeroSection title={`${userName ?? "Your"} Journey`} subtitle="Your Achievements" icon="progress">
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${C.forestMid}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 10px", border: `3px solid ${C.goldLight}` }}>{initial}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, color: C.forestDeep, padding: "5px 13px", borderRadius: 18, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
            {currentLevel.badge} Level {currentLevel.level} — {currentLevel.name}
          </div>
          <div style={{ display: "flex", gap: 22, justifyContent: "center" }}>
            {[[String(userXP), "XP Points"], [String(streak), "Day Streak"], [String(badgeCount), "Badges"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ color: C.goldLight, fontSize: 20, fontWeight: 700 }}>{v}</div>
                <div style={{ color: C.sageMid, fontSize: 10 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </HeroSection>
      <div style={{ padding: "16px 18px 0" }}>
        <SectionTitle>🏅 Badges Earned</SectionTitle>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
          {BADGES.map(b => (
            <div key={b.label} style={{ flexShrink: 0, textAlign: "center", width: 60 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, marginBottom: 5, border: `3px solid ${b.earned ? C.gold : C.sageMid}`, background: b.earned ? "rgba(201,169,78,0.15)" : C.cardBg, boxShadow: b.earned ? "0 0 12px rgba(201,169,78,0.28)" : "none", filter: b.earned ? "none" : "grayscale(0.7) opacity(0.5)" }}>{b.emoji}</div>
              <div style={{ fontSize: 9.5, color: C.textLight, lineHeight: 1.2 }}>{b.label}</div>
            </div>
          ))}
        </div>
        <SectionTitle>🗺️ Level Roadmap</SectionTitle>
        {CURRICULUM.map((lvl, idx) => {
          const done = idx < currentLevelIdx;
          const current = idx === currentLevelIdx;
          return (
            <div key={lvl.level} style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8, padding: "12px 14px", background: current ? C.forestDeep : done ? "rgba(26,92,53,0.07)" : C.cardBg, border: `1px solid ${current ? C.gold : done ? C.forestMid : C.border}`, borderRadius: 11 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: (done || current) ? C.gold : C.sageMid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: (done || current) ? C.forestDeep : C.textMuted, flexShrink: 0 }}>{lvl.level}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: current ? "white" : done ? C.forest : C.text }}>{lvl.name}</div>
                <div style={{ fontSize: 11, color: current ? C.sageMid : C.textMuted }}>{lvl.xp} XP to unlock</div>
              </div>
              {done && <div style={{ color: C.gold, fontSize: 14 }}>✓</div>}
              {current && <div style={{ color: C.goldLight, fontSize: 10, fontWeight: 700 }}>YOU ARE HERE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── LIFE GOAL SECTION TEMPLATE ─── */
function GoalSection({ icon, title, intro, tips, quizKey, apis, curriculum, onEarnXP }: {
  icon: string; title: string; intro: string;
  tips: string[];
  quizKey?: string;
  apis?: { api: string; description: string; url: string }[];
  curriculum?: string[];
  onEarnXP?: (xp: number, sectionKey: string) => void;
}) {
  return (
    <div>
      <HeroSection title={title} subtitle="Life Goals" icon={icon} />
      <div style={{ padding: "18px 18px 0" }}>
        <Card style={{ background: "#f7fdf2", borderColor: C.sageDark }}>
          <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>{intro}</p>
        </Card>
        {quizKey && <QuizWidget sectionKey={quizKey} onEarnXP={onEarnXP} />}
        <CharlotteTip>
          <strong style={{ color: "white" }}>Charlotte asks:</strong> {tips[0]}
        </CharlotteTip>
        <SectionTitle>📋 Key Facts</SectionTitle>
        {tips.slice(1).map((t, i) => (
          <Card key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px" }}>
            <span style={{ color: C.gold, fontSize: 14, flexShrink: 0 }}>▸</span>
            <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{t}</span>
          </Card>
        ))}
        {curriculum && (
          <>
            <SectionTitle>📚 Learning Modules</SectionTitle>
            {curriculum.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 7 }}>
                <span style={{ fontSize: 15 }}>{i === 0 ? "▶️" : "🔒"}</span>
                <span style={{ fontSize: 13, color: C.text }}>{m}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: C.gold, fontWeight: 700 }}>+{50 + i * 25} XP</span>
              </div>
            ))}
          </>
        )}
        {apis && apis.length > 0 && (
          <>
            <SectionTitle>🔗 Live Data APIs</SectionTitle>
            <Card style={{ background: "#e8f4fd", borderColor: "#b8d4f0", padding: "10px 13px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: C.blue, lineHeight: 1.5 }}>
                💡 <strong>For developers:</strong> These APIs power real-time data in this section. Add keys to your <code>.env.local</code> file and <a href="https://vercel.com/dashboard" style={{ color: C.blue }}>Vercel environment variables</a>.
              </div>
            </Card>
            {apis.map((a, i) => <ApiNote key={i} {...a} />)}
          </>
        )}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

/* ─────────────── CHARLOTTE CHAT ─────────────── */
function CharlotteTab({ currentSection }: { currentSection: SectionId }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Charlotte, your AI Money Mentor 🌿\n\n📋 Disclaimer: My guidance is for educational purposes only — I'm not a licensed financial advisor, CPA, or attorney. For major decisions, always consult a professional.\n\nBefore we dive in — what's one money worry keeping you up at night? That helps me point you to exactly the right place to start. 💚",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, topic: currentSection }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? data.error ?? "Let me think about that..." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Hmm, I had a hiccup. Try again in a moment! 🌿" }]);
    }
    setLoading(false);
  };

  const QUICK_PROMPTS = [
    "How do I start an emergency fund?",
    "Explain credit scores simply",
    "What's the 50/30/20 rule?",
    "How do I save for retirement?",
    "Free tax filing options?",
    "Should I rent or buy a home?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <HeroSection title="Charlotte" subtitle="AI Money Mentor • Always here" icon="charlotte">
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <CharlotteAvatar state={loading ? "thinking" : "idle"} size={72} />
        </div>
      </HeroSection>
      <div style={{ padding: "8px 12px 5px", display: "flex", gap: 7, flexWrap: "wrap", borderBottom: `1px solid ${C.border}`, background: C.white }}>
        {QUICK_PROMPTS.map(q => (
          <button key={q} onClick={() => setInput(q)}
            style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 11, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: C.forest, fontFamily: "DM Sans, sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>
            {q}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "13px 14px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "86%", background: m.role === "assistant" ? C.forestDeep : C.gold, color: m.role === "assistant" ? "white" : C.forestDeep, borderRadius: m.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "10px 13px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {m.role === "assistant" && <div style={{ color: C.gold, fontSize: 9.5, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><GoldStar size={11} /> CHARLOTTE</div>}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: C.forestDeep, borderRadius: "4px 14px 14px 14px", padding: "10px 15px", color: C.sageMid, fontSize: 13 }}>Charlotte is thinking... 🌿</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "9px 13px 12px", background: C.white, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask Charlotte anything about money..."
            style={{ flex: 1, padding: "10px 12px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 11, fontSize: 13, fontFamily: "DM Sans, sans-serif", color: C.text, outline: "none" }} />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? C.sageMid : C.forest, color: "white", border: "none", borderRadius: 11, padding: "10px 14px", fontSize: 16, cursor: loading || !input.trim() ? "default" : "pointer", transition: "background 0.2s" }}>➤</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── SECTION REGISTRY ─────────────── */
function renderSection(
  id: SectionId,
  onNavigate: (s: SectionId) => void,
  activeSection: SectionId,
  isLoggedIn: boolean,
  userName?: string,
  onAuthSuccess?: (id: string, name: string, email: string) => void,
  userXP = 0,
  budgetSpent = 0,
  budgetTotal = 0,
  efPct = 0,
  flScore = 0,
  streak = 0,
  badgeCount = 0,
  onEarnXP?: (xp: number, sectionKey: string) => void,
) {
  switch (id) {
    case "home":      return <HomeTab onNavigate={onNavigate} userName={userName} isLoggedIn={isLoggedIn} onAuthSuccess={onAuthSuccess ?? (() => {})} userXP={userXP} budgetSpent={budgetSpent} budgetTotal={budgetTotal} efPct={efPct} flScore={flScore} />;
    case "budget":    return <BudgetTab isLoggedIn={isLoggedIn} onAuthSuccess={onAuthSuccess ?? (() => {})} onEarnXP={onEarnXP} />;
    case "charlotte": return <CharlotteTab currentSection={activeSection} />;
    case "learn":     return <LearnTab userXP={userXP} onEarnXP={onEarnXP} />;
    case "progress":  return <ProgressTab userXP={userXP} streak={streak} badgeCount={badgeCount} userName={userName} />;
    case "goals":     return <GoalsSection isLoggedIn={isLoggedIn} />;
    case "links":     return <LinksSection isLoggedIn={isLoggedIn} />;

    case "home-buying":
      return <div><MortgageRates /><GoalSection icon="home-buying" title="Buying a Home" quizKey="home-buying" onEarnXP={onEarnXP}
        intro="Buying a home is one of the biggest financial decisions you'll make. Charlotte will walk you through each step — from saving your down payment to understanding mortgage rates."
        tips={[
          "Before we talk home buying — do you have 3-6 months of emergency savings? That's the foundation everything else is built on.",
          "Down payment: 20% avoids Private Mortgage Insurance (PMI). FHA loans allow as low as 3.5% down.",
          "Rule of thumb: Your home price should be 2-3x your annual gross income.",
          "Hidden costs: closing costs (2-5%), property taxes, homeowner's insurance, HOA fees, maintenance (~1%/year).",
          "Always get pre-APPROVAL (not just pre-qualification) before making offers.",
          "First-time buyer programs: HUD, USDA (rural), VA (veterans), state housing agencies often offer grants.",
          "Check current 30-year rates daily — they fluctuate! A 1% rate difference on a $300K loan = $200/month difference.",
        ]}
        curriculum={["Renting vs. Buying: Breaking it Down", "How Mortgages Work", "Saving Your Down Payment", "The Pre-Approval Process", "Hidden Costs of Homeownership"]}
        apis={[
          { api: "FRED Mortgage Rate API", description: "Daily 30-year and 15-year fixed mortgage rates from the Federal Reserve — free, no auth required", url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US" },
          { api: "HUD API", description: "Fair market rent data, affordable housing resources, first-time buyer program info", url: "https://www.hud.gov/program_offices/cio/webAPIs" },
          { api: "Zillow Research (CSV)", description: "Home value indexes and market trends by ZIP code", url: "https://www.zillow.com/research/data/" },
        ]}
      /></div>;

    case "credit":
      return <GoalSection icon="credit" title="Credit & Debt" quizKey="credit" onEarnXP={onEarnXP}
        intro="Your credit score is a financial GPA — it determines the interest rates you pay on everything from car loans to mortgages. Charlotte can help you build and protect it."
        tips={[
          "Tell me: do you know your current credit score? (Credit Karma is free to check!)",
          "Credit score range: 300–850. Good = 670+, Excellent = 740+, Elite = 800+.",
          "Payment history (35%) is most important — set up autopay for at least the minimum.",
          "Credit utilization (30%) — keep balances under 30% of your limit, ideally under 10%.",
          "Debt Avalanche: pay highest interest rate first (saves most money). Debt Snowball: smallest balance first (best for motivation).",
          "AVOID: payday loans (300-400% APR), rent-to-own, buy-here-pay-here car lots.",
          "Build credit with no history: Discover it Secured Card, Capital One Platinum Secured.",
          "Free credit monitoring: AnnualCreditReport.com (free weekly), Credit Karma, Experian.",
        ]}
        curriculum={["Understanding Your Credit Score", "How to Build Credit from Zero", "Debt Avalanche vs. Debt Snowball", "Negotiating with Creditors", "Student Loan Repayment Strategies"]}
        apis={[
          { api: "Experian API", description: "Credit data and score insights (requires partnership/sandbox account)", url: "https://developer.experian.com/" },
          { api: "Credit Karma (unofficial)", description: "Free credit score — recommend users check directly at creditkarma.com", url: "https://www.creditkarma.com" },
        ]}
      />;

    case "investments":
      return <div><StockTicker /><GoalSection icon="investments" title="Investments" quizKey="investments" onEarnXP={onEarnXP}
        intro="Investing grows your money over time through the power of compound interest. Charlotte starts with your foundation before unlocking advanced strategies. Remember: never invest money you can't afford to lose, and this is education — not investment advice."
        tips={[
          "Important question first: do you have a 3-6 month emergency fund and no high-interest debt? That comes before investing.",
          "S&P 500 historical average return: ~10%/year (7% inflation-adjusted). Index funds beat 90% of actively managed funds long-term.",
          "Dollar-cost averaging: invest the same amount every month regardless of market — removes emotion from investing.",
          "Low-cost ETFs: VOO, VTI (Vanguard); FZROX, FXNAX (Fidelity, zero fees); SCHB (Schwab).",
          "Rule of 72: divide 72 by your interest rate = years to double your money. At 7%, money doubles every ~10 years!",
          "Never invest money you'll need in under 5 years — markets can drop 30-40% in a crash.",
          "Consult a fee-only Registered Investment Advisor (RIA) for personalized investment strategy.",
        ]}
        curriculum={["What is a Stock? Bond? ETF?", "The Power of Compound Interest", "Index Funds vs. Actively Managed Funds", "Dollar-Cost Averaging", "Tax-Advantaged Accounts (HSA, IRA, 401k)"]}
        apis={[
          { api: "Alpha Vantage", description: "Real-time stock quotes, S&P 500 data, ETF prices. Free tier: 25 requests/day", url: "https://www.alphavantage.co/documentation/" },
          { api: "Polygon.io", description: "Stock market data, indices, and financial data. Generous free tier.", url: "https://polygon.io/docs/" },
          { api: "Yahoo Finance (yfinance)", description: "Unofficial but widely used for historical stock and index data (Python library)", url: "https://pypi.org/project/yfinance/" },
        ]}
      /></div>;

    case "retirement":
      return <GoalSection icon="retirement" title="Retirement" quizKey="retirement" onEarnXP={onEarnXP}
        intro="Retirement may feel far away, but time is your biggest asset. Starting at 25 instead of 35 can mean hundreds of thousands of extra dollars — Charlotte will show you the math."
        tips={[
          "Quick check: does your employer offer a 401(k) match? If yes — are you contributing enough to get the full match?",
          "401(k) employer match is FREE MONEY. Always contribute enough to get the full match first.",
          "2024 contribution limits: 401(k) = $23,000 / Roth IRA = $7,000 / Catch-up (50+) = extra $7,500.",
          "Roth IRA: tax-free growth, ideal for lower earners. 2024 income limits: under $146K single, $230K married.",
          "$200/month starting at 25 → ~$525,000 at 65 at 7% average return. Wait until 35 → only ~$243,000.",
          "Target Date Funds: automatically shift from aggressive to conservative as you approach retirement — great for beginners.",
          "Social Security: check your estimated benefit at ssa.gov/myaccount.",
        ]}
        curriculum={["How 401(k)s and IRAs Work", "Roth vs. Traditional: Which is Right for You?", "The Power of Starting Early (Compound Interest)", "Target Date Funds Explained", "Social Security 101"]}
        apis={[
          { api: "Social Security Quick Calculator", description: "Estimate Social Security retirement benefits based on earnings history", url: "https://www.ssa.gov/OACT/quickcalc/" },
          { api: "FRED Interest Rate Data", description: "Historical interest rates and inflation data for retirement planning context", url: "https://fred.stlouisfed.org/series/FEDFUNDS" },
          { api: "IRS Retirement Plan Limits", description: "Official 401k, IRA contribution limits updated annually", url: "https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits" },
        ]}
      />;

    case "education-529":
      return <GoalSection icon="education-529" title="529 College Savings" quizKey="education-529" onEarnXP={onEarnXP}
        intro="529 plans are one of the most powerful education savings tools — tax-free growth, now usable for K-12, trade schools, and even rolling into a Roth IRA under new law."
        tips={[
          "Tell me: are you saving for a child, grandchild, or yourself? The strategy changes depending on who the beneficiary is.",
          "529 growth is completely tax-free when used for qualified education expenses (tuition, books, room & board).",
          "NEW (SECURE 2.0 Act, 2022): After 15 years, up to $35,000 of unused 529 funds can roll into a Roth IRA — no more 'what if they don't go to college' fear!",
          "Superfunding: contribute up to $90,000 at once ($45K per spouse) using 5 years of gift tax exclusion.",
          "K-12 expansion: up to $10,000/year can now be used for private K-12 tuition.",
          "Trade schools and apprenticeships: 529s can cover eligible programs — not just 4-year colleges.",
          "Compare state plans at savingforcollege.com — some states offer tax deductions for contributions.",
        ]}
        curriculum={["What is a 529 Plan?", "529 vs. Coverdell ESA vs. UGMA/UTMA", "How to Choose a State Plan", "Investment Options Inside 529s", "SECURE 2.0: The Roth IRA Rollover Provision"]}
        apis={[
          { api: "FINRA 529 Center", description: "Comparison tool for 529 plans across all states — fees, investment options, tax benefits", url: "https://www.finra.org/investors/learn-to-invest/types-investments/saving-for-education/529-savings-plans" },
          { api: "CollegeBoard Cost Trends", description: "Annual college cost data and trends for planning purposes", url: "https://research.collegeboard.org/trends/college-pricing" },
        ]}
      />;

    case "taxes-personal":
      return <GoalSection icon="taxes-personal" title="Personal Taxes" quizKey="taxes-personal" onEarnXP={onEarnXP}
        intro="Taxes don't have to be scary. Charlotte breaks down exactly what you owe, what you can deduct, and — most importantly — how to keep more of your money legally."
        tips={[
          "Quick question: did you file your taxes last year? If you earned income, always file — even if you're not sure you owe. You may be owed money back!",
          "2024 tax brackets are MARGINAL — you only pay each rate on the income in that bracket, not your whole income.",
          "Standard deduction 2024: $14,600 (single), $29,200 (married filing jointly). Only itemize if you exceed this.",
          "EITC: up to $7,830 for qualifying workers — this is REFUNDABLE (you get it even if you owe $0 taxes).",
          "Child Tax Credit: up to $2,000 per qualifying child under 17.",
          "FREE tax filing: IRS Free File (under $79K), MyFreeTaxes.org, VITA sites (Volunteer Income Tax Assistance).",
          "HSA triple advantage: contributions are tax-deductible, grow tax-free, and withdraw tax-free for medical expenses.",
        ]}
        curriculum={["How the Tax Bracket System Works", "Standard vs. Itemized Deductions", "Earned Income Tax Credit (EITC) Deep Dive", "W-4 Optimization: Maximize Your Take-Home Pay", "Free Filing Options (VITA, Free File)"]}
        apis={[
          { api: "IRS Free File Lookup Tool", description: "Find free filing options based on income", url: "https://apps.irs.gov/app/freeFile/" },
          { api: "FRED: Tax Revenue Data", description: "Historical federal tax revenue and policy data", url: "https://fred.stlouisfed.org/release/tables?rid=106&eid=798003" },
          { api: "ProPublica EITC Calculator", description: "Non-profit tool to estimate EITC eligibility", url: "https://projects.propublica.org/graphics/eitc-calculator" },
        ]}
      />;

    case "taxes-business":
      return <GoalSection icon="taxes-business" title="Business Taxes" quizKey="taxes-personal" onEarnXP={onEarnXP}
        intro="Running a business? Your tax situation changes significantly. Charlotte helps you understand business structures, self-employment tax, quarterly payments, and how to deduct legally."
        tips={[
          "Are you freelancing, running a side hustle, or operating a full business? The answer determines your tax structure.",
          "Self-employment tax = 15.3% on net earnings (Social Security + Medicare). You pay both employee AND employer share.",
          "Sole proprietor: report income/expenses on Schedule C — attached to your personal 1040.",
          "LLC doesn't save taxes by itself — it's a legal protection structure. Tax treatment depends on how it's classified.",
          "S-Corporation can reduce self-employment tax by paying yourself a 'reasonable salary' — consult a CPA before electing.",
          "Quarterly estimated taxes: April 15, June 17, Sept 16, Jan 15. Miss these and face underpayment penalties.",
          "Key deductions: home office (exclusive regular use), vehicle (standard mileage or actual costs), equipment (Section 179), health insurance premiums, business meals (50%).",
        ]}
        curriculum={["Sole Prop vs. LLC vs. S-Corp: Choosing Your Structure", "Self-Employment Tax Explained", "Quarterly Estimated Tax Payments", "Top Business Deductions You're Missing", "Hiring a CPA vs. DIY Tax Software"]}
        apis={[
          { api: "IRS Self-Employed Center", description: "Official IRS resources for self-employed individuals and small businesses", url: "https://www.irs.gov/businesses/small-businesses-self-employed" },
          { api: "IRS EIN Application", description: "Free Employer ID Number for business banking and tax purposes", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" },
          { api: "SBA Business Guide", description: "Small Business Administration: licenses, permits, financing, and tax guidance", url: "https://www.sba.gov/business-guide" },
        ]}
      />;

    case "estate-planning":
      return <GoalSection icon="estate-planning" title="Estate Planning" quizKey="investments" onEarnXP={onEarnXP}
        intro="Estate planning isn't just for the wealthy — it's for everyone who has people they love. Charlotte guides you through the essential documents and how to protect your family."
        tips={[
          "Tell me: do you have dependents — a child, spouse, or elderly parent who relies on you financially?",
          "Everyone should have these 4 documents: (1) Will, (2) Healthcare Proxy/Medical Power of Attorney, (3) Durable Power of Attorney (finances), (4) Living Will/Advance Directive.",
          "Beneficiary designations on bank accounts, 401(k)s, IRAs, and life insurance OVERRIDE your will. Review annually.",
          "TOD (Transfer on Death) accounts skip probate entirely — assets transfer directly to named beneficiaries.",
          "Term life insurance: usually the best value for most people. A healthy 30-year-old can get $500K coverage for $20-30/month.",
          "Trusts are useful for: minor beneficiaries, complex families, estate tax planning, or specific distribution wishes.",
          "Low-income legal resources: legal aid societies, law school clinics, and some states offer free basic will preparation.",
        ]}
        curriculum={["The 4 Essential Estate Documents", "How Beneficiary Designations Work", "Term vs. Whole Life Insurance", "Understanding Trusts (and When You Need One)", "Finding Free Legal Help"]}
        apis={[
          { api: "Legal Services Corporation Locator", description: "Find free civil legal aid near you — includes estate planning assistance", url: "https://www.lsc.gov/about-lsc/what-legal-aid/find-legal-aid" },
          { api: "NAIC Life Insurance Policy Locator", description: "Locate lost life insurance policies for deceased family members", url: "https://eapps.naic.org/life-policy-locator/#/" },
        ]}
      />;

    default: return <HomeTab onNavigate={onNavigate} userName={userName} isLoggedIn={isLoggedIn} onAuthSuccess={onAuthSuccess ?? (() => {})} userXP={userXP} budgetSpent={budgetSpent} budgetTotal={budgetTotal} efPct={efPct} flScore={flScore} />;
  }
}

/* ─────────────── MAIN APP ─────────────── */
const LS_KEYS = ["xp", "budgetSpent", "budgetTotal", "efPct", "flScore", "streak", "badges"] as const;

function lsGet(uid: string, key: string): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(uid + "_" + key);
  return v !== null ? Number(v) : 0;
}
function lsSet(uid: string, key: string, val: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(uid + "_" + key, String(val));
}
function lsClear(uid: string) {
  if (typeof window === "undefined") return;
  LS_KEYS.forEach(k => localStorage.removeItem(uid + "_" + k));
}

export default function AIMoneyMentor() {
  const [active, setActive] = useState<SectionId>("home");
  const [disclaimerShown, setDisclaimerShown] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  /* ── User data — all default to 0 (true zero for new accounts) ── */
  const [userXP,       setUserXP]       = useState(0);
  const [budgetSpent,  setBudgetSpent]  = useState(0);
  const [budgetTotal,  setBudgetTotal]  = useState(0);
  const [efPct,        setEfPct]        = useState(0);
  const [flScore,      setFlScore]      = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [badgeCount,   setBadgeCount]   = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  /* ── Load user data from localStorage and sync from API when user changes ── */
  useEffect(() => {
    if (!user?.id) {
      if (typeof window !== "undefined") {
        const gXp = Number(localStorage.getItem("aimm_guest_xp") || "0");
        setUserXP(gXp);
      } else {
        setUserXP(0);
      }
      setBudgetSpent(0); setBudgetTotal(0);
      setEfPct(0); setFlScore(0); setStreak(0); setBadgeCount(0);
      return;
    }
    const uid = user.id;
    const localXp = lsGet(uid, "xp");
    setUserXP(localXp);
    setBudgetSpent(lsGet(uid, "budgetSpent"));
    setBudgetTotal(lsGet(uid, "budgetTotal"));
    setEfPct(lsGet(uid, "efPct"));
    setFlScore(lsGet(uid, "flScore"));
    setStreak(lsGet(uid, "streak"));
    setBadgeCount(lsGet(uid, "badges"));

    // Sync from server /api/progress
    fetch("/api/progress")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.profile?.total_xp !== undefined && data.profile.total_xp !== null) {
          const serverXp = Math.max(localXp, Number(data.profile.total_xp));
          setUserXP(serverXp);
          lsSet(uid, "xp", serverXp);
        }
        if (data?.profile?.current_streak !== undefined && data.profile.current_streak !== null) {
          const s = Number(data.profile.current_streak);
          setStreak(s);
          lsSet(uid, "streak", s);
        }
      })
      .catch(err => console.error("Error fetching progress from API:", err));
  }, [user?.id]);

  /* ── Persist XP changes to localStorage ── */
  useEffect(() => {
    if (user?.id) lsSet(user.id, "xp", userXP);
  }, [userXP, user?.id]);

  // Check existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "there";
        setUser({ id: session.user.id, name, email: session.user.email ?? "" });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "there";
        setUser({ id: session.user.id, name, email: session.user.email ?? "" });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { mainRef.current?.scrollTo(0, 0); }, [active]);

  const navigate = (id: SectionId) => { setActive(id); setSidebarOpen(false); };

  const handleEarnXP = async (amount: number, sectionKey: string) => {
    setUserXP(prev => {
      const next = prev + amount;
      if (user?.id) lsSet(user.id, "xp", next);
      else if (typeof window !== "undefined") localStorage.setItem("aimm_guest_xp", String(next));
      return next;
    });

    if (user?.id) {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "quiz",
            payload: { section_key: sectionKey, correct: true, xp_earned: amount, question_idx: 0 }
          }),
        });
      } catch (err) {
        console.error("Failed to sync XP to API:", err);
      }
    }
  };

  async function signOut() {
    if (user?.id) lsClear(user.id);
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${C.sage}; color: ${C.text}; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        button:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
        input:focus { border-color: ${C.forest} !important; box-shadow: 0 0 0 2px rgba(26,92,53,0.1); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.sageMid}; border-radius: 2px; }

        /* ── DESKTOP layout ── */
        .app-shell {
          display: flex;
          min-height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
        }
        /* Desktop sidebar */
        .sidebar {
          width: 240px;
          flex-shrink: 0;
          background: ${C.sidebar};
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .sidebar-logo { padding: 20px 16px 16px; border-bottom: 1px solid rgba(201,169,78,0.2); }
        .sidebar-group-label { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(200,217,168,0.4); padding: 16px 16px 6px; }
        .sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 16px; cursor: pointer;
          color: ${C.sageMid}; font-size: 13.5px; font-weight: 500;
          border-left: 3px solid transparent;
          transition: all 0.15s;
        }
        .sidebar-item:hover { background: rgba(255,255,255,0.05); color: white; }
        .sidebar-item.active { background: rgba(201,169,78,0.1); border-left-color: ${C.gold}; color: ${C.goldLight}; }
        .sidebar-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }

        /* Main content area */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: ${C.white};
          overflow: hidden;
        }
        .mobile-topbar {
          background: ${C.forestDeep};
          padding: 12px 16px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .content-scroll { flex: 1; overflow-y: auto; }
        .bottom-nav-mobile {
          background: ${C.forestDeep};
          display: flex;
          border-top: 1px solid rgba(201,169,78,0.25);
          position: sticky; bottom: 0; z-index: 100;
        }
        .bottom-nav-btn {
          flex: 1; padding: 10px 2px 7px;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          background: transparent; border: none; cursor: pointer; transition: background 0.15s;
        }
        .bottom-nav-btn.active { background: rgba(201,169,78,0.15); }
        .bottom-nav-icon { font-size: 18px; }
        .bottom-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 0.3px; color: ${C.sageMid}; font-family: 'DM Sans', sans-serif; }
        .bottom-nav-btn.active .bottom-nav-label { color: ${C.goldLight}; }

        /* Mobile overlay sidebar */
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.5);
        }
        .sidebar-drawer {
          width: 260px; height: 100%;
          background: ${C.sidebar};
          overflow-y: auto;
          position: absolute; left: 0; top: 0;
          box-shadow: 4px 0 20px rgba(0,0,0,0.3);
        }
        .sidebar-overlay.open { display: block; }

        /* Hide mobile elements on desktop */
        @media (min-width: 800px) {
          .mobile-topbar { display: none; }
          .bottom-nav-mobile { display: none; }
          .sidebar-overlay { display: none !important; }
          .app-shell { box-shadow: 0 0 60px rgba(0,0,0,0.1); }
        }
        /* Hide sidebar on mobile */
        @media (max-width: 799px) {
          .sidebar { display: none; }
          .app-shell { max-width: 480px; }
        }
      `}</style>

      <div className="app-shell">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <CharlotteLogo size={54} showText={true} dark={true} />
          </div>
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map(item => (
                <div key={item.id} className={`sidebar-item${active === item.id ? " active" : ""}`}
                  onClick={() => navigate(item.id)}>
                  <span className="sidebar-icon"><NavIcon id={item.id} size={17} color={active === item.id ? C.goldLight : "rgba(200,217,168,0.65)"} /></span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "16px", borderTop: `1px solid rgba(201,169,78,0.15)` }}>
            {user ? (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.forestMid}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", border: `2px solid ${C.gold}`, flexShrink: 0 }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.goldLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(200,217,168,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                  </div>
                </div>
                <button onClick={signOut} style={{ width: "100%", padding: "7px", background: "rgba(201,169,78,0.12)", border: `1px solid rgba(201,169,78,0.2)`, borderRadius: 9, color: C.sageMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ width: "100%", padding: "9px", background: C.gold, border: "none", borderRadius: 10, color: C.forestDeep, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginBottom: 10 }}>
                Sign In / Create Account
              </button>
            )}
            <div style={{ fontSize: 10.5, color: "rgba(200,217,168,0.4)", lineHeight: 1.5 }}>
              ⚠️ Educational purposes only. Not licensed financial advice. Consult a professional for major decisions.
            </div>
          </div>
        </aside>

        {/* ── MOBILE DRAWER ── */}
        <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid rgba(201,169,78,0.2)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CharlotteLogo size={32} showText={true} dark={true} />
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.sageMid, padding: 4, display:"flex" }}><NavIcon id="close" size={20} color={C.sageMid} /></button>
            </div>
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <div className="sidebar-group-label">{group.label}</div>
                {group.items.map(item => (
                  <div key={item.id} className={`sidebar-item${active === item.id ? " active" : ""}`}
                    onClick={() => navigate(item.id)}>
                    <span className="sidebar-icon"><NavIcon id={item.id} size={17} color={active === item.id ? C.goldLight : "rgba(200,217,168,0.65)"} /></span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="main-content">
          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.sageMid, display: "flex", alignItems: "center", padding: 4 }}><NavIcon id="menu" size={22} color={C.sageMid} /></button>
            <CharlotteLogo size={28} showText={true} dark={true} />
            {user ? (
              <button onClick={signOut} title="Sign out" style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.forestMid}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "white", border: `2px solid ${C.gold}`, cursor: "pointer" }}>
                {user.name[0].toUpperCase()}
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ padding: "5px 10px", background: C.gold, color: C.forestDeep, border: "none", borderRadius: 14, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                Sign In
              </button>
            )}
          </div>

          {/* Disclaimer */}
          {disclaimerShown && <Disclaimer onDismiss={() => setDisclaimerShown(false)} />}

          {/* Section content */}
          <div className="content-scroll fade-in" ref={mainRef} key={active}
            style={{ display: "flex", flexDirection: "column", ...(active === "charlotte" ? { height: "calc(100vh - 110px)", overflow: "hidden" } : {}) }}>
            {renderSection(
              active,
              navigate,
              active,
              !!user,
              user?.name,
              (id, name, email) => { setUser({ id, name, email }); },
              userXP,
              budgetSpent,
              budgetTotal,
              efPct,
              flScore,
              streak,
              badgeCount,
              handleEarnXP
            )}
          </div>

          {/* Mobile bottom nav */}
          <nav className="bottom-nav-mobile">
            {MOBILE_BOTTOM.map(item => (
              <button key={item.id} className={`bottom-nav-btn${active === item.id ? " active" : ""}`}
                onClick={() => navigate(item.id)}>
                <span className="bottom-nav-icon"><NavIcon id={item.id} size={22} color={active === item.id ? C.goldLight : C.sageMid} /></span>
                <span className="bottom-nav-label">{item.short}</span>
              </button>
            ))}
            <button className={`bottom-nav-btn${NAV_GROUPS[1].items.some(i => i.id === active) ? " active" : ""}`} onClick={() => setSidebarOpen(true)}>
              <span className="bottom-nav-icon"><NavIcon id="more" size={22} color={NAV_GROUPS[1].items.some(i => i.id === active) ? C.goldLight : C.sageMid} /></span>
              <span className="bottom-nav-label">More</span>
            </button>
          </nav>
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(id, name, email) => { setUser({ id, name, email }); setShowAuth(false); }}
        />
      )}
    </>
  );
}

"use client";
import { useState, useEffect } from "react";

const C = { forest: "#1a5c35", forestDeep: "#0e3d22", gold: "#c9a94e", goldLight: "#e8c97a", sageMid: "#c8d9a8", white: "#fafdf5", cardBg: "#f0f7e6", border: "#d5e8c0", text: "#0e2d1a", textLight: "#3a6b4a", textMuted: "#6b9a7a", blue: "#1a56a0" };

const CATEGORIES = [
  { key: "thrift",       label: "Thrift & Secondhand", icon: "👗", color: "#7b2fbe" },
  { key: "food",         label: "Food Savings",        icon: "🍱", color: "#2d7a4a" },
  { key: "coupon",       label: "Coupons & Cashback",  icon: "🏷️", color: "#c9a94e" },
  { key: "credit_union", label: "Credit Unions",       icon: "🏦", color: "#1a5c35" },
  { key: "savings",      label: "Savings Tools",       icon: "💰", color: "#1a56a0" },
  { key: "government",   label: "Benefits & Aid",      icon: "🏛️", color: "#c0392b" },
  { key: "education",    label: "Education",           icon: "📚", color: "#0e3d22" },
  { key: "calculator",   label: "Calculators",         icon: "🧮", color: "#5a9a6a" },
  { key: "other",        label: "Other",               icon: "🔗", color: "#6b9a7a" },
];

/* Curated starter links Charlotte recommends */
const CHARLOTTE_PICKS = [
  { title: "Too Good To Go — Save on restaurant surplus meals", url: "https://www.toogoodtogo.com", category: "food", notes: "App to buy leftover restaurant/bakery food for $3-6. 50-70% off." },
  { title: "ThredUp — Online consignment clothing", url: "https://www.thredup.com", category: "thrift", notes: "Buy & sell women's and kids' clothes secondhand. 90% off retail." },
  { title: "Facebook Marketplace", url: "https://www.facebook.com/marketplace", category: "thrift", notes: "Furniture, appliances, electronics — local pickup, no shipping." },
  { title: "Ibotta — Grocery cashback app", url: "https://ibotta.com", category: "coupon", notes: "Earn $5-40/month cashback on groceries at major stores." },
  { title: "Rakuten — Online shopping cashback", url: "https://www.rakuten.com", category: "coupon", notes: "Browser extension. Auto-applies cashback at 3,500+ online stores." },
  { title: "Find a Credit Union Near You", url: "https://www.mycreditunion.gov/about-credit-unions/credit-union-locator", category: "credit_union", notes: "Find a community credit union — better rates, fewer fees than big banks." },
  { title: "IRS Free File — Free tax filing", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", category: "government", notes: "Free federal tax filing if your income is under $79,000." },
  { title: "AnnualCreditReport.com — Free credit reports", url: "https://www.annualcreditreport.com", category: "savings", notes: "Get your free credit report weekly from all 3 bureaus. Official site." },
  { title: "Benefits.gov — Find government benefits", url: "https://www.benefits.gov", category: "government", notes: "Search all federal benefits programs — SNAP, WIC, CHIP, housing and more." },
  { title: "NerdWallet HYSA Comparison", url: "https://www.nerdwallet.com/best/banking/high-yield-online-savings-accounts", category: "savings", notes: "Compare high-yield savings accounts earning 4-5% APY." },
  { title: "Habitat for Humanity ReStore", url: "https://www.habitat.org/restores", category: "thrift", notes: "Deeply discounted furniture, appliances, building materials. Proceeds support Habitat." },
  { title: "211.org — Local emergency resources", url: "https://www.211.org", category: "government", notes: "Connects you to local food, utilities, housing, and childcare assistance. Free hotline." },
  { title: "Compound Interest Calculator", url: "https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator", category: "calculator", notes: "See how your savings grow over time. From the SEC." },
  { title: "Fastweb — Scholarship search", url: "https://www.fastweb.com", category: "education", notes: "Free scholarship search — millions in funding for college and grad school." },
  { title: "NFCC — Free nonprofit credit counseling", url: "https://www.nfcc.org", category: "savings", notes: "Free or low-cost credit counseling from nonprofit agencies nationwide." },
];

type Link = { id?: string; title: string; url: string; category: string; notes: string; is_favorite?: boolean };

function LinkCard({ link, onDelete, onFavorite }: { link: Link; onDelete: (id: string) => void; onFavorite: (id: string) => void }) {
  const cat = CATEGORIES.find(c => c.key === link.category) ?? CATEGORIES[CATEGORIES.length - 1];
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={link.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 13, color: C.blue, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {link.title}
        </a>
        {link.notes && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{link.notes}</div>}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, background: `${cat.color}14`, padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 600, color: cat.color }}>
          {cat.icon} {cat.label}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {link.id && <button onClick={() => link.id && onFavorite(link.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: link.is_favorite ? 1 : 0.3 }} title="Favorite">⭐</button>}
        {link.id && <button onClick={() => link.id && onDelete(link.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textMuted }} title="Remove">✕</button>}
      </div>
    </div>
  );
}

export default function LinksSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [myLinks, setMyLinks] = useState<Link[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCat, setNewCat] = useState("other");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      loadLinks();
    } else {
      try {
        const local = localStorage.getItem("aimm_guest_links");
        if (local) setMyLinks(JSON.parse(local));
      } catch { /* ignore parse error */ }
    }
  }, [isLoggedIn]);

  function persistGuestLinks(updated: Link[]) {
    try {
      localStorage.setItem("aimm_guest_links", JSON.stringify(updated));
    } catch { /* ignore storage error */ }
  }

  async function loadLinks() {
    const res = await fetch("/api/links");
    if (res.ok) { const d = await res.json(); setMyLinks(d.links ?? []); }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    const link = { title: newTitle, url: newUrl.startsWith("http") ? newUrl : `https://${newUrl}`, category: newCat, notes: newNotes, is_favorite: false };
    if (isLoggedIn) {
      const res = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(link) });
      if (res.ok) { const d = await res.json(); setMyLinks(prev => [d.link, ...prev]); }
    } else {
      const newLink: Link = { ...link, id: `local-${Date.now()}` };
      const updated = [newLink, ...myLinks];
      setMyLinks(updated);
      persistGuestLinks(updated);
    }
    setNewTitle(""); setNewUrl(""); setNewNotes(""); setShowForm(false);
  }

  async function deleteLink(id: string) {
    if (isLoggedIn) await fetch("/api/links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const updated = myLinks.filter(l => l.id !== id);
    setMyLinks(updated);
    if (!isLoggedIn) persistGuestLinks(updated);
  }

  function toggleFavorite(id: string) {
    const updated = myLinks.map(l => l.id === id ? { ...l, is_favorite: !l.is_favorite } : l);
    setMyLinks(updated);
    if (!isLoggedIn) persistGuestLinks(updated);
  }

  const charlottePicks = filterCat === "all" ? CHARLOTTE_PICKS : CHARLOTTE_PICKS.filter(l => l.category === filterCat);
  const userLinks = filterCat === "all" ? myLinks : myLinks.filter(l => l.category === filterCat);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#f5faf0", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "DM Sans, sans-serif", color: C.text, outline: "none" };

  return (
    <div>
      <div style={{ background: `linear-gradient(160deg, #0e3d22, #1a5c35, #2d7a4a)`, padding: "24px 20px 28px" }}>
        <div style={{ color: "#c8d9a8", fontSize: 12, marginBottom: 3 }}>Resources</div>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 22, fontWeight: 700 }}>🔗 My Resource Links</div>
        <div style={{ color: "#c8d9a8", fontSize: 12, marginTop: 4 }}>Charlotte's picks + your saved links — all in one place</div>
      </div>

      <div style={{ padding: "14px 18px 0" }}>
        {/* Category filter */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 10, marginBottom: 10 }}>
          <button onClick={() => setFilterCat("all")} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, border: `1px solid ${filterCat === "all" ? C.forest : C.border}`, background: filterCat === "all" ? C.forest : C.cardBg, color: filterCat === "all" ? "white" : C.textLight, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            All
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setFilterCat(cat.key)} style={{ flexShrink: 0, padding: "6px 11px", borderRadius: 20, border: `1px solid ${filterCat === cat.key ? cat.color : C.border}`, background: filterCat === cat.key ? `${cat.color}18` : C.cardBg, color: filterCat === cat.key ? cat.color : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Add link form */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{ width: "100%", padding: "12px", background: C.forest, color: "white", border: "none", borderRadius: 12, fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            ➕ Save a Link
          </button>
        ) : (
          <form onSubmit={addLink} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14, display: "grid", gap: 9 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.forestDeep, marginBottom: 2 }}>Save a Link</div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title (e.g. My Credit Union)" required style={inputStyle} />
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (e.g. mycu.org)" required style={inputStyle} />
            <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ ...inputStyle }}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
            <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={{ flex: 1, padding: "10px", background: C.forest, color: "white", border: "none", borderRadius: 10, fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 15px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: "DM Sans, sans-serif", fontSize: 13, cursor: "pointer", color: C.textLight }}>Cancel</button>
            </div>
          </form>
        )}

        {/* User's saved links */}
        {userLinks.length > 0 && (
          <>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.forestDeep, marginBottom: 9, display: "flex", alignItems: "center", gap: 7 }}>📁 My Saved Links <span style={{ background: C.gold, color: C.forestDeep, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>{userLinks.length}</span></div>
            {userLinks.map(l => <LinkCard key={l.id} link={l} onDelete={deleteLink} onFavorite={toggleFavorite} />)}
          </>
        )}

        {/* Charlotte's recommended links */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.forestDeep, margin: "16px 0 9px", display: "flex", alignItems: "center", gap: 7 }}>
          ✨ Charlotte's Picks
          <span style={{ background: C.forestDeep, color: C.goldLight, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>Curated</span>
        </div>
        {charlottePicks.map(l => <LinkCard key={l.url} link={l} onDelete={() => {}} onFavorite={() => {}} />)}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

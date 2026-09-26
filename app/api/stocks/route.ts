import { NextResponse } from "next/server";

const ALPHA_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const SYMBOLS = [
  { symbol: "SPY",  label: "S&P 500 ETF" },
  { symbol: "VOO",  label: "Vanguard S&P 500" },
  { symbol: "VTI",  label: "Total Market" },
  { symbol: "QQQ",  label: "Nasdaq-100" },
];

type QuoteData = {
  symbol: string;
  label: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
};

// In-memory cache — survives within the same warm function instance
let cache: { data: QuoteData[]; ts: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 minutes

async function fetchQuote(symbol: string, label: string): Promise<QuoteData | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  const json = await res.json();
  const q = json["Global Quote"];
  if (!q || !q["05. price"]) return null;

  const change = parseFloat(q["09. change"] ?? "0");
  const pct = parseFloat((q["10. change percent"] ?? "0%").replace("%", ""));

  return {
    symbol,
    label,
    price: parseFloat(q["05. price"]).toFixed(2),
    change: (change >= 0 ? "+" : "") + change.toFixed(2),
    changePercent: (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%",
    isPositive: change >= 0,
  };
}

const FALLBACK_QUOTES: QuoteData[] = [
  { symbol: "SPY", label: "S&P 500 ETF", price: "575.20", change: "+4.10", changePercent: "+0.72%", isPositive: true },
  { symbol: "VOO", label: "Vanguard S&P 500", price: "528.45", change: "+3.75", changePercent: "+0.71%", isPositive: true },
  { symbol: "VTI", label: "Total Market", price: "282.10", change: "+1.90", changePercent: "+0.68%", isPositive: true },
  { symbol: "QQQ", label: "Nasdaq-100", price: "492.30", change: "+5.40", changePercent: "+1.11%", isPositive: true },
];

export async function GET() {
  if (!ALPHA_KEY) {
    return NextResponse.json({ quotes: FALLBACK_QUOTES, cached: false, ts: Date.now(), isFallback: true });
  }

  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ quotes: cache.data, cached: true, ts: cache.ts });
  }

  try {
    const results = await Promise.all(SYMBOLS.map(s => fetchQuote(s.symbol, s.label)));
    const quotes = results.filter(Boolean) as QuoteData[];
    if (quotes.length === 0) {
      return NextResponse.json({ quotes: FALLBACK_QUOTES, cached: false, ts: Date.now(), isFallback: true });
    }
    cache = { data: quotes, ts: Date.now() };
    return NextResponse.json({ quotes, cached: false, ts: cache.ts });
  } catch {
    return NextResponse.json({ quotes: FALLBACK_QUOTES, cached: false, ts: Date.now(), isFallback: true });
  }
}

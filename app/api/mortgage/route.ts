import { NextResponse } from "next/server";

// FRED free CSV endpoint — no API key needed
// MORTGAGE30US = weekly 30-year fixed rate, MORTGAGE15US = 15-year fixed
const FRED_30 = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US";
const FRED_15 = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE15US";

let cache: { rate30: string; rate15: string; asOf: string; ts: number } | null = null;
const TTL = 60 * 60 * 1000; // 1 hour (data only updates weekly)

function parseLatestRate(csv: string): { rate: string; date: string } {
  const lines = csv.replace(/\r/g, "").trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const parts = lines[i].split(",");
    if (parts.length >= 2) {
      const date = parts[0]?.trim();
      const rate = parts[1]?.trim();
      if (date && rate && rate !== "." && !isNaN(Number(rate))) {
        return { date, rate };
      }
    }
  }
  return { date: "Recent", rate: "6.50" };
}

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ ...cache, cached: true });
  }

  try {
    const [res30, res15] = await Promise.all([
      fetch(FRED_30, { next: { revalidate: 3600 } }),
      fetch(FRED_15, { next: { revalidate: 3600 } }),
    ]);

    const [csv30, csv15] = await Promise.all([res30.text(), res15.text()]);
    const { rate: rate30, date: asOf } = parseLatestRate(csv30);
    const { rate: rate15 } = parseLatestRate(csv15);

    cache = { rate30, rate15, asOf, ts: Date.now() };
    return NextResponse.json({ rate30, rate15, asOf, cached: false });
  } catch {
    return NextResponse.json({ error: "Failed to fetch mortgage rates" }, { status: 500 });
  }
}

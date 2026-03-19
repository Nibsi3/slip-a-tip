import { NextResponse } from "next/server";

// Static fallback — covers all major SA banks used for EFT.
// Used when the live Paystack fetch is unavailable or the key is not configured.
const SA_BANKS_FALLBACK: { name: string; code: string }[] = [
  { name: "Absa Bank", code: "632005" },
  { name: "African Bank", code: "430000" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Discovery Bank", code: "679000" },
  { name: "First National Bank (FNB)", code: "250655" },
  { name: "Grindrod Bank", code: "584000" },
  { name: "Investec Bank", code: "580105" },
  { name: "Nedbank", code: "198765" },
  { name: "Old Mutual Bank", code: "642005" },
  { name: "Sasfin Bank", code: "683000" },
  { name: "Standard Bank", code: "051001" },
  { name: "TymeBank", code: "678910" },
  { name: "Ubank", code: "431010" },
  { name: "Bank Zero", code: "888000" },
];

let cachedBanks: { name: string; code: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchSABanks(): Promise<{ name: string; code: string }[]> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return SA_BANKS_FALLBACK;
  try {
    const res = await fetch("https://api.paystack.co/bank?country=south_africa&perPage=100", {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return SA_BANKS_FALLBACK;
    const json = await res.json();
    const banks = (json.data as { name: string; code: string }[]) || [];
    return banks.length > 0 ? banks : SA_BANKS_FALLBACK;
  } catch {
    return SA_BANKS_FALLBACK;
  }
}

export async function GET() {
  const now = Date.now();
  if (cachedBanks && now - cacheTime < CACHE_TTL_MS) {
    return NextResponse.json({ banks: cachedBanks });
  }

  const banks = await fetchSABanks();
  cachedBanks = banks;
  cacheTime = now;
  return NextResponse.json({ banks });
}

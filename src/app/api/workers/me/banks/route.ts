import { NextResponse } from "next/server";

// Static SA bank list used for EFT withdrawals.
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

export async function GET() {
  return NextResponse.json({ banks: SA_BANKS_FALLBACK });
}

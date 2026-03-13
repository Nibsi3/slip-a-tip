"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";

const TIP_AMOUNTS = [15, 30, 50, 75, 100, 200];
const MIN_TIP = 15;
const MAX_TIP = 5000;
const TOTAL_FEE_RATE = 0.10;

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface WorkerInfo {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  employerName?: string;
  qrCode: string;
}

type Step = "select" | "loading" | "open";

export default function TipPage() {
  const params = useParams();
  const code = params.code as string;

  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");

  const tipAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount || 0;

  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await fetch(`/api/tips/${code}`);
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Worker not found");
        }
        const d = await res.json();
        setWorker(d.worker);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setPageLoading(false);
      }
    }
    loadWorker();
  }, [code]);

  function handleAmountSelect(amt: number) {
    setSelectedAmount(amt);
    setCustomAmount("");
  }

  function handleCustomAmount(val: string) {
    setCustomAmount(val);
    setSelectedAmount(null);
  }

  async function handleTip(e: FormEvent) {
    e.preventDefault();
    if (tipAmount < MIN_TIP || tipAmount > MAX_TIP) return;
    setStep("loading");
    setError("");

    try {
      const res = await fetch("/api/tips/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: code, amount: tipAmount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment link");

      setWhatsappUrl(data.whatsappUrl);
      setPaymentLinkUrl(data.paymentLinkUrl);
      setStep("open");

      // Immediately redirect to WhatsApp
      window.location.href = data.whatsappUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("select");
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="card text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-gray-900">Oops!</h1>
          <p className="mt-2 text-gray-500">{error}</p>
          <p className="mt-4 text-sm text-gray-400">This QR code may be invalid or the worker is no longer active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-center px-6 pt-8 pb-2">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Slip a Tip" className="h-6 w-6 object-contain" />
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Slip a Tip</span>
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8 pt-4">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl overflow-hidden bg-white ring-1 ring-gray-100 shadow-xl shadow-gray-200/60">

            {/* Worker avatar + name */}
            <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden bg-gradient-to-b from-green-50 to-white">
              <div className="relative">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-green-100 ring-2 ring-green-200 flex items-center justify-center text-3xl font-extrabold text-green-700">
                  {worker?.firstName?.charAt(0)}{worker?.lastName?.charAt(0)}
                </div>
                <h1 className="mt-4 text-xl font-extrabold text-gray-900 tracking-tight">
                  {worker?.firstName} {worker?.lastName}
                </h1>
                {worker?.jobTitle && <p className="mt-1 text-sm text-gray-500">{worker.jobTitle}</p>}
                {worker?.employerName && <p className="text-xs text-gray-400 mt-0.5">{worker.employerName}</p>}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* ── SELECT AMOUNT ── */}
            {step === "select" && (
              <form onSubmit={handleTip} className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Select tip amount</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIP_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAmountSelect(amt)}
                        className={`py-3.5 text-center font-bold text-base rounded-xl transition-all duration-150 ${
                          selectedAmount === amt
                            ? "text-white bg-[#25d366] scale-[1.03] ring-1 ring-[#1da851]"
                            : "text-gray-600 bg-gray-50 ring-1 ring-gray-100 hover:ring-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        R{amt}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_TIP}
                      max={MAX_TIP}
                      placeholder="Custom amount (R15–R5000)"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none focus:ring-2 focus:ring-[#25d366]/40 border border-gray-200"
                    />
                  </div>
                </div>

                {tipAmount >= MIN_TIP && (
                  <div className="rounded-xl p-3 space-y-1.5 bg-gray-50 ring-1 ring-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Fee breakdown</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Tip amount</span>
                      <span className="text-gray-700">R{tipAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total fee (10%)</span>
                      <span className="text-gray-700">−R{(tipAmount * TOTAL_FEE_RATE).toFixed(2)}</span>
                    </div>
                    <div className="h-px my-1 bg-gray-200" />
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-500">{worker?.firstName} receives</span>
                      <span className="text-green-600">R{(tipAmount * (1 - TOTAL_FEE_RATE)).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Includes payment processing + Slip a Tip platform fee.</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={tipAmount < MIN_TIP || tipAmount > MAX_TIP}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
                  style={{
                    background: tipAmount >= MIN_TIP ? "linear-gradient(180deg, #25d366 0%, #1da851 100%)" : "#e5e7eb",
                    color: tipAmount >= MIN_TIP ? "#fff" : "#9ca3af",
                  }}
                >
                  {tipAmount >= MIN_TIP ? <>{WA_ICON} Tip via WhatsApp</> : "Select an amount to continue"}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p className="text-center text-[11px] text-gray-400">Secured by Stitch · Bank-grade encryption</p>
                </div>
              </form>
            )}

            {/* ── LOADING / GENERATING LINK ── */}
            {step === "loading" && (
              <div className="p-8 flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="animate-spin w-8 h-8 text-[#25d366]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">Creating your payment link…</p>
                  <p className="text-xs text-gray-400 mt-1">Opening WhatsApp in a moment</p>
                </div>
              </div>
            )}

            {/* ── WHATSAPP OPENED ── */}
            {step === "open" && (
              <div className="p-6 text-center space-y-5">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-[#25d366]">
                  {WA_ICON}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">WhatsApp opened!</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Your payment link for <span className="text-[#25d366] font-semibold">R{tipAmount.toFixed(2)}</span> is ready in WhatsApp.
                    Just tap <strong className="text-gray-700">Send</strong> — you can pay anytime within 24 hours.
                  </p>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 text-white"
                    style={{ background: "linear-gradient(180deg, #25d366 0%, #1da851 100%)" }}
                  >
                    {WA_ICON} Open WhatsApp again
                  </a>
                )}

                {paymentLinkUrl && (
                  <a
                    href={paymentLinkUrl}
                    className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 bg-gray-50 ring-1 ring-gray-100 transition-colors"
                  >
                    Pay directly instead →
                  </a>
                )}

                <p className="text-[10px] text-gray-400">
                  {worker?.firstName} will be notified the moment you pay. Thank you! 🙏
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

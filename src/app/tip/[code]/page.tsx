"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

const TIP_AMOUNTS = [15, 30, 50, 75, 100, 200];
const MIN_TIP = 15;
const MAX_TIP = 5000;

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
  const [step, setStep] = useState<Step>("select");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");

  const tipAmount = selectedAmount || 0;

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

      // Immediately open WhatsApp
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
          <img src="/logo/11.png" alt="Slip a Tip" className="h-6 w-6 object-contain" />
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Slip a Tip</span>
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8 pt-4">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl overflow-hidden bg-white ring-1 ring-gray-100 shadow-xl shadow-gray-200/60">

            {/* Worker avatar + name — lotus wallpaper header */}
            <div
              className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
              style={{
                backgroundImage: "url('/logo/Pink Circle Lotus Yoga Instructor Logo(1).png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
              <div className="relative">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-white/90 ring-2 ring-white/60 shadow-lg flex items-center justify-center text-3xl font-extrabold text-green-700">
                  {worker?.firstName?.charAt(0)}{worker?.lastName?.charAt(0)}
                </div>
                <h1 className="mt-4 text-xl font-extrabold text-gray-900 tracking-tight">
                  {worker?.firstName} {worker?.lastName}
                </h1>
                {worker?.jobTitle && <p className="mt-1 text-sm text-gray-600">{worker.jobTitle}</p>}
                {worker?.employerName && <p className="text-xs text-gray-500 mt-0.5">{worker.employerName}</p>}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* ── SELECT AMOUNT ── */}
            {step === "select" && (
              <form onSubmit={handleTip} className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Choose an amount</p>
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
                </div>

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
                  {tipAmount >= MIN_TIP ? (
                    <>
                      <Image src="/icons/Payment.png" alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                      Tip via WhatsApp
                    </>
                  ) : "Select an amount to continue"}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <Image src="/icons/Card.png" alt="" width={14} height={14} className="w-3.5 h-3.5 object-contain opacity-40" />
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
                <div className="mx-auto w-16 h-16 rounded-full bg-green-50 ring-1 ring-green-100 flex items-center justify-center">
                  <Image src="/icons/Payment.png" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
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
                    <Image src="/icons/Payment.png" alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                    Open WhatsApp again
                  </a>
                )}

                {paymentLinkUrl && (
                  <a
                    href={paymentLinkUrl}
                    className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 bg-gray-50 ring-1 ring-gray-100 transition-colors"
                  >
                    <Image src="/icons/Card.png" alt="" width={16} height={16} className="w-4 h-4 object-contain opacity-60" />
                    Pay directly instead
                  </a>
                )}

                <p className="text-[10px] text-gray-400">
                  {worker?.firstName} will be notified the moment you pay.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

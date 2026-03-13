"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";

const TIP_AMOUNTS = [15, 30, 50, 75, 100, 200];
const MIN_TIP = 15;
const MAX_TIP = 5000;
const TOTAL_FEE_RATE = 0.10;

interface WorkerInfo {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  employerName?: string;
  qrCode: string;
}

type Step = "select" | "phone" | "sent";

export default function TipPage() {
  const params = useParams();
  const code = params.code as string;

  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        setLoading(false);
      }
    }
    loadWorker();
  }, [code]);

  function handleAmountSelect(amt: number) {
    if (submitting) return;
    setSelectedAmount(amt);
    setCustomAmount("");
  }

  function handleCustomAmount(val: string) {
    setCustomAmount(val);
    setSelectedAmount(null);
  }

  function handleContinue(e: FormEvent) {
    e.preventDefault();
    if (tipAmount < MIN_TIP || tipAmount > MAX_TIP) return;
    setStep("phone");
    setError("");
  }

  async function handleSendWhatsApp(e: FormEvent) {
    e.preventDefault();
    if (!phone || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tips/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: code,
          amount: tipAmount,
          customerPhone: phone,
          customerName: customerName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send payment link");
      }

      setStep("sent");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030306" }}>
        <div className="animate-pulse text-white/40 text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#030306" }}>
        <div className="card text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-white">Oops!</h1>
          <p className="mt-2 text-muted">{error}</p>
          <p className="mt-4 text-sm text-muted-300">
            This QR code may be invalid or the worker is no longer active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030306" }}>
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,211,102,0.07) 0%, transparent 60%)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-center px-6 pt-8 pb-2">
        <div className="flex items-center gap-2 opacity-60">
          <img src="/logo.png" alt="Slip a Tip" className="h-6 w-6 object-contain" />
          <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">slip a tip</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-8 pt-4">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl overflow-hidden ring-1 ring-white/[0.09]" style={{ background: "rgba(8,8,14,0.95)", backdropFilter: "blur(24px)" }}>

            {/* Worker info */}
            <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 120% at 50% 0%, rgba(37,211,102,0.08) 0%, transparent 70%)" }} />
              <div className="relative">
                <div className="mx-auto w-20 h-20 rounded-2xl ring-2 ring-white/10 flex items-center justify-center text-3xl font-extrabold text-white" style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.2), rgba(37,211,102,0.05))" }}>
                  {worker?.firstName?.charAt(0)}{worker?.lastName?.charAt(0)}
                </div>
                <h1 className="mt-4 text-xl font-extrabold text-white tracking-tight">
                  {worker?.firstName} {worker?.lastName}
                </h1>
                {worker?.jobTitle && (
                  <p className="mt-1 text-sm text-white/50">{worker.jobTitle}</p>
                )}
                {worker?.employerName && (
                  <p className="text-xs text-white/35 mt-0.5">{worker.employerName}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* ── STEP 1: Select amount ── */}
            {step === "select" && (
              <form onSubmit={handleContinue} className="p-5 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Select tip amount</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIP_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAmountSelect(amt)}
                        className={`py-3.5 text-center font-bold text-base rounded-xl transition-all duration-150 ${
                          selectedAmount === amt
                            ? "text-white scale-[1.03] ring-1 ring-[#25d366]/40"
                            : "text-white/55 ring-1 ring-white/[0.07] hover:ring-white/[0.14] hover:text-white/80"
                        }`}
                        style={selectedAmount === amt
                          ? { background: "rgba(37,211,102,0.18)" }
                          : { background: "rgba(255,255,255,0.03)" }
                        }
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
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#25d366]/40"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                {tipAmount >= MIN_TIP && (
                  <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Fee breakdown</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Tip amount</span>
                      <span className="text-white/70">R{tipAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Total fee (10%)</span>
                      <span className="text-white/70">−R{(tipAmount * TOTAL_FEE_RATE).toFixed(2)}</span>
                    </div>
                    <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white/50">{worker?.firstName} receives</span>
                      <span className="text-green-400">R{(tipAmount * (1 - TOTAL_FEE_RATE)).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-white/20 mt-1">Includes payment processing + Slip a Tip platform fee.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={tipAmount < MIN_TIP || tipAmount > MAX_TIP}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: tipAmount >= MIN_TIP ? "linear-gradient(180deg, #25d366 0%, #1da851 100%)" : "rgba(255,255,255,0.08)", color: tipAmount >= MIN_TIP ? "#fff" : "rgba(255,255,255,0.3)" }}
                >
                  {tipAmount >= MIN_TIP ? (
                    <>
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Continue — get payment link on WhatsApp
                    </>
                  ) : "Select an amount to continue"}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p className="text-center text-[11px] text-white/25">Secured by Stitch · Bank-grade encryption</p>
                </div>
              </form>
            )}

            {/* ── STEP 2: Enter phone ── */}
            {step === "phone" && (
              <form onSubmit={handleSendWhatsApp} className="p-5 space-y-5">
                <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
                  <span className="text-sm text-white/60">Tip amount</span>
                  <span className="text-base font-bold text-[#25d366]">R{tipAmount.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Your WhatsApp number</p>
                  <p className="text-xs text-white/40">We&apos;ll send you a secure payment link — pay anytime within 24 hours.</p>

                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="e.g. 082 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#25d366]/40"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />

                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-[#25d366]/40"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!phone || submitting}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(180deg, #25d366 0%, #1da851 100%)", color: "#fff" }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Send payment link to WhatsApp
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("select"); setError(""); }}
                  className="w-full py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  ← Change amount
                </button>
              </form>
            )}

            {/* ── STEP 3: Sent confirmation ── */}
            {step === "sent" && (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.15)" }}>
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Payment link sent!</h2>
                  <p className="mt-2 text-sm text-white/50">
                    Check your WhatsApp — we just sent you a secure payment link for <span className="text-[#25d366] font-semibold">R{tipAmount.toFixed(2)}</span>.
                  </p>
                </div>
                <div className="rounded-xl p-4 text-left space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">💬</span>
                    <p className="text-xs text-white/50">Open the WhatsApp message from <strong className="text-white/70">Slip a Tip</strong> on your phone.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">🔗</span>
                    <p className="text-xs text-white/50">Tap the payment link and complete your tip securely via Instant EFT.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">⏱️</span>
                    <p className="text-xs text-white/50">You have <strong className="text-white/70">24 hours</strong> — no need to pay right now.</p>
                  </div>
                </div>
                <p className="text-[10px] text-white/25 pt-1">
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

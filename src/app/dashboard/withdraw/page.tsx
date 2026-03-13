"use client";

import { useState, useEffect, FormEvent } from "react";
import { useWorker } from "../WorkerContext";

interface Withdrawal {
  id: string;
  amount: string | number;
  fee: string | number;
  netAmount: string | number;
  method: string;
  status: string;
  reference?: string;
  createdAt: string;
}

interface Bank {
  name: string;
  code: string;
}

export default function WithdrawPage() {
  const { worker, loading: workerLoading, refresh } = useWorker();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [wdLoading, setWdLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [amount, setAmount] = useState("");

  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch("/api/workers/me/withdraw")
      .then((r) => r.json())
      .then((wd) => setWithdrawals(wd.withdrawals || []))
      .catch(console.error)
      .finally(() => setWdLoading(false));

    fetch("/api/workers/me/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch(console.error)
      .finally(() => setBanksLoading(false));
  }, []);

  useEffect(() => {
    if (worker && !initialized && banks.length > 0) {
      if (worker.bankAccountNo) setBankAccountNo(worker.bankAccountNo);
      if (worker.bankName) {
        const saved = banks.find(
          (b) => b.name.toLowerCase() === (worker.bankName || "").toLowerCase()
        );
        if (saved) {
          setSelectedBankCode(saved.code);
          setSelectedBankName(saved.name);
        }
      }
      setInitialized(true);
    }
  }, [worker, initialized, banks]);

  const loading = workerLoading || wdLoading;

  function handleBankChange(code: string) {
    setSelectedBankCode(code);
    const bank = banks.find((b) => b.code === code);
    setSelectedBankName(bank?.name || "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      setError("Minimum withdrawal amount is R100.");
      return;
    }
    if (!selectedBankCode) {
      setError("Please select your bank.");
      return;
    }
    if (!bankAccountNo.trim()) {
      setError("Please enter your account number.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/workers/me/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          method: "EFT",
          bankName: selectedBankName,
          bankAccountNo: bankAccountNo.trim(),
          bankCode: selectedBankCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");

      const ref = data.withdrawal?.reference;
      if (ref) {
        setSuccess(`EFT initiated! Reference: ${ref} — It may take 1–2 business days to reflect.`);
      } else {
        setSuccess("Withdrawal submitted successfully! You will be notified when it is processed.");
      }
      setAmount("");
      const [, wd] = await Promise.all([
        refresh(),
        fetch("/api/workers/me/withdraw").then((r) => r.json()),
      ]);
      setWithdrawals(wd.withdrawals || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;
  if (!worker) return <div className="text-red-500">Failed to load data.</div>;

  const balance = Number(worker.walletBalance);
  const amountNum = parseFloat(amount) || 0;
  const canWithdraw = balance >= 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdraw Funds</h1>
        <p className="text-gray-500 mt-1">
          Available balance: <span className="font-bold text-sky-600">R{balance.toFixed(2)}</span>
        </p>
      </div>

      {!canWithdraw && (
        <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium">
            You need a minimum balance of <strong>R100</strong> to withdraw. Keep tipping to build your balance!
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Withdrawal form */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-5">New EFT Withdrawal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-gray-400">(min R100)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R</span>
                <input
                  type="number"
                  min={100}
                  max={balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-10"
                  placeholder="100.00"
                  required
                  disabled={!canWithdraw || submitting}
                />
              </div>
              {amountNum >= 100 && (
                <div className="mt-2 p-3 rounded-lg bg-gray-50 ring-1 ring-gray-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Withdrawal amount</span>
                    <span className="text-gray-900">R{amountNum.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-500">You receive</span>
                    <span className="text-green-600">R{amountNum.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">No Slip a Tip fee. Bank EFT charges may apply.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
              {banksLoading ? (
                <div className="input-field text-gray-300 animate-pulse">Loading banks...</div>
              ) : (
                <select
                  value={selectedBankCode}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="input-field"
                  required
                  disabled={!canWithdraw || submitting}
                >
                  <option value="">Select your bank...</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                className="input-field"
                placeholder="Your account number"
                required
                disabled={!canWithdraw || submitting}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !canWithdraw}
              className="btn-primary w-full"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : "Withdraw Now"}
            </button>
          </form>
        </div>

        {/* Right — Withdrawal history */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Withdrawal History</h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No withdrawals yet</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">R{Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">EFT Transfer</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          w.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : w.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : w.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {w.status === "PROCESSING" ? "IN PROGRESS" : w.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                  </div>

                  {w.reference && (w.status === "PROCESSING" || w.status === "COMPLETED") && (
                    <div className={`mt-2 p-3 rounded-lg ${
                      w.status === "PROCESSING"
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-green-50 border border-green-100"
                    }`}>
                      <p className="text-[10px] font-medium text-gray-400 mb-1">EFT Reference</p>
                      <p className="text-sm font-mono font-bold tracking-widest text-gray-900 break-all">
                        {w.reference}
                      </p>
                    </div>
                  )}

                  {w.status === "PENDING" && (
                    <p className="mt-1 text-xs text-yellow-600">Under review — payment will be processed shortly.</p>
                  )}

                  {w.status === "FAILED" && (
                    <p className="mt-1 text-xs text-red-600">
                      Failed. {w.reference ? `Reason: ${w.reference}.` : ""} Funds have been returned to your wallet.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

interface SettlementHold {
  id: string;
  amount: string | number;
  status: "HOLDING" | "CLEARED" | "RELEASED" | "FRAUD_HOLD";
  holdUntil: string;
  clearedAt: string | null;
  createdAt: string;
  tip: {
    id: string;
    amount: string | number;
    worker: { user: { firstName: string; lastName: string; phone: string | null } };
  };
}

interface SummaryData {
  totalHolding: number;
  totalCleared: number;
  maturedCount: number;
  fraudHolds: number;
}

const STATUS_BADGE: Record<string, string> = {
  HOLDING: "bg-amber-100 text-amber-700",
  CLEARED: "bg-emerald-100 text-emerald-700",
  RELEASED: "bg-blue-100 text-blue-700",
  FRAUD_HOLD: "bg-red-100 text-red-700",
};

export default function AdminSettlementsPage() {
  const [holds, setHolds] = useState<SettlementHold[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalHolding: 0, totalCleared: 0, maturedCount: 0, fraudHolds: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("HOLDING");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/settlements?status=${statusFilter}` : "/api/admin/settlements";
      const res = await fetch(url);
      const data = await res.json();
      setHolds(data.holds || []);
      if (data.summary) setSummary(data.summary);
    } catch {
      setError("Failed to load settlement holds");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function processMatured() {
    if (!confirm(`Clear all matured settlement holds and release funds to worker wallets?`)) return;
    setProcessing(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_matured" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccessMsg(data.message || `Cleared ${data.cleared} holds`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process");
    } finally {
      setProcessing(false);
    }
  }

  async function releaseFraudHold(holdId: string) {
    if (!confirm("Release this fraud hold and credit funds to the worker?")) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release_fraud_hold", holdId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccessMsg(data.message || "Hold released");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to release");
    } finally {
      setProcessing(false);
    }
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Settlements</h1>
          {summary.maturedCount > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">{summary.maturedCount} hold{summary.maturedCount !== 1 ? "s" : ""} ready to clear</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          {summary.maturedCount > 0 && (
            <button
              onClick={processMatured}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {processing ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : `⚡ Clear ${summary.maturedCount} Matured Hold${summary.maturedCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Holding</p>
          <p className="text-xl font-bold text-amber-600 mt-1">R{summary.totalHolding.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting settlement delay</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready to Clear</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{summary.maturedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Settlement delay elapsed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cleared</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">R{summary.totalCleared.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Released to wallets</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fraud Holds</p>
          <p className="text-xl font-bold text-red-600 mt-1">{summary.fraudHolds}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending manual review</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-1">Settlement Delay Policy</p>
        <p>Tips are held for <strong>24–72 hours</strong> before funds are credited to worker wallets. This protects against chargebacks and fraud. Fraud-flagged holds require manual admin release. Run <strong>Clear Matured Holds</strong> daily or use the cron endpoint <code className="bg-white px-1 py-0.5 rounded border border-slate-200">/api/cron/settlements</code> for automation.</p>
      </div>

      {successMsg && <div className="bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 rounded-lg font-medium">{successMsg}</div>}
      {error && <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded-lg">{error}</div>}

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {[{ key: "HOLDING", label: "Holding" }, { key: "FRAUD_HOLD", label: "Fraud Hold" }, { key: "CLEARED", label: "Cleared" }, { key: "RELEASED", label: "Released" }, { key: "", label: "All" }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${statusFilter === tab.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : holds.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-slate-500 font-medium">No settlement holds</p>
          <p className="text-xs text-slate-400 mt-1">Nothing to show for this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Tip Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hold Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hold Until</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holds.map((hold) => {
                const isMatured = new Date(hold.holdUntil) <= now && hold.status === "HOLDING";
                return (
                  <tr key={hold.id} className={`hover:bg-slate-50 transition-colors ${isMatured ? "bg-amber-50/50" : ""}`}>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{new Date(hold.createdAt).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{hold.tip.worker.user.firstName} {hold.tip.worker.user.lastName}</p>
                      <p className="text-xs text-slate-400">{hold.tip.worker.user.phone || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-700">R{Number(hold.tip.amount).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800">R{Number(hold.amount).toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className={`text-xs font-semibold ${isMatured ? "text-emerald-600" : "text-slate-600"}`}>
                          {isMatured ? "✓ Ready to clear" : new Date(hold.holdUntil).toLocaleDateString("en-ZA")}
                        </p>
                        {!isMatured && hold.status === "HOLDING" && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(hold.holdUntil).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</p>
                        )}
                        {hold.clearedAt && <p className="text-[10px] text-emerald-600 mt-0.5">Cleared {new Date(hold.clearedAt).toLocaleDateString("en-ZA")}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[hold.status] || "bg-slate-100 text-slate-500"}`}>{hold.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {hold.status === "FRAUD_HOLD" && (
                        <button
                          onClick={() => releaseFraudHold(hold.id)}
                          disabled={processing}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          Release
                        </button>
                      )}
                      {isMatured && (
                        <span className="text-xs text-emerald-600 font-semibold">Ready ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

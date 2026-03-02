"use client";

import { useState, useEffect, useCallback } from "react";

interface AmlAlert {
  id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "REVIEWING" | "REPORTED" | "CLEARED";
  amount: string | number;
  details: Record<string, unknown>;
  createdAt: string;
  reviewedAt: string | null;
  worker: { user: { firstName: string; lastName: string; phone: string | null; idNumber: string | null } };
}

const SEVERITY_BADGE: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  REVIEWING: "bg-blue-100 text-blue-700",
  REPORTED: "bg-purple-100 text-purple-700",
  CLEARED: "bg-emerald-100 text-emerald-700",
};

const AML_TYPE_LABELS: Record<string, string> = {
  LARGE_TRANSACTION: "Large Transaction",
  RAPID_ACCUMULATION: "Rapid Accumulation",
  STRUCTURING: "Structuring (Smurfing)",
  ROUND_AMOUNT: "Round Amount Pattern",
};

export default function AdminAmlPage() {
  const [alerts, setAlerts] = useState<AmlAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/aml?status=${statusFilter}` : "/api/admin/aml";
      const res = await fetch(url);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      setError("Failed to load AML alerts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id: string, action: "review" | "dismiss" | "report") {
    setActing(id);
    setError("");
    try {
      const res = await fetch("/api/admin/aml", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: id, action }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Action failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  const openCount = alerts.filter((a) => a.status === "OPEN").length;
  const totalAmount = alerts.reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">AML Alerts</h1>
          {openCount > 0 && <p className="text-sm text-red-600 font-medium mt-0.5">{openCount} open alert{openCount !== 1 ? "s" : ""} requiring review</p>}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Alerts</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{openCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Flagged</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{alerts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flagged Amount</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">R{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-700 mb-1">Anti-Money Laundering Monitoring</p>
        <p><strong className="text-orange-700">Large Transaction</strong> — Single tip above R5 000. <strong className="text-orange-700">Rapid Accumulation</strong> — More than R10 000 in 24 hours. <strong className="text-orange-700">Structuring</strong> — Multiple transactions just below reporting thresholds. <strong className="text-orange-700">Round Amount</strong> — Suspicious round-number patterns.</p>
        <p className="text-orange-600 font-medium mt-1">Reported alerts must be submitted to the FIC (Financial Intelligence Centre) within 15 days.</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {[{ key: "OPEN", label: "Open" }, { key: "REVIEWING", label: "Reviewing" }, { key: "REPORTED", label: "Reported" }, { key: "CLEARED", label: "Cleared" }, { key: "", label: "All" }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${statusFilter === tab.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded-lg">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-slate-500 font-medium">No AML alerts</p>
          <p className="text-xs text-slate-400 mt-1">No suspicious activity detected for this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <>
                  <tr key={alert.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{new Date(alert.createdAt).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-slate-700">{AML_TYPE_LABELS[alert.type] || alert.type.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{alert.worker.user.firstName} {alert.worker.user.lastName}</p>
                      <p className="text-xs text-slate-400">{alert.worker.user.phone || "—"}{alert.worker.user.idNumber ? ` · ID: ${alert.worker.user.idNumber}` : ""}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800">R{Number(alert.amount).toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${SEVERITY_BADGE[alert.severity] || "bg-slate-100 text-slate-500"}`}>{alert.severity}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[alert.status] || "bg-slate-100 text-slate-500"}`}>{alert.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                        {alert.status === "OPEN" && (
                          <button onClick={() => doAction(alert.id, "review")} disabled={acting === alert.id} className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Review</button>
                        )}
                        {(alert.status === "OPEN" || alert.status === "REVIEWING") && (
                          <>
                            <button onClick={() => doAction(alert.id, "report")} disabled={acting === alert.id} className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 border border-purple-200 transition-colors">Report FIC</button>
                            <button onClick={() => doAction(alert.id, "dismiss")} disabled={acting === alert.id} className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition-colors">Clear</button>
                          </>
                        )}
                        <button className="px-2 py-1 text-slate-400 hover:text-slate-600 transition-colors">
                          <svg className={`w-4 h-4 transition-transform ${expandedId === alert.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === alert.id && (
                    <tr key={`${alert.id}-detail`} className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alert Details</p>
                          <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap overflow-x-auto">{JSON.stringify(alert.details, null, 2)}</pre>
                          {alert.reviewedAt && (
                            <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">Reviewed: {new Date(alert.reviewedAt).toLocaleString("en-ZA")}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

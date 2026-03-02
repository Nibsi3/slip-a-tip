"use client";

import { useState, useEffect, useCallback } from "react";

interface FraudEvent {
  id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  details: Record<string, unknown>;
  resolvedAt: string | null;
  createdAt: string;
  tip?: { id: string; amount: string | number; worker: { user: { firstName: string; lastName: string } } } | null;
  worker?: { user: { firstName: string; lastName: string; phone: string | null } } | null;
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
  RESOLVED: "bg-emerald-100 text-emerald-700",
  DISMISSED: "bg-slate-100 text-slate-500",
};

export default function AdminFraudPage() {
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/fraud?status=${statusFilter}` : "/api/admin/fraud";
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setError("Failed to load fraud events");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id: string, action: "resolve" | "dismiss" | "review") {
    setActing(id);
    setError("");
    try {
      const res = await fetch("/api/admin/fraud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, action }),
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

  const openCount = events.filter((e) => e.status === "OPEN").length;
  const criticalCount = events.filter((e) => e.severity === "CRITICAL").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Fraud Events</h1>
          <div className="flex items-center gap-3 mt-0.5">
            {openCount > 0 && <p className="text-sm text-red-600 font-medium">{openCount} open event{openCount !== 1 ? "s" : ""}</p>}
            {criticalCount > 0 && <p className="text-sm text-orange-600 font-medium">{criticalCount} critical</p>}
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-700 mb-1">Fraud Detection Engine</p>
        <p>Events are scored 0–100 based on BIN risk, amount anomaly, account age, velocity, same-device/IP patterns, geo-jumps, and VPN/proxy detection. Scores above 60 are flagged as HIGH or CRITICAL.</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {[{ key: "OPEN", label: "Open" }, { key: "REVIEWING", label: "Reviewing" }, { key: "RESOLVED", label: "Resolved" }, { key: "DISMISSED", label: "Dismissed" }, { key: "", label: "All" }].map((tab) => (
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
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-slate-500 font-medium">No fraud events</p>
          <p className="text-xs text-slate-400 mt-1">All clear for the selected filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <>
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{new Date(ev.createdAt).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-medium text-slate-700">{ev.type.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {ev.worker ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{ev.worker.user.firstName} {ev.worker.user.lastName}</p>
                          <p className="text-xs text-slate-400">{ev.worker.user.phone || "—"}</p>
                        </div>
                      ) : ev.tip?.worker ? (
                        <p className="text-sm font-semibold text-slate-800">{ev.tip.worker.user.firstName} {ev.tip.worker.user.lastName}</p>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ev.score >= 80 ? "bg-red-500" : ev.score >= 60 ? "bg-orange-500" : ev.score >= 40 ? "bg-amber-500" : "bg-slate-400"}`}
                            style={{ width: `${ev.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{ev.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${SEVERITY_BADGE[ev.severity] || "bg-slate-100 text-slate-500"}`}>{ev.severity}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[ev.status] || "bg-slate-100 text-slate-500"}`}>{ev.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                        {ev.status === "OPEN" && (
                          <button onClick={() => doAction(ev.id, "review")} disabled={acting === ev.id} className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Review</button>
                        )}
                        {(ev.status === "OPEN" || ev.status === "REVIEWING") && (
                          <>
                            <button onClick={() => doAction(ev.id, "resolve")} disabled={acting === ev.id} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 border border-emerald-200 transition-colors">Resolve</button>
                            <button onClick={() => doAction(ev.id, "dismiss")} disabled={acting === ev.id} className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition-colors">Dismiss</button>
                          </>
                        )}
                        <button className="px-2 py-1 text-slate-400 hover:text-slate-600 transition-colors">
                          <svg className={`w-4 h-4 transition-transform ${expandedId === ev.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === ev.id && (
                    <tr key={`${ev.id}-detail`} className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Event Details</p>
                          <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap overflow-x-auto">{JSON.stringify(ev.details, null, 2)}</pre>
                          {ev.tip && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                              <span>Tip: <span className="font-semibold text-slate-700">R{Number(ev.tip.amount).toFixed(2)}</span></span>
                              <span>ID: <span className="font-mono text-slate-600">{ev.tip.id}</span></span>
                            </div>
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

"use client";

import { useState, useEffect, useCallback } from "react";

interface FicaCheck {
  name: string;
  passed: boolean;
  weight: "HARD" | "SOFT";
  detail: string;
}

interface FicaResult {
  decision: "AUTO_APPROVE" | "ADMIN_REVIEW" | "AUTO_DENY";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  checks: FicaCheck[];
}

interface WorkerDoc {
  id: string;
  docStatus: string;
  docSubmittedAt: string | null;
  docReviewedAt: string | null;
  docReviewedBy: string | null;
  docRejectReason: string | null;
  docIdUrl: string | null;
  docAddressUrl: string | null;
  docSelfieUrl: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    idNumber: string | null;
    createdAt: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  NOT_SUBMITTED: "bg-slate-100 text-slate-500",
};

const DECISION_COLORS: Record<string, string> = {
  AUTO_APPROVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ADMIN_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  AUTO_DENY: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminFicaPage() {
  const [workers, setWorkers] = useState<WorkerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED">("PENDING_REVIEW");
  const [selected, setSelected] = useState<WorkerDoc | null>(null);
  const [ficaResult, setFicaResult] = useState<FicaResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/fica")
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = workers.filter((w) =>
    filterStatus === "ALL" ? true : w.docStatus === filterStatus
  );

  const pendingCount = workers.filter((w) => w.docStatus === "PENDING_REVIEW").length;

  async function runAutoCheck(worker: WorkerDoc) {
    setSelected(worker);
    setFicaResult(null);
    setShowDenyForm(false);
    setDenyReason("");
    setCheckLoading(true);
    try {
      const res = await fetch("/api/admin/fica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: worker.id, action: "run_auto" }),
      });
      const d = await res.json();
      setFicaResult(d.result);
    } catch {
      showToast("Failed to run FICA check", "error");
    } finally {
      setCheckLoading(false);
    }
  }

  async function commitAutoDecision() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/fica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selected.id, action: "run_auto_commit" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      setSelected(null);
      setFicaResult(null);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function manualAction(action: "approve" | "deny") {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/fica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selected.id, action, reason: denyReason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      setSelected(null);
      setFicaResult(null);
      setShowDenyForm(false);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function runBulkAuto() {
    if (!confirm(`Run automated FICA checks on all ${pendingCount} pending workers and commit decisions?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/fica?bulk=true", { method: "PATCH" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">FICA Document Review</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">{pendingCount} submission{pendingCount !== 1 ? "s" : ""} awaiting review</p>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={runBulkAuto}
            disabled={bulkLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {bulkLoading ? "Running…" : `⚡ Run Auto-Check on All ${pendingCount} Pending`}
          </button>
        )}
      </div>

      {/* What the engine does */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
        <p className="text-slate-700 font-bold mb-2">How the automated engine works</p>
        <p>✅ <strong className="text-emerald-700">AUTO-APPROVE</strong> — All 5 hard rules pass (3 docs uploaded + ID number present + Luhn check valid) and all soft rules pass → approved automatically, worker notified via SMS.</p>
        <p>⚠️ <strong className="text-amber-700">ADMIN REVIEW</strong> — Hard rules pass but soft rules flag concerns (account age &lt; 24h, missing phone, etc.) → stays PENDING_REVIEW for you to decide.</p>
        <p>❌ <strong className="text-red-700">AUTO-DENY</strong> — Hard rule fails (missing doc, invalid ID number format, Luhn check fails) → rejected automatically, worker told to re-upload with reason.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {(["PENDING_REVIEW", "ALL", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Number</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Docs</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No submissions found</td></tr>
                )}
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{w.user.firstName} {w.user.lastName}</p>
                      <p className="text-xs text-slate-400">{w.user.email || w.user.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-mono ${w.user.idNumber ? "text-slate-700" : "text-red-600 font-semibold"}`}>
                        {w.user.idNumber || "⚠ Missing"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <DocBadge label="ID" uploaded={!!w.docIdUrl} />
                        <DocBadge label="Addr" uploaded={!!w.docAddressUrl} />
                        <DocBadge label="Selfie" uploaded={!!w.docSelfieUrl} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {w.docSubmittedAt ? new Date(w.docSubmittedAt).toLocaleDateString("en-ZA") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[w.docStatus] || "bg-slate-100 text-slate-500"}`}>
                        {w.docStatus.replace("_", " ")}
                      </span>
                      {w.docRejectReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={w.docRejectReason}>{w.docRejectReason}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => runAutoCheck(w)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ paddingTop: "5vh" }}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setSelected(null); setFicaResult(null); setShowDenyForm(false); }} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                FICA Review — {selected.user.firstName} {selected.user.lastName}
              </h3>
              <button onClick={() => { setSelected(null); setFicaResult(null); setShowDenyForm(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Worker Info */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
              <InfoRow label="Phone" value={selected.user.phone || "—"} />
              <InfoRow label="Email" value={selected.user.email || "—"} />
              <InfoRow label="ID Number" value={selected.user.idNumber || "⚠ Missing"} warn={!selected.user.idNumber} />
              <InfoRow label="Account Age" value={`${Math.floor((Date.now() - new Date(selected.user.createdAt).getTime()) / 3_600_000)}h`} />
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Uploaded Documents</p>
              <div className="flex gap-2 flex-wrap">
                <DocLink label="SA ID / Passport" url={selected.docIdUrl} />
                <DocLink label="Proof of Address" url={selected.docAddressUrl} />
                <DocLink label="Selfie" url={selected.docSelfieUrl} />
              </div>
            </div>

            {/* Auto-check result */}
            {checkLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Running automated checks…
              </div>
            )}

            {ficaResult && (
              <div className={`rounded-xl border p-4 space-y-3 ${DECISION_COLORS[ficaResult.decision]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm">
                      {ficaResult.decision === "AUTO_APPROVE" && "✅ AUTO-APPROVE"}
                      {ficaResult.decision === "ADMIN_REVIEW" && "⚠️ ADMIN REVIEW NEEDED"}
                      {ficaResult.decision === "AUTO_DENY" && "❌ AUTO-DENY"}
                    </span>
                    <span className="ml-2 text-xs opacity-70">Confidence: {ficaResult.confidence}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {ficaResult.reasons.map((r, i) => (
                    <p key={i} className="text-xs opacity-90">• {r}</p>
                  ))}
                </div>

                {/* Check breakdown */}
                <div className="border-t border-current/20 pt-3">
                  <p className="text-xs font-bold opacity-70 mb-2 uppercase tracking-wider">Check Breakdown</p>
                  <div className="space-y-1">
                    {ficaResult.checks.map((c) => (
                      <div key={c.name} className="flex items-start gap-2 text-xs">
                        <span className={c.passed ? "text-emerald-600" : (c.weight === "HARD" ? "text-red-600" : "text-amber-600")}>
                          {c.passed ? "✓" : (c.weight === "HARD" ? "✗" : "⚠")}
                        </span>
                        <span className="opacity-80">{c.detail}</span>
                        {c.weight === "HARD" && !c.passed && (
                          <span className="ml-auto text-red-600 font-bold">HARD FAIL</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
              {!ficaResult && !checkLoading && (
                <button
                  onClick={() => runAutoCheck(selected)}
                  disabled={checkLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  ⚡ Run Automated Check
                </button>
              )}

              {ficaResult && ficaResult.decision !== "ADMIN_REVIEW" && (
                <button
                  onClick={commitAutoDecision}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    ficaResult.decision === "AUTO_APPROVE"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? "Applying…" : `Apply ${ficaResult.decision.replace("_", " ")}`}
                </button>
              )}

              <button
                onClick={() => manualAction("approve")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border border-emerald-200"
              >
                ✓ Manual Approve
              </button>

              <button
                onClick={() => setShowDenyForm(!showDenyForm)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors border border-red-200"
              >
                ✗ Manual Deny
              </button>
            </div>

            {showDenyForm && (
              <div className="space-y-2">
                <textarea
                  placeholder="Reason for denial (sent to worker via SMS)…"
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <button
                  onClick={() => manualAction("deny")}
                  disabled={actionLoading || !denyReason.trim()}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                >
                  {actionLoading ? "Denying…" : "Confirm Denial & Notify Worker"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DocBadge({ label, uploaded }: { label: string; uploaded: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${uploaded ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {uploaded ? "✓" : "✗"} {label}
    </span>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200">
        ✗ {label} missing
      </span>
    );
  }
  return (
    <a
      href={`/api/admin/documents?key=${encodeURIComponent(url)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
    >
      📄 {label}
    </a>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${warn ? "text-red-600" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

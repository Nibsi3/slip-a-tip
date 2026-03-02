"use client";

import { useState, useEffect, useCallback } from "react";

interface PhysicalQRReq {
  id: string;
  status: string;
  isFree: boolean;
  feeCharged: number;
  address?: string;
  notes?: string;
  adminNotes?: string;
  dispatchedAt?: string;
  createdAt: string;
  worker: {
    id: string;
    jobTitle?: string;
    employerName?: string;
    physicalQrCount: number;
    user: { firstName: string; lastName: string; email?: string; phone?: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  DISPATCHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminPhysicalQRPage() {
  const [requests, setRequests] = useState<PhysicalQRReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "DISPATCHED" | "REJECTED">("all");
  const [selected, setSelected] = useState<PhysicalQRReq | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/physical-qr")
      .then(r => r.json())
      .then(d => setRequests(d.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function doAction(req: PhysicalQRReq, action: "approve" | "dispatch" | "reject") {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/physical-qr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id, action, adminNotes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(d.message);
      setSelected(null);
      setAdminNotes("");
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const pending = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-800">Physical QR Requests <span className="text-slate-400 font-normal text-base">({requests.length})</span></h1>
        {pending > 0 && <p className="text-sm text-amber-600 font-medium mt-0.5">{pending} pending dispatch</p>}
      </div>

      <div className="flex gap-1 flex-wrap">
        {(["all", "PENDING", "APPROVED", "DISPATCHED", "REJECTED"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
              filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No requests found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">{req.worker.user.firstName} {req.worker.user.lastName}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[req.status] || "bg-slate-100 text-slate-500"}`}>{req.status}</span>
                    {req.isFree ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">FREE</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">R{Number(req.feeCharged).toFixed(0)}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span className="text-xs text-slate-500">{req.worker.user.phone || "—"}</span>
                    <span className="text-xs text-slate-500">{req.worker.user.email || "—"}</span>
                    {req.worker.jobTitle && <span className="text-xs text-slate-400">{req.worker.jobTitle}{req.worker.employerName ? ` @ ${req.worker.employerName}` : ""}</span>}
                  </div>
                  {req.address && <p className="text-xs text-blue-600 mt-1">📍 {req.address}</p>}
                  {req.notes && <p className="text-xs text-slate-400 mt-0.5 italic">"{req.notes}"</p>}
                  {req.adminNotes && <p className="text-xs text-blue-600 mt-1 font-medium">Admin: {req.adminNotes}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(req.createdAt).toLocaleString("en-ZA")} · Card #{req.worker.physicalQrCount}</p>
                </div>
                {req.status === "PENDING" && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => { setSelected(req); setAdminNotes(""); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      Manage
                    </button>
                  </div>
                )}
                {req.status === "APPROVED" && (
                  <button onClick={() => doAction(req, "dispatch")} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0">
                    Mark Dispatched
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {selected.worker.user.firstName} {selected.worker.user.lastName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selected.isFree ? "Free card" : `R${Number(selected.feeCharged).toFixed(0)} charged`}
              {selected.address ? ` · ${selected.address}` : ""}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Notes <span className="text-slate-400 font-normal">(shown to worker)</span></label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="e.g. Dispatched via PostNet, tracking #12345"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => doAction(selected, "approve")} disabled={saving} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Approve
              </button>
              <button onClick={() => doAction(selected, "dispatch")} disabled={saving} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                Dispatched
              </button>
              <button onClick={() => doAction(selected, "reject")} disabled={saving} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors">
                Reject
              </button>
            </div>
            <button onClick={() => setSelected(null)} className="mt-3 w-full py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

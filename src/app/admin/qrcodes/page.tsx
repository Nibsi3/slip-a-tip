"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface QRCodeItem {
  id: string;
  token: string;
  status: "INACTIVE" | "ACTIVE" | "DISABLED";
  batchId: string | null;
  createdAt: string;
  activatedAt: string | null;
  worker: {
    firstName: string;
    lastName: string;
    phone: string;
    jobTitle: string | null;
    employerName: string | null;
  } | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

interface BatchInfo {
  batchId: string;
  count: number;
}

export default function AdminQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generateCount, setGenerateCount] = useState("100");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<QRCodeItem[]>([]);

  const fetchQRCodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterBatch) params.set("batchId", filterBatch);
    params.set("page", String(page));
    params.set("limit", "50");

    try {
      const res = await fetch(`/api/admin/qrcodes?${params}`);
      const data = await res.json();
      setQrCodes(data.qrCodes);
      setStats(data.stats);
      setBatches(data.batches);
      setTotalPages(data.pagination.totalPages);
    } catch {
      console.error("Failed to fetch QR codes");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterBatch, page]);

  useEffect(() => {
    fetchQRCodes();
    setSelected(new Set());
    setExpandedId(null);
  }, [fetchQRCodes]);

  // Selection helpers
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === qrCodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(qrCodes.map((q) => q.id)));
    }
  }

  async function generatePreview(token: string) {
    if (previewImages[token]) return;
    try {
      const QRCodeLib = (await import("qrcode")).default;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const url = `${baseUrl}/qr/${token}`;
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });
      const withLogo = await overlayLogo(dataUrl, 400);
      setPreviewImages((prev) => ({ ...prev, [token]: withLogo }));
    } catch {
      // Preview generation failed silently
    }
  }

  function handleExpand(qr: QRCodeItem) {
    if (expandedId === qr.id) {
      setExpandedId(null);
    } else {
      setExpandedId(qr.id);
      generatePreview(qr.token);
    }
  }

  function openDeleteModal() {
    const targets = qrCodes.filter((q) => selected.has(q.id));
    if (targets.length === 0) return;
    setDeleteTargets(targets);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/qrcodes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteTargets.map((t) => t.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const pairedCount = deleteTargets.filter((t) => t.worker).length;
      setMessage(
        `Deleted ${data.deleted} QR code(s)${pairedCount > 0 ? ` and ${data.usersDeleted} paired user(s)` : ""}`
      );
      setSelected(new Set());
      setShowDeleteModal(false);
      setDeleteTargets([]);
      fetchQRCodes();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function handleGenerate() {
    const count = parseInt(generateCount);
    if (!count || count < 1 || count > 5000) {
      setMessage("Enter a number between 1 and 5000");
      return;
    }

    setGenerating(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/qrcodes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage(`Generated ${data.count} QR codes (Batch: ${data.batchId})`);
      setPage(1);
      fetchQRCodes();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function overlayLogo(
    baseDataUrl: string,
    size: number
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 0, 0, size, size);

        const logo = new Image();
        logo.onload = () => {
          const logoSize = Math.round(size * 0.2);
          const padding = 12;
          const bgSize = logoSize + padding * 2;
          const bgX = (size - bgSize) / 2;
          const bgY = (size - bgSize) / 2;
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(bgX, bgY, bgSize, bgSize);
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          resolve(canvas.toDataURL("image/png"));
        };
        logo.onerror = () => resolve(baseDataUrl);
        logo.crossOrigin = "anonymous";
        logo.src = "/logo/11.png";
      };
      qrImg.src = baseDataUrl;
    });
  }

  async function handleDownloadBatch(batchId: string) {
    setDownloading(true);
    setMessage("Generating QR codes with logo... this may take a moment.");

    try {
      const res = await fetch(
        `/api/admin/qrcodes/download?batchId=${encodeURIComponent(batchId)}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Process each QR code with logo overlay
      const processed: { token: string; dataUrl: string }[] = [];
      for (const code of data.codes) {
        const withLogo = await overlayLogo(code.dataUrl, 800);
        processed.push({ token: code.token, dataUrl: withLogo });
      }

      // Download each QR code as an individual PNG file
      let downloaded = 0;
      for (const item of processed) {
        const link = document.createElement("a");
        link.download = `slipatip-qr-${item.token}.png`;
        link.href = item.dataUrl;
        link.click();
        downloaded++;
        // Small delay between downloads so the browser doesn't block them
        if (processed.length > 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      setMessage(`Downloaded ${downloaded} individual QR code(s) with logo`);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadSingle(token: string) {
    try {
      const res = await fetch(
        `/api/admin/qrcodes/download?token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // This returns a single code in the batch format
      // Actually for single, let's use the dataUrl approach
      const QRCodeLib = (await import("qrcode")).default;
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const url = `${baseUrl}/qr/${token}`;

      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: 800,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });

      const withLogo = await overlayLogo(dataUrl, 800);
      const link = document.createElement("a");
      link.download = `slipatip-qr-${token}.png`;
      link.href = withLogo;
      link.click();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Download failed");
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "text-emerald-700 bg-emerald-100";
      case "INACTIVE": return "text-amber-700 bg-amber-100";
      case "DISABLED": return "text-red-700 bg-red-100";
      default: return "text-slate-500 bg-slate-100";
    }
  };

  return (
    <div className="space-y-8">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">QR Codes</h1>
        <p className="text-sm text-slate-400 mt-0.5">Generate, manage, and download QR codes for workers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Total Codes</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          <div className="text-xs text-slate-400 mt-1">Activated</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.inactive}</div>
          <div className="text-xs text-slate-400 mt-1">Available</div>
        </div>
      </div>

      {/* Generate Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Generate New Batch</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Number of QR codes</label>
            <input
              type="number"
              min="1"
              max="5000"
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Generating...
              </span>
            ) : "Generate"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-blue-600 font-medium">{message}</p>}
      </div>

      {/* Batches */}
      {batches.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Batches</h2>
          <div className="space-y-2">
            {batches.map((batch) => (
              <div key={batch.batchId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-sm font-mono text-slate-600">{batch.batchId}</span>
                  <span className="text-xs text-slate-400 ml-3">{batch.count} codes</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setFilterBatch(batch.batchId!); setPage(1); }} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">View</button>
                  <button onClick={() => handleDownloadBatch(batch.batchId!)} disabled={downloading} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50">{downloading ? "..." : "Download"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Selection Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
        {filterBatch && (
          <button onClick={() => { setFilterBatch(""); setPage(1); }} className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">
            Clear batch filter ✕
          </button>
        )}
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">{selected.size} selected</span>
            <button onClick={openDeleteModal} className="text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg border border-red-200 transition-colors">
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* QR Code List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : qrCodes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No QR codes found. Generate a batch to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.size === qrCodes.length && qrCodes.length > 0} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer accent-blue-600" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Token</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Worker</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {qrCodes.map((qr) => (
                  <>
                    <tr key={qr.id} className={`hover:bg-slate-50 transition-colors ${selected.has(qr.id) ? "bg-blue-50" : ""}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(qr.id)} onChange={() => toggleSelect(qr.id)} className="w-4 h-4 cursor-pointer accent-blue-600" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-600 text-xs">{qr.token}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${statusColor(qr.status)}`}>{qr.status}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {qr.worker ? (
                          <div>
                            <span className="text-slate-700 text-xs font-medium">{qr.worker.firstName} {qr.worker.lastName}</span>
                            {qr.worker.employerName && <span className="text-slate-400 text-xs ml-2">@ {qr.worker.employerName}</span>}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400">{new Date(qr.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleExpand(qr)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">{expandedId === qr.id ? "Hide" : "View"}</button>
                          <button onClick={() => handleDownloadSingle(qr.token)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">Download</button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === qr.id && (
                      <tr key={`${qr.id}-detail`} className="bg-slate-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">QR Code ID</p><p className="font-mono text-slate-600 mt-0.5 break-all">{qr.id}</p></div>
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Token</p><p className="font-mono text-slate-600 mt-0.5">{qr.token}</p></div>
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Batch</p><p className="font-mono text-slate-600 mt-0.5">{qr.batchId || "—"}</p></div>
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Created</p><p className="text-slate-600 mt-0.5">{new Date(qr.createdAt).toLocaleString()}</p></div>
                            <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Activated</p><p className="text-slate-600 mt-0.5">{qr.activatedAt ? new Date(qr.activatedAt).toLocaleString() : "—"}</p></div>
                            {qr.worker && (
                              <>
                                <div className="sm:col-span-2 lg:col-span-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-200 pt-2 mt-1">Paired Worker</p></div>
                                <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Name</p><p className="text-slate-700 font-medium mt-0.5">{qr.worker.firstName} {qr.worker.lastName}</p></div>
                                <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Phone</p><p className="font-mono text-slate-600 mt-0.5">{qr.worker.phone || "—"}</p></div>
                                <div className="bg-white rounded-lg p-2.5 border border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase">Job</p><p className="text-slate-600 mt-0.5">{qr.worker.jobTitle || "—"}{qr.worker.employerName && ` @ ${qr.worker.employerName}`}</p></div>
                              </>
                            )}
                            <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-lg p-2.5 border border-slate-200">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">QR URL</p>
                              <p className="font-mono text-blue-600 text-[11px] break-all">{typeof window !== "undefined" ? `${window.location.origin}/qr/${qr.token}` : `/qr/${qr.token}`}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">QR Code Preview</p>
                              <div className="flex items-start gap-4">
                                {previewImages[qr.token] ? (
                                  <img src={previewImages[qr.token]} alt={`QR ${qr.token}`} className="w-40 h-40 bg-white rounded-lg border border-slate-200" />
                                ) : (
                                  <div className="w-40 h-40 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                    <span className="text-slate-400 text-xs animate-pulse">Generating...</span>
                                  </div>
                                )}
                                <button onClick={() => handleDownloadSingle(qr.token)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1">Download PNG</button>
                              </div>
                            </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Are you sure?</h3>
                <p className="text-sm text-slate-500 mt-1">This action cannot be undone. You are about to delete:</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">QR codes</span>
                <span className="text-slate-800 font-bold">{deleteTargets.length}</span>
              </div>
              {deleteTargets.some((t) => t.worker) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-red-600 text-xs">Paired users also deleted</span>
                    <span className="text-red-600 font-bold">{deleteTargets.filter((t) => t.worker).length}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-400 text-xs">Users to be removed:</span>
                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {deleteTargets.filter((t) => t.worker).map((t) => (
                        <div key={t.id} className="text-xs text-slate-600">{t.worker!.firstName} {t.worker!.lastName}{t.worker!.phone && <span className="text-slate-400 ml-2">{t.worker!.phone}</span>}</div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTargets([]); }} disabled={deleting} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                {deleting ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting...</span> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

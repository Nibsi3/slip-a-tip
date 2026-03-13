"use client";

import { useState, useEffect, useRef } from "react";

interface DocData {
  docIdUrl: string | null;
  docAddressUrl: string | null;
  docSelfieUrl: string | null;
  docStatus: string;
  docRejectReason: string | null;
  docSubmittedAt: string | null;
  docReviewedAt: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NOT_SUBMITTED: { label: "Not Submitted", color: "text-gray-500", bg: "bg-gray-100" },
  PENDING_REVIEW: { label: "Under Review", color: "text-yellow-700", bg: "bg-yellow-50" },
  APPROVED: { label: "Approved", color: "text-green-700", bg: "bg-green-50" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const idRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    fetch("/api/workers/me/documents")
      .then((r) => r.json())
      .then((d) => {
        if (d.documents) setDocs(d.documents);
      })
      .catch(() => setError("Failed to load document status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload() {
    if (!idFile || !addressFile || !selfieFile) {
      setError("Please select all three documents before uploading.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("idDocument", idFile);
    formData.append("addressDocument", addressFile);
    formData.append("selfie", selfieFile);

    try {
      const res = await fetch("/api/workers/me/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage("Documents uploaded successfully! They are now under review.");
      setDocs((prev) =>
        prev
          ? { ...prev, docStatus: "PENDING_REVIEW", docSubmittedAt: new Date().toISOString(), docRejectReason: null }
          : prev
      );
      setIdFile(null);
      setAddressFile(null);
      setSelfieFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const status = STATUS_MAP[docs?.docStatus || "NOT_SUBMITTED"] || STATUS_MAP.NOT_SUBMITTED;
  const canUpload = docs?.docStatus !== "APPROVED" && docs?.docStatus !== "PENDING_REVIEW";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-400">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload your ID, proof of address, and selfie for FICA verification. You must be verified before you can withdraw funds.
        </p>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-4 ring-1 ring-gray-100 mb-8 ${status.bg}`}>
        <div className="flex items-center gap-3">
          {docs?.docStatus === "APPROVED" && (
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {docs?.docStatus === "PENDING_REVIEW" && (
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {docs?.docStatus === "REJECTED" && (
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          )}
          {docs?.docStatus === "NOT_SUBMITTED" && (
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0H9.75m0 0H8.25m1.5 0v3.75m0-3.75V15M3.75 19.5h16.5" /></svg>
          )}
          <div>
            <div className={`text-sm font-semibold ${status.color}`}>Verification: {status.label}</div>
            {docs?.docStatus === "PENDING_REVIEW" && (
              <div className="text-xs text-gray-400 mt-0.5">Submitted {docs.docSubmittedAt ? new Date(docs.docSubmittedAt).toLocaleDateString() : ""} — typically reviewed within 1–2 business days</div>
            )}
            {docs?.docStatus === "APPROVED" && (
              <div className="text-xs text-gray-400 mt-0.5">Your documents have been verified. You can now withdraw funds.</div>
            )}
            {docs?.docStatus === "REJECTED" && docs.docRejectReason && (
              <div className="text-xs text-red-600 mt-0.5">Reason: {docs.docRejectReason}</div>
            )}
            {docs?.docStatus === "NOT_SUBMITTED" && (
              <div className="text-xs text-gray-400 mt-0.5">Upload your documents below to get verified</div>
            )}
          </div>
        </div>
      </div>

      {/* Info callout */}
      <div className="rounded-xl p-4 bg-sky-50 ring-1 ring-sky-200 mb-8">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          <div className="text-xs text-sky-700 leading-relaxed">
            <strong className="text-sky-800">You can start accepting tips immediately</strong> — document verification is only required before your first withdrawal. All documents are reviewed manually by our team.
          </div>
        </div>
      </div>

      {/* Upload form */}
      {canUpload && (
        <div className="space-y-4">
          {/* ID Document */}
          <div className="rounded-xl p-5 bg-gray-50 ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">South African ID</div>
                <div className="text-[10px] text-gray-400">Clear photo of your ID document (front and back)</div>
              </div>
              {idFile && <span className="text-[10px] text-green-600 font-medium">Selected</span>}
            </div>
            <input ref={idRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
            <button
              onClick={() => idRef.current?.click()}
              className="w-full py-3 rounded-lg text-xs font-medium text-gray-500 bg-white ring-1 ring-gray-200 hover:ring-sky-300 hover:text-gray-700 transition-all"
            >
              {idFile ? idFile.name : "Choose file..."}
            </button>
          </div>

          {/* Proof of Address */}
          <div className="rounded-xl p-5 bg-gray-50 ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">Proof of Address</div>
                <div className="text-[10px] text-gray-400">Utility bill, bank statement, or lease (less than 3 months old)</div>
              </div>
              {addressFile && <span className="text-[10px] text-green-600 font-medium">Selected</span>}
            </div>
            <input ref={addressRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setAddressFile(e.target.files?.[0] || null)} />
            <button
              onClick={() => addressRef.current?.click()}
              className="w-full py-3 rounded-lg text-xs font-medium text-gray-500 bg-white ring-1 ring-gray-200 hover:ring-sky-300 hover:text-gray-700 transition-all"
            >
              {addressFile ? addressFile.name : "Choose file..."}
            </button>
          </div>

          {/* Selfie */}
          <div className="rounded-xl p-5 bg-gray-50 ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">Selfie</div>
                <div className="text-[10px] text-gray-400">Clear photo of your face for identity verification</div>
              </div>
              {selfieFile && <span className="text-[10px] text-green-600 font-medium">Selected</span>}
            </div>
            <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
            <button
              onClick={() => selfieRef.current?.click()}
              className="w-full py-3 rounded-lg text-xs font-medium text-gray-500 bg-white ring-1 ring-gray-200 hover:ring-sky-300 hover:text-gray-700 transition-all"
            >
              {selfieFile ? selfieFile.name : "Choose file..."}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-lg p-3 text-xs text-red-600 bg-red-50 ring-1 ring-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg p-3 text-xs text-green-700 bg-green-50 ring-1 ring-green-200">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleUpload}
            disabled={uploading || !idFile || !addressFile || !selfieFile}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? "Uploading..." : "Upload Documents"}
          </button>
        </div>
      )}

      {/* Already submitted */}
      {docs?.docStatus === "PENDING_REVIEW" && (
        <div className="rounded-xl p-6 bg-yellow-50 ring-1 ring-yellow-200 text-center">
          <svg className="h-10 w-10 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-sm font-semibold text-gray-900">Documents under review</div>
          <p className="mt-2 text-xs text-gray-500">Our team is reviewing your documents. This typically takes 1–2 business days. We&rsquo;ll update your status once complete.</p>
        </div>
      )}

      {docs?.docStatus === "APPROVED" && (
        <div className="rounded-xl p-6 bg-green-50 ring-1 ring-green-200 text-center">
          <svg className="h-10 w-10 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-sm font-semibold text-green-700">Verified</div>
          <p className="mt-2 text-xs text-gray-500">Your identity has been verified. You can now withdraw funds from your wallet.</p>
        </div>
      )}
    </div>
  );
}

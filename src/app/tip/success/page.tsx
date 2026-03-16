"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";

interface TipDetails {
  amount: number;
  workerName: string;
  employerName: string | null;
  status: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [tip, setTip] = useState<TipDetails | null>(null);

  useEffect(() => {
    if (!reference) return;
    fetch(`/api/tips/lookup?reference=${encodeURIComponent(reference)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setTip(data); })
      .catch(() => {});
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="relative w-full max-w-md text-center">
        <div className="rounded-2xl p-8 bg-white ring-1 ring-gray-100 shadow-lg">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tip Sent!</h1>

          {tip ? (
            <div className="mb-6 space-y-3">
              <div className="text-4xl font-bold text-gray-900">R{tip.amount.toFixed(2)}</div>
              <p className="text-sm text-gray-500">
                sent to <span className="text-gray-800 font-medium">{tip.workerName}</span>
                {tip.employerName && <span className="text-gray-400"> · {tip.employerName}</span>}
              </p>
              <p className="text-xs text-gray-400">They&apos;ll receive your tip shortly. Thank you for your generosity.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              Thank you for your generosity. The worker will receive your tip shortly.
            </p>
          )}

          {reference && (
            <div className="mb-6 p-3 rounded-lg bg-gray-50 ring-1 ring-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Reference</p>
              <p className="text-xs text-gray-600 font-mono">{reference}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/" className="btn-primary w-full block text-center">
              Back to Home
            </Link>
            <p className="text-[10px] text-gray-300">
              Powered by <Image src="/logo/11.png" alt="Slip a Tip" width={14} height={14} className="inline-block h-3.5 w-3.5 object-contain align-text-bottom" /> Slip a Tip
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TipSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}

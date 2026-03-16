"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function FailedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="relative w-full max-w-md text-center">
        <div className="rounded-2xl p-8 bg-white ring-1 ring-gray-100 shadow-lg">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your payment could not be processed. No money has been charged. Please try again or use a different payment method.
          </p>

          {reference && (
            <div className="mb-6 p-3 rounded-lg bg-gray-50 ring-1 ring-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Reference</p>
              <p className="text-xs text-gray-600 font-mono">{reference}</p>
            </div>
          )}

          <div className="space-y-3">
            <button onClick={() => window.history.back()} className="btn-primary w-full">
              Try Again
            </button>
            <Link href="/" className="block w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-2">
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

export default function TipFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400">Loading...</div></div>}>
      <FailedContent />
    </Suspense>
  );
}

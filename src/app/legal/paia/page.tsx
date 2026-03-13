"use client";

import Link from "next/link";
import Image from "next/image";

export default function PaiaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Slip a Tip" width={56} height={56} quality={95} priority className="h-11 w-11 object-contain" />
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">&larr; Back to home</Link>
        </nav>
      </header>

      <main className="pt-28 pb-24 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Page title */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 ring-1 ring-sky-200 mb-6">
              <svg className="h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              Legal Compliance
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">PAIA Compliance</h1>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Promotion of Access to Information Act (Act 2 of 2000) — Our commitment to transparent information practices.
            </p>
          </div>

          {/* Download Card */}
          <div className="rounded-2xl p-6 sm:p-8 bg-sky-50 ring-1 ring-sky-200 mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="h-14 w-14 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                <svg className="h-7 w-7 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Download Full PAIA Manual</h3>
                <p className="text-sm text-gray-500 mt-1">Official Slip a Tip PAIA Manual — Full Compliant 2026 (PDF)</p>
              </div>
              <a
                href="/Slip_A_Tip_PAIA_Manual_Full_Compliant_2026.pdf"
                download
                className="btn-primary !py-3 !px-6 text-sm flex items-center gap-2 shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download PDF
              </a>
            </div>
          </div>

          {/* Summary Sections */}
          <div className="space-y-8">
            {/* What is PAIA */}
            <section className="rounded-2xl p-6 sm:p-8 bg-gray-50 ring-1 ring-gray-100">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">What is PAIA?</h2>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    The Promotion of Access to Information Act (PAIA) gives effect to the constitutional right of access to any information held by the State and any information held by another person that is required for the exercise or protection of any rights.
                  </p>
                </div>
              </div>
            </section>

            {/* Our obligations */}
            <section className="rounded-2xl p-6 sm:p-8 bg-gray-50 ring-1 ring-gray-100">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Our Obligations</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Information Officer", desc: "We have appointed a designated Information Officer responsible for PAIA compliance and handling all access requests." },
                  { title: "Section 51 Manual", desc: "Our complete Section 51 manual is publicly available and details all categories of records held by Slip a Tip." },
                  { title: "Request Processing", desc: "All requests for access to information are processed within 30 days as prescribed by the Act." },
                  { title: "Records Available", desc: "We maintain transparent records of our company information, financial records, operational data, and user-related data." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl p-4 bg-white ring-1 ring-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* How to request access */}
            <section className="rounded-2xl p-6 sm:p-8 bg-gray-50 ring-1 ring-gray-100">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0H9.75m0 0v.375c0 .621.504 1.125 1.125 1.125h.375" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">How to Request Access</h2>
              </div>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Complete the prescribed form", desc: "Use the SAHRC Form C (for private bodies) available in our PAIA manual or from the SAHRC website." },
                  { step: "2", title: "Submit your request", desc: "Send the completed form to our Information Officer via email at legal@slipatip.co.za." },
                  { step: "3", title: "Pay the prescribed fee", desc: "A request fee and access fee may apply as prescribed by the Act. We will notify you of any applicable fees." },
                  { step: "4", title: "Receive a response", desc: "We will respond within 30 days. If access is refused, we will provide reasons and inform you of your right to appeal." },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0 text-xs font-bold text-sky-600">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Grounds for refusal */}
            <section className="rounded-2xl p-6 sm:p-8 bg-red-50 ring-1 ring-red-200">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Grounds for Refusal</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Access to information may be refused in the following circumstances as provided for in the Act:</p>
              <ul className="space-y-2">
                {[
                  "Protection of personal information of a third party (Section 63)",
                  "Protection of commercial information of a third party (Section 64)",
                  "Protection of confidential information of a third party (Section 65)",
                  "Protection of safety of individuals and property (Section 66)",
                  "Records privileged from production in legal proceedings (Section 67)",
                  "Commercial information of the private body (Section 68)",
                  "Mandatory protection of research information (Section 69)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs text-gray-600">
                    <svg className="h-4 w-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Contact */}
            <section className="rounded-2xl p-6 sm:p-8 bg-sky-50 ring-1 ring-sky-200 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Need More Information?</h2>
              <p className="text-sm text-gray-500 mb-5">Contact our Information Officer for any PAIA-related enquiries.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="mailto:legal@slipatip.co.za" className="btn-primary !py-2.5 !px-5 text-sm">Email: legal@slipatip.co.za</a>
                <a href="/Slip_A_Tip_PAIA_Manual_Full_Compliant_2026.pdf" download className="btn-secondary !py-2.5 !px-5 text-sm">Download PAIA Manual</a>
              </div>
            </section>
          </div>

          {/* Related links */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Related Policies</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/legal/popia" className="text-xs text-sky-600 hover:text-sky-700 transition-colors">POPIA Compliance &rarr;</Link>
              <Link href="/legal/fica" className="text-xs text-sky-600 hover:text-sky-700 transition-colors">FICA Compliance &rarr;</Link>
              <Link href="/legal/terms" className="text-xs text-sky-600 hover:text-sky-700 transition-colors">Terms & Conditions &rarr;</Link>
              <Link href="/legal/privacy" className="text-xs text-sky-600 hover:text-sky-700 transition-colors">Privacy Policy &rarr;</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

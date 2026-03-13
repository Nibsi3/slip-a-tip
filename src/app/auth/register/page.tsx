"use client";

import { useState, FormEvent, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Step = "details" | "otp" | "password";

export default function RegisterPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("details");

  // Step 1 — details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — OTP
  const [sessionKey, setSessionKey] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3 — password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: request OTP ──────────────────────────────────────────────────
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setSessionKey(data.sessionKey);
      setStep("otp");
      startResendCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(t); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setSessionKey(data.sessionKey);
      startResendCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  }

  // OTP digit input handling
  function handleOtpChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs[idx + 1].current?.focus();
  }

  function handleOtpKey(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  }

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the full 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: complete registration ────────────────────────────────────────
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!termsAccepted) { setError("You must accept the terms and conditions"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          password,
          termsAccepted,
          otpSessionKey: sessionKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    details: "Your details",
    otp: "Verify phone",
    password: "Set password",
  };
  const stepNumbers: Record<Step, number> = { details: 1, otp: 2, password: 3 };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8 bg-white ring-1 ring-gray-100 shadow-lg">

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Slip a Tip" width={44} height={44} quality={95} priority className="h-11 w-11 object-contain" />
              <span className="text-base font-semibold text-gray-700 tracking-wide">Slip a Tip</span>
            </Link>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(["details", "otp", "password"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  stepNumbers[step] > i + 1 ? "bg-green-500 text-white" :
                  step === s ? "bg-sky-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {stepNumbers[step] > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? "text-gray-900" : "text-gray-400"}`}>{stepLabels[s]}</span>
                {i < 2 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          <div className="mt-3 px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-700 mb-6">
            For workers with a <strong>physical QR code card</strong>. No card?{" "}
            <Link href="/apply" className="underline font-semibold">Apply here</Link>.
          </div>

          {/* ── Step 1: Details ── */}
          {step === "details" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
              <p className="text-sm text-gray-500">We&apos;ll send a verification code to your phone.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" placeholder="John" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">South African Mobile Number</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="e.g. 071 000 0001" />
                <p className="mt-1 text-[10px] text-gray-400">A 6-digit verification code will be sent to this number via SMS.</p>
              </div>

              {error && <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-600 rounded-lg">{error}</div>}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending code…" : "Send verification code"}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Verify your phone</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the 6-digit code sent to <span className="text-gray-900 font-medium">{phone}</span>
                </p>
              </div>

              {/* OTP digit boxes */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                      digit ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-gray-200 text-gray-900"
                    }`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-600 rounded-lg">{error}</div>}

              <button type="submit" disabled={loading || otp.join("").length !== 6} className="btn-primary w-full">
                {loading ? "Verifying…" : "Verify code"}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-sky-600 hover:text-sky-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                <br />
                <button type="button" onClick={() => { setStep("details"); setOtp(["","","","","",""]); setError(""); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  ← Change phone number
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Password ── */}
          {step === "password" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Set your password</h1>
                <p className="text-sm text-gray-500 mt-1">Phone verified ✓ — create a strong password to secure your account.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min 8 chars, upper + lower + number + symbol" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password</label>
                <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Repeat your password" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5 relative">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="sr-only" />
                  <div className={`w-4 h-4 rounded border transition-all ${termsAccepted ? "bg-sky-500 border-sky-500" : "border-gray-300 bg-white"}`}>
                    {termsAccepted && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                  I agree to the{" "}
                  <Link href="/legal/terms" target="_blank" className="text-sky-600 hover:text-sky-700 underline">Terms & Conditions</Link>,{" "}
                  <Link href="/legal/privacy" target="_blank" className="text-sky-600 hover:text-sky-700 underline">Privacy Policy</Link>, and{" "}
                  <Link href="/legal/fica" target="_blank" className="text-sky-600 hover:text-sky-700 underline">FICA requirements</Link>.
                </span>
              </label>

              {error && <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-600 rounded-lg">{error}</div>}

              <button type="submit" disabled={loading || !termsAccepted} className="btn-primary w-full">
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Sign in</Link>
            </p>
            <p className="text-center text-xs text-gray-400">
              No physical QR card?{" "}
              <Link href="/apply" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Apply to get one</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

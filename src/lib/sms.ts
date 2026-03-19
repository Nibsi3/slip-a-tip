/**
 * SMS notification utility (South African numbers, +27 format).
 * Uses the Demakatso SMS API — same provider as OTP sending.
 */

function toInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length === 9) return `+27${digits}`;
  return `+${digits}`;
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const smsUsername = process.env.SMS_USERNAME;
  const smsPassword = process.env.SMS_PASSWORD;
  const smsApiUrl = process.env.SMS_API_URL;

  if (!smsUsername || !smsPassword || !smsApiUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV SMS] To ${phone}: ${message}`);
    }
    return;
  }

  const internationalPhone = toInternational(phone);

  try {
    const res = await fetch(smsApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: smsUsername,
        password: smsPassword,
        to: internationalPhone,
        content: message,
        Refno: Date.now().toString().slice(-8),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`[SMS] Failed to send to ${internationalPhone}: HTTP ${res.status} — ${text}`);
    } else {
      console.log(`[SMS] Sent to ${internationalPhone}: ${text}`);
    }
  } catch (err) {
    console.error(`[SMS] Error sending to ${internationalPhone}:`, err);
  }
}

export async function sendRegistrationSuccessSms(phone: string, firstName: string): Promise<void> {
  await sendSms(
    phone,
    `Hi ${firstName}, welcome to Slip a Tip! Your account has been successfully created. Log in at slipatip.co.za to set up your profile and start receiving tips.`
  );
}

export async function sendFicaApprovedSms(phone: string, firstName: string): Promise<void> {
  await sendSms(
    phone,
    `Hi ${firstName}, great news! Your Slip a Tip identity verification has been approved. You can now withdraw your earnings. Log in at slipatip.co.za`
  );
}

export async function sendFicaRejectedSms(phone: string, firstName: string, reason?: string): Promise<void> {
  const reasonText = reason ? ` Reason: ${reason}.` : "";
  await sendSms(
    phone,
    `Hi ${firstName}, your Slip a Tip documents could not be verified.${reasonText} Please re-upload from your dashboard. Visit slipatip.co.za`
  );
}

export async function sendSettlementClearedSms(
  phone: string,
  firstName: string,
  amount: number
): Promise<void> {
  await sendSms(
    phone,
    `Hi ${firstName}, R${amount.toFixed(2)} has cleared and is now available for withdrawal in your Slip a Tip wallet. Log in at slipatip.co.za`
  );
}

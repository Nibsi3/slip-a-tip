/**
 * POST /api/whatsapp/setup-profile
 * Admin-only endpoint to update the WhatsApp Business profile:
 * - Profile photo (logo)
 * - About text (bio)
 * - Business description
 * - Website
 * - Email
 *
 * Call this once after deployment to set the profile up professionally.
 * Requires WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars.
 */

import { NextRequest, NextResponse } from "next/server";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

function getWaConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set");
  }
  return { phoneNumberId, accessToken };
}

export async function POST(req: NextRequest) {
  // Basic admin auth via secret header
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumberId, accessToken } = getWaConfig();
  const results: Record<string, unknown> = {};

  // ── 1. Update business profile (about, description, websites, email) ──
  const profileRes = await fetch(
    `${GRAPH_BASE}/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        about: "Cashless digital tipping for South Africa's service industry.",
        description:
          "Slip a Tip enables cashless digital tipping via QR codes. Workers receive tips directly — no cash needed. Scan, tip, done.",
        websites: [
          "https://www.slipatip.co.za",
          "https://www.instagram.com/slip_a_tip/",
        ],
        email: "support@slipatip.co.za",
        vertical: "FINANCE",
      }),
    }
  );

  const profileJson = await profileRes.json();
  results.profile = { status: profileRes.status, body: profileJson };

  // ── 2. Upload profile photo ──
  // WhatsApp requires uploading the image as a multipart form upload first,
  // then setting it via the profile photo endpoint.
  // We fetch our own logo and upload it.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.slipatip.co.za";
  try {
    const logoRes = await fetch(`${appUrl}/logo.png`);
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();

      // Step 2a: Upload media
      const formData = new FormData();
      formData.append("file", logoBlob, "logo.png");
      formData.append("type", "image/png");
      formData.append("messaging_product", "whatsapp");

      const uploadRes = await fetch(
        `${GRAPH_BASE}/${phoneNumberId}/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        }
      );
      const uploadJson = await uploadRes.json();
      results.mediaUpload = { status: uploadRes.status, body: uploadJson };

      // Step 2b: Set as profile photo
      if (uploadJson?.id) {
        const photoRes = await fetch(
          `${GRAPH_BASE}/${phoneNumberId}/whatsapp_business_profile`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              profile_picture_handle: uploadJson.id,
            }),
          }
        );
        const photoJson = await photoRes.json();
        results.profilePhoto = { status: photoRes.status, body: photoJson };
      }
    } else {
      results.mediaUpload = { error: "Could not fetch logo from app URL" };
    }
  } catch (err) {
    results.mediaUpload = { error: String(err) };
  }

  return NextResponse.json({ success: true, results });
}

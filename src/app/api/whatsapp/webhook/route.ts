/**
 * WhatsApp Cloud API Webhook
 * Handles:
 *  1. GET  — webhook verification challenge from Meta
 *  2. POST — incoming messages & status updates (delivered, read, failed)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — Meta webhook verification
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("[WA webhook] WHATSAPP_VERIFY_TOKEN not set");
    return new NextResponse("Configuration error", { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WA webhook] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WA webhook] Verification failed — token mismatch");
  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming events from Meta
// ---------------------------------------------------------------------------
interface WaStatusUpdate {
  id: string;          // WhatsApp message ID (wamid)
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string }[];
}

interface WaIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WaWebhookPayload {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata?: { display_phone_number: string; phone_number_id: string };
        statuses?: WaStatusUpdate[];
        messages?: WaIncomingMessage[];
        errors?: { code: number; title: string; message: string }[];
      };
      field: string;
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WaWebhookPayload;

    if (body.object !== "whatsapp_business_account") {
      return new NextResponse("OK");
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        // Handle message status updates (sent → delivered → read)
        for (const status of value.statuses ?? []) {
          await handleStatusUpdate(status);
        }

        // Handle incoming messages (customer replies — log them)
        for (const message of value.messages ?? []) {
          await handleIncomingMessage(message);
        }
      }
    }

    return new NextResponse("OK");
  } catch (err) {
    console.error("[WA webhook] Error:", err);
    // Always return 200 to Meta to prevent retries on parse errors
    return new NextResponse("OK");
  }
}

// ---------------------------------------------------------------------------
// Status update handler — tracks read receipts on tips
// ---------------------------------------------------------------------------
async function handleStatusUpdate(status: WaStatusUpdate) {
  console.log(`[WA webhook] Status update: ${status.status} for message ${status.id}`);

  if (status.status === "failed") {
    console.error(`[WA webhook] Message ${status.id} failed:`, status.errors);
  }

  // If a message was read, that's a strong signal the customer saw the link.
  // Log it to the audit log for visibility — not strictly required.
  if (status.status === "read") {
    await db.auditLog.create({
      data: {
        action: "WHATSAPP_MESSAGE_READ",
        entity: "WhatsApp",
        details: {
          messageId: status.id,
          recipientPhone: status.recipient_id,
          timestamp: status.timestamp,
        },
      },
    }).catch((err) => console.error("[WA webhook] Audit log error:", err));
  }
}

// ---------------------------------------------------------------------------
// Incoming message handler — customers can reply to the bot
// ---------------------------------------------------------------------------
async function handleIncomingMessage(message: WaIncomingMessage) {
  console.log(`[WA webhook] Incoming message from ${message.from}: type=${message.type}`);

  // Log all incoming messages for support purposes
  await db.auditLog.create({
    data: {
      action: "WHATSAPP_INCOMING_MESSAGE",
      entity: "WhatsApp",
      details: {
        from: message.from,
        messageId: message.id,
        type: message.type,
        text: message.text?.body,
        timestamp: message.timestamp,
      },
    },
  }).catch((err) => console.error("[WA webhook] Audit log error:", err));
}

/**
 * Cron: WhatsApp follow-up reminders
 *
 * Sends a follow-up message to customers who received a payment link
 * but have NOT paid within 5 hours.
 *
 * Rules:
 * - Only tips that are still PENDING
 * - whatsappLinkSentAt is between 5h and 23h ago (inside 24h window, but past 5h)
 * - followUpSentAt is null (not already sent)
 * - paymentLinkUrl and customerPhone are set
 *
 * IMPORTANT: The 24h window for free WhatsApp messages starts when the
 * customer first messages us (or in this flow, when they interact with
 * the QR scan page). Technically this follow-up at 5h is still within
 * the 24h conversation window opened by our initial message.
 * If sent AFTER 24h, a pre-approved template is required — configured via
 * WHATSAPP_FOLLOWUP_TEMPLATE_NAME env var.
 *
 * Protect with CRON_SECRET header: x-cron-secret
 * Recommended schedule: every 30 minutes
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendFollowUpReminder } from "@/lib/whatsapp";

const FOLLOW_UP_AFTER_HOURS = 5;
const FOLLOW_UP_CUTOFF_HOURS = 23; // Don't send follow-up if link expires in < 1 hour

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const fiveHoursAgo = new Date(now.getTime() - FOLLOW_UP_AFTER_HOURS * 60 * 60 * 1000);
  const twentyThreeHoursAgo = new Date(now.getTime() - FOLLOW_UP_CUTOFF_HOURS * 60 * 60 * 1000);

  // Find tips eligible for follow-up
  const pendingTips = await db.tip.findMany({
    where: {
      status: "PENDING",
      followUpSentAt: null,
      customerPhone: { not: null },
      paymentLinkUrl: { not: null },
      whatsappLinkSentAt: {
        lte: fiveHoursAgo,       // sent more than 5 hours ago
        gte: twentyThreeHoursAgo, // sent less than 23 hours ago (link still valid)
      },
    },
    include: {
      worker: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    take: 100, // Safety cap per run
  });

  if (pendingTips.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const tip of pendingTips) {
    // Double-check status (race condition guard — tip may have just been paid)
    const fresh = await db.tip.findUnique({
      where: { id: tip.id },
      select: { status: true, followUpSentAt: true },
    });

    if (!fresh || fresh.status !== "PENDING" || fresh.followUpSentAt !== null) {
      skipped++;
      continue;
    }

    try {
      const result = await sendFollowUpReminder({
        customerPhone: tip.customerPhone!,
        customerName: tip.customerName ?? undefined,
        workerFirstName: tip.worker.user.firstName,
        paymentLinkUrl: tip.paymentLinkUrl!,
        amountZAR: Number(tip.amount),
        paymentId: tip.paymentId,
      });

      if (result) {
        await db.tip.update({
          where: { id: tip.id },
          data: { followUpSentAt: now },
        });

        await db.auditLog.create({
          data: {
            action: "WHATSAPP_FOLLOWUP_SENT",
            entity: "Tip",
            entityId: tip.id,
            details: {
              paymentId: tip.paymentId,
              customerPhone: tip.customerPhone,
              whatsappMessageId: result.messageId,
              hoursAfterLink: FOLLOW_UP_AFTER_HOURS,
            },
          },
        });

        sent++;
      } else {
        errors.push(`tip ${tip.id}: WhatsApp send returned null`);
        skipped++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`tip ${tip.id}: ${msg}`);
      skipped++;
      console.error(`[cron/whatsapp-followup] Error for tip ${tip.id}:`, err);
    }
  }

  console.log(`[cron/whatsapp-followup] sent=${sent} skipped=${skipped} errors=${errors.length}`);

  return NextResponse.json({
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

// 10 bytes → 14-char base64url = 1.2 quintillion combinations
function generateToken(): string {
  return crypto.randomBytes(10).toString("base64url").slice(0, 14);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const count = Math.min(Math.max(parseInt(body.count) || 10, 1), 5000);
    const batchId = `batch-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // Generate candidate tokens — oversample by 20% to account for any collisions
    const candidateSet = new Set<string>();
    while (candidateSet.size < count + Math.ceil(count * 0.2)) {
      candidateSet.add(generateToken());
    }
    const candidates = Array.from(candidateSet);

    // Check ALL candidates against the database for existing tokens
    const existingRecords = await db.qRCode.findMany({
      where: { token: { in: candidates } },
      select: { token: true },
    });
    const existingTokens = new Set(existingRecords.map((r) => r.token));

    // Filter out any that already exist in DB
    const uniqueTokens = candidates.filter((t) => !existingTokens.has(t));

    if (uniqueTokens.length < count) {
      return NextResponse.json(
        { error: "Could not generate enough unique tokens. Please try again." },
        { status: 500 }
      );
    }

    // Take exactly the number requested
    const tokens = uniqueTokens.slice(0, count);

    // Bulk create QR codes (token column has a UNIQUE constraint in DB as extra safety)
    const created = await db.qRCode.createMany({
      data: tokens.map((token) => ({
        token,
        batchId,
        status: "INACTIVE" as const,
      })),
      skipDuplicates: true,
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "QR_BATCH_GENERATE",
        entity: "QRCode",
        details: { batchId, count: created.count },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      batchId,
      count: created.count,
    });
  } catch (err) {
    console.error("QR generate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

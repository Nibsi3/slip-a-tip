import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const qrCode = await db.qRCode.findUnique({
    where: { token },
    select: { status: true },
  });

  if (!qrCode) {
    return NextResponse.json({ status: "NOT_FOUND" });
  }

  return NextResponse.json({ status: qrCode.status });
}

import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { visitorId } = params;
    const cards = await storage.getVisitorFinalizedCards(visitorId);
    return NextResponse.json(cards);
  } catch (error) {
    console.error("Visitor finalized cards fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finalized cards" },
      { status: 500 }
    );
  }
}

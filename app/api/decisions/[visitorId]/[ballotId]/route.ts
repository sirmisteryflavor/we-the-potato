import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { visitorId: string; ballotId: string } }
) {
  try {
    const { visitorId, ballotId } = params;
    const decisions = await storage.getDecisions(visitorId, ballotId);

    if (!decisions) {
      return NextResponse.json(
        { error: "Decisions not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Decisions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}

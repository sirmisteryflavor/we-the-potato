import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

const SUPPORTED_STATES = ["NY", "NJ", "PA", "CT", "TX"];

export async function GET(
  request: NextRequest,
  { params }: { params: { state: string } }
) {
  try {
    const { state } = params;
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId") || undefined;

    if (!SUPPORTED_STATES.includes(state)) {
      return NextResponse.json(
        { error: "State not supported" },
        { status: 400 }
      );
    }

    const events = await storage.getElectionEvents(state, visitorId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

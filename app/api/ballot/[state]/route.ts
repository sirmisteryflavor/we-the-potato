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
    const county = searchParams.get("county") || undefined;

    if (!SUPPORTED_STATES.includes(state)) {
      return NextResponse.json(
        { error: "State not supported" },
        { status: 400 }
      );
    }

    const ballot = await storage.getBallot(state, county);

    if (!ballot) {
      return NextResponse.json(
        { error: "Ballot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ballot);
  } catch (error) {
    console.error("Ballot fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ballot" },
      { status: 500 }
    );
  }
}

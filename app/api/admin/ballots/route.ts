import { NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET() {
  try {
    const allBallots = await storage.getAllBallots();
    return NextResponse.json(allBallots);
  } catch (error) {
    console.error("Ballots fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ballots" },
      { status: 500 }
    );
  }
}

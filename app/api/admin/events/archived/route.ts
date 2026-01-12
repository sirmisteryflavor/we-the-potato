import { NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET() {
  try {
    const events = await storage.getArchivedElectionEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Get archived events error:", error);
    return NextResponse.json(
      { error: "Failed to get archived events" },
      { status: 500 }
    );
  }
}

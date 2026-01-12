import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const ballot = await storage.saveBallot(body);
    return NextResponse.json(ballot);
  } catch (error) {
    console.error("Ballot update error:", error);
    return NextResponse.json(
      { error: "Failed to update ballot" },
      { status: 500 }
    );
  }
}

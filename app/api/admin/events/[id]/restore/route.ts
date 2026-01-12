import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const event = await storage.restoreElectionEvent(id);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Restore event error:", error);
    return NextResponse.json(
      { error: "Failed to restore event" },
      { status: 500 }
    );
  }
}

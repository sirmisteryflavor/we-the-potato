import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function POST(request: NextRequest) {
  try {
    const { visitorId, eventId } = await request.json();

    if (!visitorId || !eventId) {
      return NextResponse.json(
        { error: "Missing visitorId or eventId" },
        { status: 400 }
      );
    }

    await storage.unsubscribeFromEvent(visitorId, eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from event" },
      { status: 500 }
    );
  }
}

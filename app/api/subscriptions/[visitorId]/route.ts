import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { visitorId } = params;
    const events = await storage.getSubscribedEvents(visitorId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Subscriptions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

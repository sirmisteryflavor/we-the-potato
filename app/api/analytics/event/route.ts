import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";
import { z } from "zod";

const analyticsEventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.unknown()).optional(),
  visitorId: z.string().optional(),
  state: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyticsEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event data" },
        { status: 400 }
      );
    }

    await storage.trackEvent(
      parsed.data.eventType,
      parsed.data.eventData || {},
      parsed.data.visitorId,
      parsed.data.state
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

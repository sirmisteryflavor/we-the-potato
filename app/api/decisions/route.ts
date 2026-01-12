import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";
import { z } from "zod";

const decisionsSchema = z.object({
  visitorId: z.string(),
  ballotId: z.string(),
  eventId: z.string().optional(),
  measureDecisions: z.record(z.object({
    decision: z.enum(["yes", "no", "undecided"]),
    note: z.string().optional(),
  })),
  candidateSelections: z.record(z.string()),
  notes: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = decisionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid decisions data", details: parsed.error },
        { status: 400 }
      );
    }

    const decisions = await storage.saveDecisions({
      ...parsed.data,
      notes: parsed.data.notes || {},
    });

    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Decisions save error:", error);
    return NextResponse.json(
      { error: "Failed to save decisions" },
      { status: 500 }
    );
  }
}

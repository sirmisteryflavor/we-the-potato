import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";
import { z } from "zod";

const finalizedVoterCardSchema = z.object({
  id: z.string(),
  visitorId: z.string(),
  eventId: z.string(),
  ballotId: z.string().nullable().optional(),
  template: z.enum(["minimal", "bold", "professional"]),
  location: z.string(),
  state: z.string().optional(),
  electionDate: z.string(),
  electionType: z.string(),
  decisions: z.array(z.object({
    type: z.enum(["measure", "candidate"]),
    title: z.string(),
    decision: z.string(),
    hidden: z.boolean().optional(),
    note: z.string().optional(),
    description: z.string().optional(),
  })),
  showNotes: z.boolean().optional(),
  shareUrl: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = finalizedVoterCardSchema.safeParse(body);

    if (!parsed.success) {
      console.log("Validation failed:", JSON.stringify(parsed.error.issues, null, 2));
      return NextResponse.json(
        { error: "Invalid finalized card data", details: parsed.error },
        { status: 400 }
      );
    }

    const card = await storage.saveFinalizedVoterCard({
      ...parsed.data,
      userId: null,
      ballotId: parsed.data.ballotId ?? null,
      state: parsed.data.state ?? null,
      showNotes: parsed.data.showNotes ?? true,
      isPublic: true,
      shareUrl: parsed.data.shareUrl ?? null,
    });

    const host = request.headers.get("host") || "wethepotato.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";

    return NextResponse.json({
      ...card,
      shareUrl: `${protocol}://${host}/card/${card.id}`,
    });
  } catch (error) {
    console.error("Error saving card:", error);
    return NextResponse.json(
      { error: "Failed to save finalized card" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";
import { z } from "zod";

const voterCardSchema = z.object({
  id: z.string(),
  template: z.enum(["minimal", "bold", "professional"]),
  location: z.string(),
  electionDate: z.string(),
  electionType: z.string(),
  decisions: z.array(z.object({
    type: z.enum(["measure", "candidate"]),
    title: z.string(),
    decision: z.string(),
    hidden: z.boolean().optional(),
    note: z.string().optional(),
  })),
  shareUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = voterCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid voter card data" },
        { status: 400 }
      );
    }

    const card = await storage.saveVoterCard(parsed.data);

    const host = request.headers.get("host") || "wethepotato.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";

    return NextResponse.json({
      ...card,
      shareUrl: `${protocol}://${host}/card/${card.id}`,
    });
  } catch (error) {
    console.error("Voter card save error:", error);
    return NextResponse.json(
      { error: "Failed to save voter card" },
      { status: 500 }
    );
  }
}

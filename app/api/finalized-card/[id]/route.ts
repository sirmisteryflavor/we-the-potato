import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const card = await storage.getFinalizedVoterCardById(id);

    if (!card) {
      return NextResponse.json(
        { error: "Finalized card not found" },
        { status: 404 }
      );
    }

    // For visitor-based auth, public cards are always accessible
    // Private cards can only be accessed by the owner via visitorId
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId");

    if (!card.isPublic && card.visitorId !== visitorId) {
      return NextResponse.json(
        { error: "This voter card is private" },
        { status: 403 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Finalized card fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finalized card" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { visitorId } = body;

    const existingCard = await storage.getFinalizedVoterCardById(id);
    if (!existingCard) {
      return NextResponse.json(
        { error: "Finalized card not found" },
        { status: 404 }
      );
    }

    // Only allow owner (by visitorId) to edit
    if (existingCard.visitorId !== visitorId) {
      return NextResponse.json(
        { error: "You can only edit your own cards" },
        { status: 403 }
      );
    }

    const card = await storage.updateFinalizedVoterCard(id, body);
    return NextResponse.json(card);
  } catch (error) {
    console.error("Finalized card update error:", error);
    return NextResponse.json(
      { error: "Failed to update finalized card" },
      { status: 500 }
    );
  }
}

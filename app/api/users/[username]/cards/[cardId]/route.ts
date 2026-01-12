import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string; cardId: string } }
) {
  try {
    const { username, cardId } = params;
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const card = await storage.getFinalizedVoterCardById(cardId);

    if (!card || card.userId !== user.id) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error fetching user card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

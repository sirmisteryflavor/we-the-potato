import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const cards = await storage.getUserFinalizedCards(user.id);
    // Only return public cards
    const publicCards = cards.filter(card => card.isPublic);

    return NextResponse.json(publicCards);
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch user cards" },
      { status: 500 }
    );
  }
}

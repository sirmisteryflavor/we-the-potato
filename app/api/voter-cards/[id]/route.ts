import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const card = await storage.getVoterCard(id);

    if (!card) {
      return NextResponse.json(
        { error: "Voter card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Voter card fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voter card" },
      { status: 500 }
    );
  }
}

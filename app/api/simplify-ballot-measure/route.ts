import { NextRequest, NextResponse } from "next/server";
import { simplifyBallotMeasure } from "@/lib/anthropic";
import { z } from "zod";

const simplifyRequestSchema = z.object({
  originalText: z.string().min(1),
  title: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = simplifyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { originalText, title } = parsed.data;
    const simplified = await simplifyBallotMeasure(originalText, title);

    return NextResponse.json(simplified);
  } catch (error) {
    console.error("Simplification error:", error);
    return NextResponse.json(
      { error: "Failed to simplify ballot measure" },
      { status: 500 }
    );
  }
}

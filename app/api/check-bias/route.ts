import { NextRequest, NextResponse } from "next/server";
import { checkBias } from "@/lib/anthropic";
import { z } from "zod";

const biasCheckSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(["summary", "argument"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = biasCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { content, contentType } = parsed.data;
    const result = await checkBias(content, contentType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bias check error:", error);
    return NextResponse.json(
      { error: "Failed to check bias" },
      { status: 500 }
    );
  }
}

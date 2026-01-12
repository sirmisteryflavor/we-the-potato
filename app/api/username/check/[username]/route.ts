import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";
import { usernameSchema } from "@/lib/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    // Validate username format
    const parseResult = usernameSchema.safeParse(username);
    if (!parseResult.success) {
      return NextResponse.json({
        available: false,
        error: parseResult.error.errors[0]?.message || "Invalid username format",
      });
    }

    const isAvailable = await storage.isUsernameAvailable(username);
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}

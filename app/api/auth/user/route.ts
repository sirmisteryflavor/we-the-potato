import { NextResponse } from "next/server";

export async function GET() {
  // Visitor-based auth - always return 401 for this endpoint
  return NextResponse.json(
    { message: "Unauthorized" },
    { status: 401 }
  );
}

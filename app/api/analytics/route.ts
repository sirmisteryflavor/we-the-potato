import { NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

export async function GET() {
  try {
    const analytics = await storage.getAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

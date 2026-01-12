import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage-server";

const SUPPORTED_STATES = ["NY", "NJ", "PA", "CT", "TX"];

export async function GET() {
  try {
    const allEvents = await storage.getAllElectionEvents();
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Admin events fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { state, county, title, eventType, electionDate, registrationDeadline, description, visibility } = await request.json();

    if (!state || !title || !eventType || !electionDate) {
      return NextResponse.json(
        { error: "Missing required fields: state, title, eventType, electionDate" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_STATES.includes(state.toUpperCase())) {
      return NextResponse.json(
        { error: "State not supported" },
        { status: 400 }
      );
    }

    const id = `${state.toLowerCase()}-${eventType}-${Date.now()}`;

    const event = await storage.createElectionEvent({
      id,
      state: state.toUpperCase(),
      county: county || null,
      title,
      eventType,
      electionDate,
      registrationDeadline: registrationDeadline || null,
      description: description || null,
      status: "upcoming",
      visibility: visibility || "private",
      archived: false,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

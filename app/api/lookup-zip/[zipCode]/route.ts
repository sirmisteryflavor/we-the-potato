import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zipcodes } from "@/lib/schema";
import { eq } from "drizzle-orm";

const SUPPORTED_STATES = ["NY", "NJ", "PA", "CT", "TX"];

export async function GET(
  request: NextRequest,
  { params }: { params: { zipCode: string } }
) {
  const { zipCode } = params;

  if (!/^\d{5}$/.test(zipCode)) {
    return NextResponse.json(
      { error: "Invalid ZIP code format" },
      { status: 400 }
    );
  }

  try {
    const result = await db()
      .select()
      .from(zipcodes)
      .where(eq(zipcodes.zipcode, zipCode))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "ZIP code not found", supported: false },
        { status: 404 }
      );
    }

    const location = result[0];

    if (!SUPPORTED_STATES.includes(location.state)) {
      return NextResponse.json(
        {
          error: `${location.state} is not in our pilot program`,
          supported: false,
          state: location.state,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      state: location.state,
      county: location.county,
      city: location.city,
      supported: true,
    });
  } catch (error) {
    console.error("Error looking up zipcode:", error);
    return NextResponse.json(
      { error: "Failed to look up ZIP code" },
      { status: 500 }
    );
  }
}

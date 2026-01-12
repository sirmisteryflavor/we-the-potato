import { NextRequest, NextResponse } from "next/server";

const ZIP_TO_STATE: Record<string, { state: string; county: string }> = {
  "10001": { state: "NY", county: "New York" },
  "10002": { state: "NY", county: "New York" },
  "10003": { state: "NY", county: "New York" },
  "11201": { state: "NY", county: "Kings" },
  "11211": { state: "NY", county: "Kings" },
  "11215": { state: "NY", county: "Kings" },
  "10451": { state: "NY", county: "Bronx" },
  "11101": { state: "NY", county: "Queens" },
  "10301": { state: "NY", county: "Richmond" },
  "07101": { state: "NJ", county: "Essex" },
  "07102": { state: "NJ", county: "Essex" },
  "08601": { state: "NJ", county: "Mercer" },
  "19101": { state: "PA", county: "Philadelphia" },
  "19102": { state: "PA", county: "Philadelphia" },
  "15201": { state: "PA", county: "Allegheny" },
  "06101": { state: "CT", county: "Hartford" },
  "06102": { state: "CT", county: "Hartford" },
  "06510": { state: "CT", county: "New Haven" },
  "75201": { state: "TX", county: "Dallas" },
  "75202": { state: "TX", county: "Dallas" },
  "77001": { state: "TX", county: "Harris" },
  "77002": { state: "TX", county: "Harris" },
  "78201": { state: "TX", county: "Bexar" },
  "73301": { state: "TX", county: "Travis" },
};

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

  const location = ZIP_TO_STATE[zipCode];

  if (!location) {
    return NextResponse.json(
      { error: "ZIP code not found", supported: false },
      { status: 404 }
    );
  }

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
    ...location,
    supported: true,
  });
}

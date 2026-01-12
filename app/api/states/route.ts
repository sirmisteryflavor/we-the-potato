import { NextResponse } from "next/server";

const SUPPORTED_STATES = ["NY", "NJ", "PA", "CT", "TX"];

export async function GET() {
  return NextResponse.json({
    supported: SUPPORTED_STATES,
    pilot: true,
  });
}

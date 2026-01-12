import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { races, candidates, raceCandidates, candidateEndorsements } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * GET /api/races/by-state/[state]
 *
 * Returns all races for a given state (all years and types).
 * Useful for displaying comprehensive election information.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { state: string } }
) {
  const { state } = params;

  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json(
      { error: "Invalid state code format" },
      { status: 400 }
    );
  }

  try {
    const db_instance = db();

    // 1. Get all races for this state
    const raceList = await db_instance
      .select()
      .from(races)
      .where(eq(races.state, state));

    if (raceList.length === 0) {
      return NextResponse.json({
        state,
        races: [],
      });
    }

    // 2. For each race, get candidates with endorsements
    const racesWithCandidates = await Promise.all(
      raceList.map(async (race) => {
        // Get candidates for this race
        const raceCandidatesData = await db_instance
          .select()
          .from(raceCandidates)
          .where(eq(raceCandidates.raceId, race.id));

        const candidateIds = raceCandidatesData.map((rc) => rc.candidateId);

        const candidateList = candidateIds.length > 0
          ? await db_instance
              .select()
              .from(candidates)
              .where(inArray(candidates.id, candidateIds))
          : [];

        // Get endorsements for each candidate
        const candidatesWithEndorsements = await Promise.all(
          candidateList.map(async (candidate) => {
            const endorsements = await db_instance
              .select()
              .from(candidateEndorsements)
              .where(eq(candidateEndorsements.candidateId, candidate.id));

            return {
              id: candidate.id,
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              party: candidate.party,
              incumbentStatus: candidate.incumbentStatus,
              photoUrl: candidate.photoUrl,
              websiteUrl: candidate.websiteUrl,
              bio: candidate.bio,
              position: candidate.position,
              endorsements: endorsements.map((e) => ({
                organization: e.organization,
                endorsementType: e.endorsementType,
                notes: e.notes,
              })),
            };
          })
        );

        return {
          id: race.id,
          electionYear: race.electionYear,
          state: race.state,
          raceType: race.raceType,
          office: race.office,
          position: race.position,
          isPrimary: race.isPrimary,
          primaryType: race.primaryType,
          description: race.description,
          candidates: candidatesWithEndorsements,
        };
      })
    );

    return NextResponse.json({
      state,
      races: racesWithCandidates,
    });
  } catch (error) {
    console.error("Error fetching races for state:", error);
    return NextResponse.json(
      { error: "Failed to fetch races" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { races, candidates, raceCandidates, candidateEndorsements } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * GET /api/candidates/race/[raceId]
 *
 * Returns all candidates for a given race with their endorsements.
 * Used to display detailed candidate information for a specific race.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { raceId: string } }
) {
  const { raceId } = params;

  try {
    const db_instance = db();

    // 1. Verify race exists
    const race = await db_instance
      .select()
      .from(races)
      .where(eq(races.id, raceId))
      .limit(1);

    if (race.length === 0) {
      return NextResponse.json(
        { error: "Race not found" },
        { status: 404 }
      );
    }

    const raceData = race[0];

    // 2. Get all candidates for this race
    const raceCandidatesData = await db_instance
      .select()
      .from(raceCandidates)
      .where(eq(raceCandidates.raceId, raceId));

    const candidateIds = raceCandidatesData.map((rc) => rc.candidateId);

    const candidateList = candidateIds.length > 0
      ? await db_instance
          .select()
          .from(candidates)
          .where(inArray(candidates.id, candidateIds))
      : [];

    // 3. Get endorsements for each candidate
    const candidatesWithEndorsements = await Promise.all(
      candidateList.map(async (candidate) => {
        const endorsements = await db_instance
          .select()
          .from(candidateEndorsements)
          .where(eq(candidateEndorsements.candidateId, candidate.id));

        // Find race candidate data for this specific race
        const raceCandidateRecord = raceCandidatesData.find(
          (rc) => rc.candidateId === candidate.id
        );

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
          primaryVotes: raceCandidateRecord?.primaryVotes,
          primaryPercentage: raceCandidateRecord?.primaryPercentage,
          isWonPrimary: raceCandidateRecord?.isWonPrimary,
          endorsements: endorsements.map((e) => ({
            organization: e.organization,
            endorsementType: e.endorsementType,
            notes: e.notes,
          })),
        };
      })
    );

    return NextResponse.json({
      race: {
        id: raceData.id,
        electionYear: raceData.electionYear,
        state: raceData.state,
        raceType: raceData.raceType,
        office: raceData.office,
        position: raceData.position,
        isPrimary: raceData.isPrimary,
        primaryType: raceData.primaryType,
        description: raceData.description,
      },
      candidates: candidatesWithEndorsements,
    });
  } catch (error) {
    console.error("Error fetching candidates for race:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

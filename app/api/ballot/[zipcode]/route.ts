import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  zipcodes,
  zipcodeDistricts,
  races,
  candidates,
  raceCandidates,
  candidateEndorsements,
  ballotMeasures2,
  ballots,
  electionEvents,
} from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * GET /api/ballot/[zipcode]
 *
 * Returns the complete ballot for a zipcode, including:
 * - All relevant races (federal, state, local)
 * - Candidates in each race with endorsements
 * - All ballot measures for the state/county
 *
 * This is the primary endpoint used to generate voter cards.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { zipcode: string } }
) {
  const { zipcode } = params;

  if (!/^\d{5}$/.test(zipcode)) {
    return NextResponse.json(
      { error: "Invalid ZIP code format" },
      { status: 400 }
    );
  }

  try {
    const db_instance = db();

    // 1. Verify zipcode exists
    const zipcodeRecord = await db_instance
      .select()
      .from(zipcodes)
      .where(eq(zipcodes.zipcode, zipcode))
      .limit(1);

    if (zipcodeRecord.length === 0) {
      return NextResponse.json(
        { error: "ZIP code not found" },
        { status: 404 }
      );
    }

    const location = zipcodeRecord[0];

    // 2. Get all districts for this zipcode
    const districtLinks = await db_instance
      .select()
      .from(zipcodeDistricts)
      .where(eq(zipcodeDistricts.zipcode, zipcode));

    const districtIds = districtLinks.map((link) => link.districtId!);

    // 3. Get all races for these districts
    let racesWithCandidates: any[] = [];
    if (districtIds.length > 0) {
      const raceList = await db_instance
        .select()
        .from(races)
        .where(inArray(races.districtId, districtIds));

      // 4. For each race, get candidates with endorsements
      racesWithCandidates = await Promise.all(
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
    }

    // 5. Get ballot measures for this state
    const measures = await db_instance
      .select()
      .from(ballotMeasures2)
      .where((t) => eq(t.state, location.state));

    const ballotMeasures = measures.map((measure) => ({
      id: measure.id,
      electionYear: measure.electionYear,
      measureNumber: measure.measureNumber,
      title: measure.title,
      shortTitle: measure.shortTitle,
      description: measure.description,
      type: measure.type,
      fiscalImpact: measure.fiscalImpact,
      proArguments: measure.proArguments || [],
      conArguments: measure.conArguments || [],
    }));

    // 6. Save ballot to database for future reference and analytics
    // Use the primary 2026 NY election event for now
    try {
      const primaryEvent = await db_instance
        .select()
        .from(electionEvents)
        .where(eq(electionEvents.id, "2026-NY-DEMOCRATIC-PRIMARY"))
        .limit(1);

      if (primaryEvent.length > 0) {
        const ballotId = `ballot-${zipcode}-${primaryEvent[0].id}`;

        // Extract race IDs for indexing
        const raceIds = racesWithCandidates.map(r => r.id);
        const measureIds = ballotMeasures.map(m => m.id);

        // Flatten all candidates for full-text search in future
        const allCandidates = racesWithCandidates.flatMap((race: any) =>
          race.candidates.map((candidate: any) => ({
            ...candidate,
            office: race.office,
            raceId: race.id,
          }))
        );

        // Save or update ballot
        await db_instance
          .insert(ballots)
          .values({
            id: ballotId,
            eventId: primaryEvent[0].id,
            state: location.state,
            county: location.county,
            city: location.city,
            zipcode: zipcode,
            electionDate: primaryEvent[0].electionDate,
            electionType: "primary",
            raceIds: JSON.stringify(raceIds),
            measureIds: JSON.stringify(measureIds),
            racesCount: racesWithCandidates.length,
            measuresCount: ballotMeasures.length,
            races: racesWithCandidates as any,
            measures: ballotMeasures as any,
            candidates: allCandidates as any,
          })
          .onConflictDoNothing();
      }
    } catch (ballotError) {
      // Log but don't fail - ballot storage is optional for the API
      console.error("Failed to save ballot to database:", ballotError);
    }

    return NextResponse.json({
      zipcode,
      state: location.state,
      county: location.county,
      city: location.city,
      races: racesWithCandidates,
      ballotMeasures: ballotMeasures,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching ballot for zipcode:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to fetch ballot", details: errorMessage },
      { status: 500 }
    );
  }
}

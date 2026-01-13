import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";
import { districts, zipcodeDistricts, races, candidates, raceCandidates, candidateEndorsements, electionEvents } from "@/lib/schema";

/**
 * NY 2026 Election Data Seeding Script
 *
 * This script populates:
 * 1. District data (Congressional, State Senate, State Assembly, City Council)
 * 2. Zipcode-to-District mappings for NYC and surrounding areas
 * 3. 2026 Democratic Primary races
 * 4. Initial candidate data (to be expanded with Ballotpedia scraping)
 */

// NYC Congressional Districts (based on 2022 redistricting)
const NY_CONGRESSIONAL_DISTRICTS = [
  { number: "13", name: "New York's 13th Congressional District", counties: ["New York"] },
  { number: "12", name: "New York's 12th Congressional District", counties: ["New York", "Kings"] },
  { number: "10", name: "New York's 10th Congressional District", counties: ["New York", "Kings"] },
  { number: "7", name: "New York's 7th Congressional District", counties: ["Kings", "Queens"] },
  { number: "3", name: "New York's 3rd Congressional District", counties: ["Kings"] },
  { number: "11", name: "New York's 11th Congressional District", counties: ["Kings", "Richmond"] },
  { number: "9", name: "New York's 9th Congressional District", counties: ["Kings", "Queens"] },
  { number: "6", name: "New York's 6th Congressional District", counties: ["New York"] },
  { number: "15", name: "New York's 15th Congressional District", counties: ["New York"] },
  { number: "14", name: "New York's 14th Congressional District", counties: ["Queens", "Bronx"] },
  { number: "16", name: "New York's 16th Congressional District", counties: ["Bronx"] },
  { number: "17", name: "New York's 17th Congressional District", counties: ["Bronx", "Westchester"] },
  { number: "18", name: "New York's 18th Congressional District", counties: ["Westchester"] },
];

// Sample NY State Senate Districts (NYC focus)
const NY_STATE_SENATE_DISTRICTS = [
  { number: "27", name: "New York State Senate District 27", county: "New York" },
  { number: "25", name: "New York State Senate District 25", county: "New York" },
  { number: "26", name: "New York State Senate District 26", county: "Kings" },
  { number: "18", name: "New York State Senate District 18", county: "Kings" },
  { number: "20", name: "New York State Senate District 20", county: "Kings" },
  { number: "23", name: "New York State Senate District 23", county: "Kings" },
  { number: "22", name: "New York State Senate District 22", county: "Queens" },
  { number: "14", name: "New York State Senate District 14", county: "Bronx" },
];

// Sample NY State Assembly Districts (NYC focus)
const NY_STATE_ASSEMBLY_DISTRICTS = [
  { number: "65", name: "New York State Assembly District 65", county: "New York" },
  { number: "67", name: "New York State Assembly District 67", county: "New York" },
  { number: "68", name: "New York State Assembly District 68", county: "New York" },
  { number: "69", name: "New York State Assembly District 69", county: "New York" },
  { number: "70", name: "New York State Assembly District 70", county: "New York" },
  { number: "75", name: "New York State Assembly District 75", county: "Kings" },
  { number: "43", name: "New York State Assembly District 43", county: "Kings" },
  { number: "47", name: "New York State Assembly District 47", county: "Kings" },
  { number: "52", name: "New York State Assembly District 52", county: "Queens" },
  { number: "80", name: "New York State Assembly District 80", county: "Bronx" },
  { number: "120", name: "New York State Assembly District 120", county: "Richmond" },
];

// NYC City Council Districts (51 total, showing sample)
const NYC_CITY_COUNCIL_DISTRICTS = [
  { number: "1", name: "New York City Council District 1", borough: "Manhattan" },
  { number: "2", name: "New York City Council District 2", borough: "Manhattan" },
  { number: "3", name: "New York City Council District 3", borough: "Manhattan" },
  { number: "4", name: "New York City Council District 4", borough: "Manhattan" },
  { number: "5", name: "New York City Council District 5", borough: "Manhattan" },
  // Brooklyn
  { number: "33", name: "New York City Council District 33", borough: "Brooklyn" },
  { number: "34", name: "New York City Council District 34", borough: "Brooklyn" },
  { number: "37", name: "New York City Council District 37", borough: "Brooklyn" },
  { number: "39", name: "New York City Council District 39", borough: "Brooklyn" },
  // Queens
  { number: "26", name: "New York City Council District 26", borough: "Queens" },
  { number: "29", name: "New York City Council District 29", borough: "Queens" },
  // Bronx
  { number: "15", name: "New York City Council District 15", borough: "Bronx" },
  { number: "17", name: "New York City Council District 17", borough: "Bronx" },
  // Staten Island
  { number: "51", name: "New York City Council District 51", borough: "Staten Island" },
];

// Zipcode to District mapping for NYC (sample)
const ZIPCODE_DISTRICT_MAPPING: Record<string, { congressional: string; stateSenate: string; stateAssembly: string; cityCouncil: string }> = {
  "10001": { congressional: "13", stateSenate: "27", stateAssembly: "65", cityCouncil: "3" },
  "10002": { congressional: "13", stateSenate: "27", stateAssembly: "65", cityCouncil: "2" },
  "10003": { congressional: "13", stateSenate: "27", stateAssembly: "65", cityCouncil: "2" },
  "10009": { congressional: "13", stateSenate: "25", stateAssembly: "67", cityCouncil: "3" },
  "10010": { congressional: "6", stateSenate: "25", stateAssembly: "67", cityCouncil: "4" },
  "11201": { congressional: "12", stateSenate: "26", stateAssembly: "43", cityCouncil: "33" },
  "11211": { congressional: "12", stateSenate: "26", stateAssembly: "43", cityCouncil: "34" },
  "11215": { congressional: "12", stateSenate: "26", stateAssembly: "43", cityCouncil: "39" },
  "10451": { congressional: "15", stateSenate: "14", stateAssembly: "80", cityCouncil: "15" },
  "11101": { congressional: "14", stateSenate: "22", stateAssembly: "52", cityCouncil: "26" },
  "10301": { congressional: "11", stateSenate: "23", stateAssembly: "120", cityCouncil: "51" },
};

// Sample candidate data for 2026 Democratic Primary (to be expanded with Ballotpedia scraping)
interface CandidateData {
  firstName: string;
  lastName: string;
  party: string;
  incumbentStatus?: string;
  bio?: string;
  websiteUrl?: string;
  photoUrl?: string;
}

const SAMPLE_2026_CANDIDATES: Record<string, CandidateData[]> = {
  "2026-NY-US-HOUSE-13": [
    { firstName: "Adriano", lastName: "Espaillat", party: "Democratic", incumbentStatus: "incumbent", bio: "U.S. Representative" },
    { firstName: "Sample", lastName: "Challenger1", party: "Democratic", incumbentStatus: "challenger" },
    { firstName: "Sample", lastName: "Challenger2", party: "Democratic", incumbentStatus: "challenger" },
  ],
  "2026-NY-US-HOUSE-12": [
    { firstName: "Jerrold", lastName: "Nadler", party: "Democratic", incumbentStatus: "incumbent" },
    { firstName: "Sample", lastName: "Challenger3", party: "Democratic", incumbentStatus: "challenger" },
  ],
  "2026-NY-STATE-SENATE-27": [
    { firstName: "Sample", lastName: "StateSenator1", party: "Democratic", bio: "State Senator" },
    { firstName: "Sample", lastName: "StateSenator2", party: "Democratic" },
  ],
  "2026-NYC-COUNCIL-3": [
    { firstName: "Sample", lastName: "CouncilMember1", party: "Democratic", bio: "City Council Member" },
    { firstName: "Sample", lastName: "CouncilMember2", party: "Democratic" },
  ],
};

export async function seedNY2026Elections() {
  try {
    console.log("🗳️  Seeding NY 2026 Elections Data...\n");

    const db_instance = db();

    // 1. Create Congressional Districts
    console.log("Creating Congressional Districts...");
    for (const dist of NY_CONGRESSIONAL_DISTRICTS) {
      const id = `NY-CD-${dist.number}`;
      await db_instance
        .insert(districts)
        .values({
          id,
          state: "NY",
          districtType: "congressional",
          districtNumber: dist.number,
          name: dist.name,
          electionYear: 2026,
        })
        .onConflictDoNothing();
    }

    // 2. Create State Senate Districts
    console.log("Creating State Senate Districts...");
    for (const dist of NY_STATE_SENATE_DISTRICTS) {
      const id = `NY-SS-${dist.number}`;
      await db_instance
        .insert(districts)
        .values({
          id,
          state: "NY",
          districtType: "state_senate",
          districtNumber: dist.number,
          name: dist.name,
          electionYear: 2026,
        })
        .onConflictDoNothing();
    }

    // 3. Create State Assembly Districts
    console.log("Creating State Assembly Districts...");
    for (const dist of NY_STATE_ASSEMBLY_DISTRICTS) {
      const id = `NY-AD-${dist.number}`;
      await db_instance
        .insert(districts)
        .values({
          id,
          state: "NY",
          districtType: "state_assembly",
          districtNumber: dist.number,
          name: dist.name,
          electionYear: 2026,
        })
        .onConflictDoNothing();
    }

    // 4. Create City Council Districts
    console.log("Creating City Council Districts...");
    for (const dist of NYC_CITY_COUNCIL_DISTRICTS) {
      const id = `NYC-CC-${dist.number}`;
      await db_instance
        .insert(districts)
        .values({
          id,
          state: "NY",
          districtType: "city_council",
          districtNumber: dist.number,
          name: dist.name,
          electionYear: 2026,
        })
        .onConflictDoNothing();
    }

    // 5. Map zipcodes to districts
    console.log("Mapping zipcodes to districts...");
    for (const [zipcode, mapping] of Object.entries(ZIPCODE_DISTRICT_MAPPING)) {
      const congressionalId = `NY-CD-${mapping.congressional}`;
      const senatorialId = `NY-SS-${mapping.stateSenate}`;
      const assemblyId = `NY-AD-${mapping.stateAssembly}`;
      const councilId = `NYC-CC-${mapping.cityCouncil}`;

      for (const districtId of [congressionalId, senatorialId, assemblyId, councilId]) {
        await db_instance
          .insert(zipcodeDistricts)
          .values({
            id: `${zipcode}-${districtId}`,
            zipcode,
            districtId,
          })
          .onConflictDoNothing();
      }
    }

    // 6. Create races for 2026 Democratic Primary
    console.log("Creating 2026 Democratic Primary races...");

    // Congressional races
    for (const dist of NY_CONGRESSIONAL_DISTRICTS) {
      const raceId = `2026-NY-US-HOUSE-${dist.number}`;
      await db_instance
        .insert(races)
        .values({
          id: raceId,
          electionYear: 2026,
          state: "NY",
          raceType: "federal_house",
          districtId: `NY-CD-${dist.number}`,
          office: `U.S. House`,
          position: "Representative",
          isPrimary: true,
          primaryType: "democratic",
          description: `${dist.name} Democratic Primary`,
        })
        .onConflictDoNothing();
    }

    // State Senate races
    for (const dist of NY_STATE_SENATE_DISTRICTS) {
      const raceId = `2026-NY-STATE-SENATE-${dist.number}`;
      await db_instance
        .insert(races)
        .values({
          id: raceId,
          electionYear: 2026,
          state: "NY",
          raceType: "state_senate",
          districtId: `NY-SS-${dist.number}`,
          office: "New York State Senate",
          position: "Senator",
          isPrimary: true,
          primaryType: "democratic",
          description: `${dist.name} Democratic Primary`,
        })
        .onConflictDoNothing();
    }

    // City Council races
    for (const dist of NYC_CITY_COUNCIL_DISTRICTS) {
      const raceId = `2026-NYC-COUNCIL-${dist.number}`;
      await db_instance
        .insert(races)
        .values({
          id: raceId,
          electionYear: 2026,
          state: "NY",
          raceType: "city_council",
          districtId: `NYC-CC-${dist.number}`,
          office: "New York City Council",
          position: "Council Member",
          isPrimary: true,
          primaryType: "democratic",
          description: `${dist.name} Democratic Primary`,
        })
        .onConflictDoNothing();
    }

    // 7. Create ElectionEvent for NY 2026 Democratic Primary
    console.log("Creating 2026 NY Democratic Primary election event...");
    const eventId = "2026-NY-DEMOCRATIC-PRIMARY";
    await db_instance
      .insert(electionEvents)
      .values({
        id: eventId,
        state: "NY",
        county: null,
        title: "2026 New York Democratic Primary",
        eventType: "primary",
        electionDate: "2026-06-23", // New York primary date
        registrationDeadline: "2026-05-26",
        description: "Democratic primary election for New York federal, state, and local offices",
        status: "upcoming",
        visibility: "public",
        archived: false,
      })
      .onConflictDoNothing();

    // 8. Add sample candidates
    console.log("Adding sample candidates...");

    for (const [raceId, candidateList] of Object.entries(SAMPLE_2026_CANDIDATES)) {
      for (let index = 0; index < candidateList.length; index++) {
        const candidateData = candidateList[index];
        const candidateId = `candidate-${candidateData.lastName.toLowerCase()}-${candidateData.firstName.toLowerCase()}-2026-${index}`;

        await db_instance
          .insert(candidates)
          .values({
            id: candidateId,
            electionYear: 2026,
            firstName: candidateData.firstName,
            lastName: candidateData.lastName,
            party: candidateData.party,
            incumbentStatus: candidateData.incumbentStatus || "challenger",
            bio: candidateData.bio,
            websiteUrl: candidateData.websiteUrl,
            photoUrl: candidateData.photoUrl,
          })
          .onConflictDoNothing();

        // Link candidate to race
        await db_instance
          .insert(raceCandidates)
          .values({
            id: `${raceId}-${candidateId}`,
            raceId,
            candidateId,
          })
          .onConflictDoNothing();
      }
    }

    console.log("✅ NY 2026 Elections data seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`  ✓ ${NY_CONGRESSIONAL_DISTRICTS.length} Congressional Districts`);
    console.log(`  ✓ ${NY_STATE_SENATE_DISTRICTS.length} State Senate Districts`);
    console.log(`  ✓ ${NY_STATE_ASSEMBLY_DISTRICTS.length} State Assembly Districts`);
    console.log(`  ✓ ${NYC_CITY_COUNCIL_DISTRICTS.length} City Council Districts`);
    console.log(`  ✓ ${Object.keys(ZIPCODE_DISTRICT_MAPPING).length} Zipcodes mapped to districts`);
    console.log(`  ✓ 1 Election Event created (2026 NY Democratic Primary)`);
    console.log(`  ✓ ${Object.keys(SAMPLE_2026_CANDIDATES).length} races created`);
    console.log(`  ✓ ${Object.values(SAMPLE_2026_CANDIDATES).reduce((sum, list) => sum + list.length, 0)} sample candidates added`);
    console.log("\n📝 Next: Run 'npm run scrape-ballotpedia' to fetch real 2026 candidate data");
  } catch (error) {
    console.error("❌ Error seeding elections data:", error);
    throw error;
  }
}

if (require.main === module) {
  seedNY2026Elections()
    .then(() => {
      console.log("✨ Seed complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

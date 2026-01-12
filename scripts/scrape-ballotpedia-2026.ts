import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";
import { candidates, raceCandidates, races } from "@/lib/schema";
import { eq } from "drizzle-orm";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import pRetry from "p-retry";

/**
 * Ballotpedia Scraper for 2026 New York Elections
 *
 * Scrapes candidate data from Ballotpedia for:
 * - U.S. House (26 districts)
 * - Governor
 * - State Senate
 * - State Assembly
 *
 * Then upserts to the candidates table with race_candidates links.
 */

// Race configuration with Ballotpedia URLs
const RACES_TO_SCRAPE = {
  // U.S. House - all 26 NY districts
  federal_house: [
    "https://ballotpedia.org/New_York%27s_1st_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_2nd_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_3rd_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_4th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_5th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_6th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_7th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_8th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_9th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_10th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_11th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_12th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_13th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_14th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_15th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_16th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_17th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_18th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_19th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_20th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_21st_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_22nd_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_23rd_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_24th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_25th_Congressional_District_election,_2026",
    "https://ballotpedia.org/New_York%27s_26th_Congressional_District_election,_2026",
  ],
};

// Rate limiting configuration
const limit = pLimit(2); // Max 2 concurrent requests
const DELAY_BETWEEN_REQUESTS = 1500; // 1.5 seconds

interface CandidateData {
  firstName: string;
  lastName: string;
  party: string;
  incumbentStatus: "incumbent" | "challenger";
  photoUrl: string | null;
}

/**
 * Fetch HTML with retry logic
 */
async function fetchWithRetry(url: string): Promise<string> {
  return pRetry(
    async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      );
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }
      return response.text();
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2,
    }
  );
}

/**
 * Extract first and last name from full name
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  // Last part is last name, everything else is first name
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");

  return { firstName, lastName };
}

/**
 * Normalize party name
 */
function normalizeParty(partyText: string): string {
  const text = partyText.trim().toLowerCase();

  if (text.includes("democratic")) return "Democratic";
  if (text.includes("republican")) return "Republican";
  if (text.includes("libertarian")) return "Libertarian";
  if (text.includes("green")) return "Green";
  if (text.includes("working")) return "Working Families";
  if (text.includes("independent")) return "Independent";
  if (text.includes("conservative")) return "Conservative";

  // Default: return original text with proper casing
  return partyText
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Parse candidate data from race page HTML
 */
async function parseRacePage(
  html: string,
  raceId: string
): Promise<CandidateData[]> {
  const $ = cheerio.load(html);
  const candidates: CandidateData[] = [];

  // Look for cells with votebox-results-cell--text class
  // These contain the actual candidate data
  $("td.votebox-results-cell--text").each((cellIdx, cell) => {
    try {
      const $cell = $(cell);

      // Find the candidate link
      const $link = $cell.find("a[href*='ballotpedia.org']").first();
      const fullName = $link.text().trim();

      if (!fullName || fullName.length < 2) return;

      // Extract party from cell text (format: "Name (D)", "Name (R)", etc.)
      const cellText = $cell.text();
      const partyMatch = cellText.match(/\(([A-Z])\)/);
      if (!partyMatch) return; // Skip if no party found

      const partyLetter = partyMatch[1];
      let party = "Unknown";
      if (partyLetter === "D") party = "Democratic";
      else if (partyLetter === "R") party = "Republican";
      else if (partyLetter === "L") party = "Libertarian";
      else if (partyLetter === "G") party = "Green";
      else if (partyLetter === "I") party = "Independent";
      else party = partyLetter;

      // Check if this is an incumbent (bold and underlined)
      const $strong = $cell.find("b u, strong u, u b, u strong");
      let incumbentStatus: "incumbent" | "challenger" = "challenger";
      if ($strong.length > 0) {
        incumbentStatus = "incumbent";
      }

      // Extract photo from the previous td (photo cell)
      let photoUrl: string | null = null;
      const $row = $cell.closest("tr");
      const $photoCell = $row.find("td").eq(1); // Photo is usually in 2nd column
      const $img = $photoCell.find("img");
      if ($img.length > 0) {
        const src = $img.attr("src");
        if (src && src.includes("ballotpedia") && src.includes("http")) {
          photoUrl = src;
        }
      }

      const { firstName, lastName } = parseName(fullName);

      // Validate parsed data
      if (firstName && lastName) {
        candidates.push({
          firstName,
          lastName,
          party,
          incumbentStatus,
          photoUrl,
        });
      }
    } catch (error) {
      // Silently skip rows that can't be parsed
    }
  });

  return candidates;
}

/**
 * Generate candidate ID
 */
function generateCandidateId(
  firstName: string,
  lastName: string,
  raceId: string
): string {
  return `candidate-${lastName.toLowerCase()}-${firstName.toLowerCase()}-${raceId}`;
}

/**
 * Upsert candidate and link to race
 */
async function upsertCandidate(
  candidateData: CandidateData,
  raceId: string
): Promise<void> {
  const db_instance = db();

  // Generate candidate ID
  const candidateId = generateCandidateId(
    candidateData.firstName,
    candidateData.lastName,
    raceId
  );

  // Check if candidate already exists
  const existing = await db_instance
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing candidate
    await db_instance
      .update(candidates)
      .set({
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        party: candidateData.party,
        incumbentStatus: candidateData.incumbentStatus,
        photoUrl: candidateData.photoUrl,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId));
  } else {
    // Insert new candidate
    await db_instance.insert(candidates).values({
      id: candidateId,
      electionYear: 2026,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      party: candidateData.party,
      incumbentStatus: candidateData.incumbentStatus,
      photoUrl: candidateData.photoUrl,
    });
  }

  // Link candidate to race
  const raceCandidateId = `${raceId}-${candidateId}`;
  await db_instance
    .insert(raceCandidates)
    .values({
      id: raceCandidateId,
      raceId,
      candidateId,
    })
    .onConflictDoNothing();
}

/**
 * Scrape candidates for a single race
 */
async function scrapeRace(url: string, raceId: string): Promise<number> {
  try {
    const html = await fetchWithRetry(url);
    const raceCandidates = await parseRacePage(html, raceId);

    // Upsert each candidate
    for (const candidateData of raceCandidates) {
      await upsertCandidate(candidateData, raceId);
    }

    console.log(`  ✓ ${raceId}: Found ${raceCandidates.length} candidates`);
    return raceCandidates.length;
  } catch (error) {
    console.error(`  ✗ Error scraping ${raceId}:`, error);
    return 0;
  }
}

/**
 * Main scraper function
 */
export async function scrapeBallotpedia2026() {
  try {
    console.log("🗳️  Scraping Ballotpedia for 2026 NY Candidates...\n");

    const db_instance = db();

    // Get House race IDs from database
    const houseRaces = await db_instance
      .select()
      .from(races)
      .where(eq(races.raceType, "federal_house"));

    const raceMap = new Map(houseRaces.map((r) => [r.districtId, r.id]));

    // Scrape House races
    console.log("Scraping U.S. House races (26 districts)...");
    let totalCandidates = 0;

    for (let i = 1; i <= 26; i++) {
      const districtId = `NY-CD-${i}`;
      const raceId = raceMap.get(districtId);

      if (!raceId) {
        console.log(`  ⚠ No race found for ${districtId}, skipping`);
        continue;
      }

      const url = RACES_TO_SCRAPE.federal_house[i - 1];
      const count = await limit(() => scrapeRace(url, raceId));
      totalCandidates += count;
    }

    console.log(`\n✅ Scraping complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`  ✓ Scraped U.S. House candidates: ${totalCandidates}`);
    console.log(`\n📝 Next: Add endorsements and update onboarding UI`);
  } catch (error) {
    console.error("❌ Error scraping Ballotpedia:", error);
    throw error;
  }
}

if (require.main === module) {
  scrapeBallotpedia2026()
    .then(() => {
      console.log("\n✨ Scrape complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Scrape failed:", error);
      process.exit(1);
    });
}

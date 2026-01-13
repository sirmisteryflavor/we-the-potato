import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, serial, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey().notNull(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { withTimezone: true }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const SUPPORTED_STATES = ["NY", "NJ", "PA", "CT", "TX"] as const;
export type SupportedState = typeof SUPPORTED_STATES[number];

export const ISSUE_CATEGORIES = [
  "economy",
  "education", 
  "healthcare",
  "environment",
  "public_safety"
] as const;
export type IssueCategory = typeof ISSUE_CATEGORIES[number];

export const DECISION_OPTIONS = ["yes", "no", "undecided"] as const;
export type DecisionOption = typeof DECISION_OPTIONS[number];

export const CARD_TEMPLATES = ["minimal", "bold", "professional"] as const;
export type CardTemplate = typeof CARD_TEMPLATES[number];

export const EVENT_TYPES = [
  "primary",
  "general", 
  "midterm",
  "special",
  "runoff"
] as const;
export type EventType = typeof EVENT_TYPES[number];

export const EVENT_STATUSES = ["upcoming", "passed"] as const;
export type EventStatus = typeof EVENT_STATUSES[number];

export const VISIBILITY_OPTIONS = ["public", "private"] as const;
export type VisibilityOption = typeof VISIBILITY_OPTIONS[number];

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  username: varchar("username", { length: 30 }).unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  zipCode: varchar("zip_code", { length: 10 }),
  state: varchar("state", { length: 2 }),
  county: text("county"),
  birthYear: integer("birth_year"),
  preferences: jsonb("preferences").$type<Record<IssueCategory, number>>(),
  issueRanking: jsonb("issue_ranking").$type<IssueCategory[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const RESERVED_USERNAMES = [
  "admin", "api", "auth", "ballot", "ballots", "card", "cards", "dashboard",
  "edit", "election", "elections", "event", "events", "home", "login", "logout",
  "onboarding", "profile", "public", "settings", "signup", "user", "users",
  "voter", "voter-card", "wethepotato", "www", "help", "support", "about",
  "terms", "privacy", "contact", "share", "admin-login"
] as const;

const RESERVED_USERNAMES_SET = new Set(RESERVED_USERNAMES.map(u => u.toLowerCase()));

export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and contain only letters, numbers, and underscores")
  .refine(
    (val) => !RESERVED_USERNAMES_SET.has(val.toLowerCase()),
    "This username is not available"
  );

export type UpsertUser = typeof users.$inferInsert;

export const electionEvents = pgTable("election_events", {
  id: varchar("id").primaryKey(),
  state: varchar("state", { length: 2 }).notNull(),
  county: text("county"),
  title: text("title").notNull(),
  eventType: varchar("event_type", { length: 20 }).notNull(),
  electionDate: text("election_date").notNull(),
  registrationDeadline: text("registration_deadline"),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("upcoming").notNull(),
  visibility: varchar("visibility", { length: 10 }).default("private").notNull(),
  archived: boolean("archived").default(false).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const userEventSubscriptions = pgTable("user_event_subscriptions", {
  id: serial("id").primaryKey(),
  visitorId: varchar("visitor_id").notNull(),
  eventId: varchar("event_id").references(() => electionEvents.id).notNull(),
  notifyOnUpdate: boolean("notify_on_update").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventNotifications = pgTable("event_notifications", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id").references(() => electionEvents.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  notificationType: varchar("notification_type", { length: 30 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ballots = pgTable("ballots", {
  id: varchar("id").primaryKey(),
  eventId: varchar("event_id").references(() => electionEvents.id).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  county: text("county"),
  city: text("city"),
  zipcode: varchar("zipcode", { length: 5 }),
  electionDate: text("election_date").notNull(),
  electionType: text("election_type").notNull(),
  // Store race IDs for future querying/filtering
  raceIds: text("race_ids"), // JSON array of race IDs on this ballot
  measureIds: text("measure_ids"), // JSON array of measure IDs on this ballot
  // Store denormalized data for quick access
  racesCount: integer("races_count").default(0),
  measuresCount: integer("measures_count").default(0),
  // Store full ballot data as JSONB for future use (AI analysis, sharing, etc)
  races: jsonb("races").$type<any[]>(),
  measures: jsonb("measures").$type<BallotMeasure[]>(),
  candidates: jsonb("candidates").$type<Candidate[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voterDecisions = pgTable("voter_decisions", {
  id: varchar("id").primaryKey(),
  visitorId: varchar("visitor_id"),
  userId: varchar("user_id").references(() => users.id),
  ballotId: varchar("ballot_id").references(() => ballots.id),
  eventId: varchar("event_id").references(() => electionEvents.id),
  measureDecisions: jsonb("measure_decisions").$type<Record<string, MeasureDecision>>().notNull(),
  candidateSelections: jsonb("candidate_selections").$type<Record<string, string>>().notNull(),
  notes: jsonb("notes").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  shared: boolean("shared").default(false),
});

export const voterCards = pgTable("voter_cards", {
  id: varchar("id").primaryKey(),
  visitorId: varchar("visitor_id"),
  userId: varchar("user_id").references(() => users.id),
  decisionsId: varchar("decisions_id").references(() => voterDecisions.id),
  template: varchar("template", { length: 20 }).notNull(),
  location: text("location").notNull(),
  electionDate: text("election_date").notNull(),
  electionType: text("election_type").notNull(),
  decisions: jsonb("decisions").$type<VoterCardDecision[]>().notNull(),
  shareUrl: text("share_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const finalizedVoterCards = pgTable("finalized_voter_cards", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  visitorId: varchar("visitor_id"),
  eventId: varchar("event_id").references(() => electionEvents.id).notNull(),
  ballotId: varchar("ballot_id").references(() => ballots.id),
  template: varchar("template", { length: 20 }).notNull(),
  location: text("location").notNull(),
  state: varchar("state", { length: 2 }),
  electionDate: text("election_date").notNull(),
  electionType: text("election_type").notNull(),
  decisions: jsonb("decisions").$type<VoterCardDecision[]>().notNull(),
  showNotes: boolean("show_notes").default(true),
  isPublic: boolean("is_public").default(true),
  shareUrl: text("share_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  eventData: jsonb("event_data").$type<Record<string, unknown>>(),
  visitorId: varchar("visitor_id"),
  state: varchar("state", { length: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const zipcodes = pgTable(
  "zipcodes",
  {
    zipcode: varchar("zipcode", { length: 5 }).primaryKey(),
    state: varchar("state", { length: 2 }).notNull(),
    county: text("county"),
    city: text("city"),
    latitude: text("latitude"),
    longitude: text("longitude"),
  },
  (table) => [index("IDX_zipcode_state").on(table.state)]
);

export const districts = pgTable(
  "districts",
  {
    id: varchar("id").primaryKey(), // e.g., "NY-CD-13", "NY-SS-27", "NY-AD-65"
    state: varchar("state", { length: 2 }).notNull(),
    districtType: varchar("district_type", { length: 20 }).notNull(), // "congressional", "state_senate", "state_assembly", "city_council"
    districtNumber: varchar("district_number", { length: 10 }).notNull(),
    name: text("name"), // e.g., "Congressional District 13", "State Senate District 27"
    electionYear: integer("election_year").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_districts_state_year").on(table.state, table.electionYear),
    index("IDX_districts_type").on(table.districtType),
  ]
);

export const zipcodeDistricts = pgTable(
  "zipcode_districts",
  {
    id: varchar("id").primaryKey(),
    zipcode: varchar("zipcode", { length: 5 }).references(() => zipcodes.zipcode),
    districtId: varchar("district_id").references(() => districts.id),
  },
  (table) => [index("IDX_zipcode_districts_zip").on(table.zipcode)]
);

export const races = pgTable(
  "races",
  {
    id: varchar("id").primaryKey(), // e.g., "2026-NY-US-HOUSE-13", "2026-NY-GOV"
    electionYear: integer("election_year").notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    raceType: varchar("race_type", { length: 30 }).notNull(), // "federal_house", "federal_senate", "state_governor", "state_senate", "state_assembly", "city_council"
    districtId: varchar("district_id").references(() => districts.id),
    office: text("office").notNull(), // "U.S. House", "State Senate", "City Council"
    position: text("position"), // "Representative", "Senator", "Councilmember"
    isPrimary: boolean("is_primary").default(true),
    primaryType: varchar("primary_type", { length: 20 }), // "democratic", "republican", "all"
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_races_year_state").on(table.electionYear, table.state),
    index("IDX_races_type").on(table.raceType),
    index("IDX_races_district").on(table.districtId),
  ]
);

export const candidates = pgTable(
  "candidates",
  {
    id: varchar("id").primaryKey(), // e.g., "candidate-john-doe-2026-ny-13"
    electionYear: integer("election_year").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    party: varchar("party", { length: 30 }).notNull(), // "Democratic", "Republican", "Independent", etc.
    incumbentStatus: varchar("incumbent_status", { length: 20 }), // "incumbent", "challenger", "open_seat"
    photoUrl: text("photo_url"),
    websiteUrl: text("website_url"),
    bio: text("bio"),
    position: text("position"), // "State Senator", "Assembly Member", etc.
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_candidates_year_party").on(table.electionYear, table.party),
    index("IDX_candidates_last_name").on(table.lastName),
  ]
);

export const raceCandidates = pgTable(
  "race_candidates",
  {
    id: varchar("id").primaryKey(),
    raceId: varchar("race_id").references(() => races.id).notNull(),
    candidateId: varchar("candidate_id").references(() => candidates.id).notNull(),
    isWonPrimary: boolean("is_won_primary"),
    primaryVotes: integer("primary_votes"),
    primaryPercentage: text("primary_percentage"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_race_candidates_race").on(table.raceId),
    index("IDX_race_candidates_candidate").on(table.candidateId),
  ]
);

export const candidateEndorsements = pgTable(
  "candidate_endorsements",
  {
    id: varchar("id").primaryKey(),
    candidateId: varchar("candidate_id").references(() => candidates.id).notNull(),
    organization: varchar("organization", { length: 100 }).notNull(), // "Working Families Party", "Sierra Club", etc.
    endorsementType: varchar("endorsement_type", { length: 30 }), // "primary", "general", "strategic_vote"
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("IDX_endorsements_candidate").on(table.candidateId)]
);

export const ballotMeasures2 = pgTable(
  "ballot_measures",
  {
    id: varchar("id").primaryKey(),
    electionYear: integer("election_year").notNull(),
    state: varchar("state", { length: 2 }),
    county: text("county"),
    measureNumber: varchar("measure_number", { length: 20 }).notNull(),
    title: text("title").notNull(),
    shortTitle: text("short_title"),
    description: text("description"),
    fullText: text("full_text"),
    type: varchar("type", { length: 30 }).notNull(), // "proposition", "referendum", "constitutional_amendment"
    fiscalImpact: text("fiscal_impact"),
    proArguments: jsonb("pro_arguments").$type<string[]>(),
    conArguments: jsonb("con_arguments").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_ballot_measures_year_state").on(table.electionYear, table.state),
  ]
);

export const candidateDecisions = pgTable(
  "candidate_decisions",
  {
    id: varchar("id").primaryKey(),
    visitorId: varchar("visitor_id"),
    userId: varchar("user_id").references(() => users.id),
    candidateId: varchar("candidate_id").references(() => candidates.id),
    raceId: varchar("race_id").references(() => races.id),
    decision: varchar("decision", { length: 20 }).notNull(), // "support", "oppose", "undecided", "abstain"
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_candidate_decisions_visitor").on(table.visitorId),
    index("IDX_candidate_decisions_race").on(table.raceId),
  ]
);

export interface VoterCardDecision {
  type: "measure" | "candidate";
  title: string;
  decision: string;
  hidden?: boolean;
  note?: string;
  description?: string;
}

export interface BallotMeasure {
  id: string;
  number: string;
  title: string;
  originalText: string;
  summary: {
    oneSentence: string;
    simple: string;
    detailed: string;
  };
  fiscalImpact?: string;
  supporters: string[];
  opponents: string[];
  category?: IssueCategory;
}

export interface CandidateDonations {
  small: { amount: number; percentage: number };
  large: { amount: number; percentage: number };
  mega: { amount: number; percentage: number };
  total: number;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  office: string;
  age?: number;
  photoUrl?: string;
  positions: string[];
  experience: string;
  endorsements: string[];
  donations?: CandidateDonations;
}

export interface MeasureDecision {
  decision: DecisionOption;
  note?: string;
}

export interface UserPreferences {
  economy: number;
  education: number;
  healthcare: number;
  environment: number;
  public_safety: number;
}

export interface OnboardingData {
  zipCode: string;
  state: SupportedState;
  county?: string;
  preferences?: UserPreferences;
  issueRanking?: IssueCategory[];
  email?: string;
}

export interface VoterCardData {
  id: string;
  template: CardTemplate;
  location: string;
  state?: string;
  electionDate: string;
  electionType: string;
  decisions: {
    type: "measure" | "candidate";
    title: string;
    decision: string;
    hidden?: boolean;
    note?: string;
    description?: string;
  }[];
  shareUrl?: string;
  showNotes?: boolean;
}

export interface ElectionEventData {
  id: string;
  state: string;
  county?: string;
  title: string;
  eventType: EventType;
  electionDate: string;
  registrationDeadline?: string;
  description?: string;
  ballotId?: string;
  visibility: VisibilityOption;
  archived: boolean;
  isSubscribed?: boolean;
  hasUpdates?: boolean;
}

export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true });
export const insertBallotSchema = createInsertSchema(ballots).omit({ createdAt: true, updatedAt: true });
export const insertVoterDecisionsSchema = createInsertSchema(voterDecisions).omit({ createdAt: true, updatedAt: true });
export const insertVoterCardSchema = createInsertSchema(voterCards).omit({ createdAt: true });
export const insertFinalizedVoterCardSchema = createInsertSchema(finalizedVoterCards).omit({ createdAt: true, updatedAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export const insertElectionEventSchema = createInsertSchema(electionEvents).omit({ lastUpdated: true });
export const insertUserEventSubscriptionSchema = createInsertSchema(userEventSubscriptions).omit({ id: true, createdAt: true });
export const insertEventNotificationSchema = createInsertSchema(eventNotifications).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBallot = z.infer<typeof insertBallotSchema>;
export type InsertVoterDecisions = z.infer<typeof insertVoterDecisionsSchema>;
export type InsertVoterCard = z.infer<typeof insertVoterCardSchema>;
export type InsertFinalizedVoterCard = z.infer<typeof insertFinalizedVoterCardSchema>;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type InsertElectionEvent = z.infer<typeof insertElectionEventSchema>;
export type InsertUserEventSubscription = z.infer<typeof insertUserEventSubscriptionSchema>;
export type InsertEventNotification = z.infer<typeof insertEventNotificationSchema>;

export type User = typeof users.$inferSelect;
export type Ballot = typeof ballots.$inferSelect;
export type VoterDecision = typeof voterDecisions.$inferSelect;
export type VoterCard = typeof voterCards.$inferSelect;
export type FinalizedVoterCard = typeof finalizedVoterCards.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type ElectionEvent = typeof electionEvents.$inferSelect;
export type UserEventSubscription = typeof userEventSubscriptions.$inferSelect;
export type EventNotification = typeof eventNotifications.$inferSelect;

export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code");

export const onboardingSchema = z.object({
  zipCode: zipCodeSchema,
  state: z.enum(SUPPORTED_STATES),
  county: z.string().optional(),
  preferences: z.object({
    economy: z.number().min(0).max(10),
    education: z.number().min(0).max(10),
    healthcare: z.number().min(0).max(10),
    environment: z.number().min(0).max(10),
    public_safety: z.number().min(0).max(10),
  }).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

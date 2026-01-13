import { randomUUID } from "crypto";
import { eq, and, desc, sql, gte, ne } from "drizzle-orm";
import { db } from "./db";
import {
  ballots,
  voterDecisions,
  voterCards,
  finalizedVoterCards,
  analyticsEvents,
  electionEvents,
  userEventSubscriptions,
  eventNotifications,
  users,
  type BallotMeasure,
  type Candidate,
  type MeasureDecision,
  type VoterCardDecision,
  type CardTemplate,
  type EventType,
  type User,
  type UpsertUser
} from "./schema";

export interface StoredBallot {
  id: string;
  state: string;
  county: string | null;
  eventId: string;
  electionDate: string;
  electionType: string;
  measures: BallotMeasure[];
  candidates: Candidate[];
}

export interface StoredVoterCard {
  id: string;
  template: CardTemplate;
  location: string;
  electionDate: string;
  electionType: string;
  decisions: VoterCardDecision[];
  shareUrl?: string;
  createdAt: Date;
}

export interface StoredDecisions {
  id: string;
  visitorId: string;
  ballotId: string;
  measureDecisions: Record<string, MeasureDecision>;
  candidateSelections: Record<string, string>;
  notes: Record<string, string>;
  createdAt: Date;
}

export interface AnalyticsData {
  totalVisitors: number;
  totalShares: number;
  decisionsCompleted: number;
  stateBreakdown: Record<string, number>;
  dailyVisits: { date: string; count: number }[];
  completionRate: number;
}

export interface StoredElectionEvent {
  id: string;
  state: string;
  county: string | null;
  title: string;
  eventType: EventType;
  electionDate: string;
  registrationDeadline: string | null;
  description: string | null;
  status: "upcoming" | "current" | "passed";
  visibility: "public" | "private";
  archived: boolean;
  isSubscribed?: boolean;
}

function computeEventStatus(electionDate: string): "upcoming" | "current" | "passed" {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(electionDate);
  eventDate.setHours(0, 0, 0, 0);
  
  const sevenDaysAfter = new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  if (now < eventDate) {
    return "upcoming";
  } else if (now <= sevenDaysAfter) {
    return "current";
  } else {
    return "passed";
  }
}

export interface StoredFinalizedVoterCard {
  id: string;
  userId: string | null;
  visitorId: string | null;
  eventId: string;
  ballotId: string | null;
  template: CardTemplate;
  location: string;
  state: string | null;
  electionDate: string;
  electionType: string;
  decisions: VoterCardDecision[];
  showNotes: boolean;
  isPublic: boolean;
  shareUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  setUsername(userId: string, username: string): Promise<User | undefined>;
  isUsernameAvailable(username: string): Promise<boolean>;
  
  getBallot(state: string, county?: string): Promise<StoredBallot | undefined>;
  getAllBallots(): Promise<StoredBallot[]>;
  saveBallot(ballot: StoredBallot): Promise<StoredBallot>;
  
  getVoterCard(id: string): Promise<StoredVoterCard | undefined>;
  saveVoterCard(card: Omit<StoredVoterCard, "createdAt">): Promise<StoredVoterCard>;
  
  getDecisions(visitorId: string, ballotId: string): Promise<StoredDecisions | undefined>;
  saveDecisions(decisions: Omit<StoredDecisions, "id" | "createdAt">): Promise<StoredDecisions>;
  
  trackEvent(eventType: string, eventData: Record<string, unknown>, visitorId?: string, state?: string): Promise<void>;
  getAnalytics(): Promise<AnalyticsData>;
  
  getElectionEvents(state: string, visitorId?: string): Promise<StoredElectionEvent[]>;
  getAllElectionEvents(): Promise<StoredElectionEvent[]>;
  getArchivedElectionEvents(): Promise<StoredElectionEvent[]>;
  getElectionEvent(id: string, visitorId?: string): Promise<StoredElectionEvent | undefined>;
  createElectionEvent(event: Omit<StoredElectionEvent, "isSubscribed">): Promise<StoredElectionEvent>;
  updateElectionEvent(id: string, event: Partial<Omit<StoredElectionEvent, "id" | "isSubscribed">>): Promise<StoredElectionEvent | undefined>;
  deleteElectionEvent(id: string): Promise<boolean>;
  archiveElectionEvent(id: string): Promise<StoredElectionEvent | undefined>;
  restoreElectionEvent(id: string): Promise<StoredElectionEvent | undefined>;
  subscribeToEvent(visitorId: string, eventId: string): Promise<void>;
  unsubscribeFromEvent(visitorId: string, eventId: string): Promise<void>;
  getSubscribedEvents(visitorId: string): Promise<StoredElectionEvent[]>;
  autoTransitionPassedEvents(): Promise<number>;
  
  getFinalizedVoterCard(userId: string, eventId: string): Promise<StoredFinalizedVoterCard | undefined>;
  getFinalizedVoterCardById(id: string): Promise<StoredFinalizedVoterCard | undefined>;
  saveFinalizedVoterCard(card: Omit<StoredFinalizedVoterCard, "createdAt" | "updatedAt">): Promise<StoredFinalizedVoterCard>;
  updateFinalizedVoterCard(id: string, card: Partial<Omit<StoredFinalizedVoterCard, "id" | "userId" | "visitorId" | "eventId" | "createdAt">>): Promise<StoredFinalizedVoterCard | undefined>;
  getUserFinalizedCards(userId: string): Promise<StoredFinalizedVoterCard[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Ballots are now created dynamically via /api/ballot/[zipcode] endpoint
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db()
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const [user] = await db().select().from(users).where(eq(users.username, username.toLowerCase()));
    return !user;
  }

  async setUsername(userId: string, username: string): Promise<User | undefined> {
    const existingUser = await this.getUser(userId);
    if (!existingUser) {
      return undefined;
    }
    
    // Username is immutable once set
    if (existingUser.username) {
      throw new Error("Username has already been set and cannot be changed");
    }
    
    const [user] = await db()
      .update(users)
      .set({ username: username.toLowerCase(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }


  async getBallot(state: string, county?: string): Promise<StoredBallot | undefined> {
    const rows = await db().select().from(ballots).where(eq(ballots.state, state.toUpperCase()));
    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        state: row.state,
        county: row.county,
        eventId: row.eventId,
        electionDate: row.electionDate,
        electionType: row.electionType,
        measures: row.measures as BallotMeasure[],
        candidates: row.candidates as Candidate[],
      };
    }
    return undefined;
  }

  async getAllBallots(): Promise<StoredBallot[]> {
    const rows = await db().select().from(ballots);
    return rows.map(row => ({
      id: row.id,
      state: row.state,
      county: row.county,
      eventId: row.eventId,
      electionDate: row.electionDate,
      electionType: row.electionType,
      measures: row.measures as BallotMeasure[],
      candidates: row.candidates as Candidate[],
    }));
  }

  async saveBallot(ballot: StoredBallot): Promise<StoredBallot> {
    await db().insert(ballots).values({
      id: ballot.id,
      state: ballot.state,
      county: ballot.county,
      eventId: ballot.eventId,
      electionDate: ballot.electionDate,
      electionType: ballot.electionType,
      measures: ballot.measures,
      candidates: ballot.candidates,
    }).onConflictDoUpdate({
      target: ballots.id,
      set: {
        electionDate: ballot.electionDate,
        electionType: ballot.electionType,
        measures: ballot.measures,
        candidates: ballot.candidates,
        updatedAt: new Date(),
      },
    });
    return ballot;
  }

  async getVoterCard(id: string): Promise<StoredVoterCard | undefined> {
    const rows = await db().select().from(voterCards).where(eq(voterCards.id, id));
    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        template: row.template as CardTemplate,
        location: row.location,
        electionDate: row.electionDate,
        electionType: row.electionType,
        decisions: row.decisions as VoterCardDecision[],
        shareUrl: row.shareUrl || undefined,
        createdAt: row.createdAt || new Date(),
      };
    }
    return undefined;
  }

  async saveVoterCard(card: Omit<StoredVoterCard, "createdAt">): Promise<StoredVoterCard> {
    const now = new Date();
    await db().insert(voterCards).values({
      id: card.id,
      template: card.template,
      location: card.location,
      electionDate: card.electionDate,
      electionType: card.electionType,
      decisions: card.decisions,
      shareUrl: card.shareUrl,
    }).onConflictDoUpdate({
      target: voterCards.id,
      set: {
        template: card.template,
        decisions: card.decisions,
      },
    });
    
    await this.trackEvent("voter_card_created", { template: card.template }, undefined, undefined);
    
    return { ...card, createdAt: now };
  }

  async getDecisions(visitorId: string, ballotId: string): Promise<StoredDecisions | undefined> {
    const rows = await db().select().from(voterDecisions)
      .where(and(
        eq(voterDecisions.visitorId, visitorId),
        eq(voterDecisions.ballotId, ballotId)
      ));
    
    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        visitorId: row.visitorId || visitorId,
        ballotId: row.ballotId || ballotId,
        measureDecisions: row.measureDecisions as Record<string, MeasureDecision>,
        candidateSelections: row.candidateSelections as Record<string, string>,
        notes: (row.notes as Record<string, string>) || {},
        createdAt: row.createdAt || new Date(),
      };
    }
    return undefined;
  }

  async saveDecisions(decisions: Omit<StoredDecisions, "id" | "createdAt">): Promise<StoredDecisions> {
    const existingDecisions = await this.getDecisions(decisions.visitorId, decisions.ballotId);
    
    const id = existingDecisions?.id || randomUUID();
    const now = new Date();
    
    if (existingDecisions) {
      await db().update(voterDecisions)
        .set({
          measureDecisions: decisions.measureDecisions,
          candidateSelections: decisions.candidateSelections,
          notes: decisions.notes,
          updatedAt: now,
        })
        .where(eq(voterDecisions.id, id));
    } else {
      await db().insert(voterDecisions).values({
        id,
        visitorId: decisions.visitorId,
        ballotId: decisions.ballotId,
        measureDecisions: decisions.measureDecisions,
        candidateSelections: decisions.candidateSelections,
        notes: decisions.notes,
      });
      
      await this.trackEvent("decisions_started", { 
        ballotId: decisions.ballotId 
      }, decisions.visitorId, undefined);
    }
    
    return {
      ...decisions,
      id,
      createdAt: now,
    };
  }

  async trackEvent(eventType: string, eventData: Record<string, unknown>, visitorId?: string, state?: string): Promise<void> {
    await db().insert(analyticsEvents).values({
      eventType,
      eventData,
      visitorId,
      state,
    });
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalVisitorsResult = await db()
      .select({ count: sql<number>`count(distinct visitor_id)` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "page_view"));

    const totalSharesResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "voter_card_created"));

    const decisionsStartedResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "decisions_started"));

    const stateBreakdownRows = await db()
      .select({
        state: analyticsEvents.state,
        count: sql<number>`count(*)`
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.state} is not null`)
      .groupBy(analyticsEvents.state);

    const dailyVisitsRows = await db()
      .select({
        date: sql<string>`date(created_at)`,
        count: sql<number>`count(*)`
      })
      .from(analyticsEvents)
      .where(and(
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      ))
      .groupBy(sql`date(created_at)`)
      .orderBy(sql`date(created_at)`);

    const voterCardCount = await db()
      .select({ count: sql<number>`count(*)` })
      .from(voterCards);

    const totalVisitors = totalVisitorsResult[0]?.count || 0;
    const totalShares = totalSharesResult[0]?.count || 0;
    const decisionsCompleted = voterCardCount[0]?.count || 0;
    const decisionsStarted = decisionsStartedResult[0]?.count || 1;

    const stateBreakdown: Record<string, number> = {};
    for (const row of stateBreakdownRows) {
      if (row.state) {
        stateBreakdown[row.state] = row.count;
      }
    }

    const dailyVisits = dailyVisitsRows.map(row => ({
      date: row.date,
      count: row.count,
    }));

    return {
      totalVisitors,
      totalShares,
      decisionsCompleted,
      stateBreakdown,
      dailyVisits,
      completionRate: decisionsStarted > 0 ? (decisionsCompleted / decisionsStarted) * 100 : 0,
    };
  }

  async getElectionEvents(state: string, visitorId?: string): Promise<StoredElectionEvent[]> {
    await this.initializeElectionEvents();
    
    await this.autoTransitionPassedEvents();
    
    const rows = await db().select().from(electionEvents)
      .where(and(
        eq(electionEvents.state, state.toUpperCase()),
        eq(electionEvents.visibility, "public"),
        eq(electionEvents.archived, false)
      ));
    
    const events: StoredElectionEvent[] = [];
    
    for (const row of rows) {
      let isSubscribed = false;
      if (visitorId) {
        const subs = await db().select().from(userEventSubscriptions)
          .where(and(
            eq(userEventSubscriptions.visitorId, visitorId),
            eq(userEventSubscriptions.eventId, row.id)
          ));
        isSubscribed = subs.length > 0;
      }
      
      events.push({
        id: row.id,
        state: row.state,
        county: row.county,
        title: row.title,
        eventType: row.eventType as EventType,
        electionDate: row.electionDate,
        registrationDeadline: row.registrationDeadline,
        description: row.description,
        status: computeEventStatus(row.electionDate),
        visibility: (row.visibility as "public" | "private") || "private",
        archived: row.archived,
        isSubscribed,
      });
    }
    
    return events.sort((a, b) => {
      const statusPriority = { upcoming: 0, current: 1, passed: 2 };
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      return new Date(a.electionDate).getTime() - new Date(b.electionDate).getTime();
    });
  }

  async getAllElectionEvents(): Promise<StoredElectionEvent[]> {
    await this.initializeElectionEvents();
    await this.autoTransitionPassedEvents();
    
    const rows = await db().select().from(electionEvents).where(eq(electionEvents.archived, false));
    
    return rows.map(row => ({
      id: row.id,
      state: row.state,
      county: row.county,
      title: row.title,
      eventType: row.eventType as EventType,
      electionDate: row.electionDate,
      registrationDeadline: row.registrationDeadline,
      description: row.description,
      status: computeEventStatus(row.electionDate),
      visibility: (row.visibility as "public" | "private") || "private",
      archived: row.archived,
    })).sort((a, b) => {
      const statusPriority = { upcoming: 0, current: 1, passed: 2 };
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      return new Date(a.electionDate).getTime() - new Date(b.electionDate).getTime();
    });
  }

  async getArchivedElectionEvents(): Promise<StoredElectionEvent[]> {
    await this.initializeElectionEvents();
    
    const rows = await db().select().from(electionEvents).where(eq(electionEvents.archived, true));
    
    return rows.map(row => ({
      id: row.id,
      state: row.state,
      county: row.county,
      title: row.title,
      eventType: row.eventType as EventType,
      electionDate: row.electionDate,
      registrationDeadline: row.registrationDeadline,
      description: row.description,
      status: computeEventStatus(row.electionDate),
      visibility: (row.visibility as "public" | "private") || "private",
      archived: row.archived,
    })).sort((a, b) => {
      return new Date(b.electionDate).getTime() - new Date(a.electionDate).getTime();
    });
  }

  async getElectionEvent(id: string, visitorId?: string): Promise<StoredElectionEvent | undefined> {
    await this.autoTransitionPassedEvents();
    
    const rows = await db().select().from(electionEvents).where(eq(electionEvents.id, id));
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    let isSubscribed = false;
    
    if (visitorId) {
      const subs = await db().select().from(userEventSubscriptions)
        .where(and(
          eq(userEventSubscriptions.visitorId, visitorId),
          eq(userEventSubscriptions.eventId, id)
        ));
      isSubscribed = subs.length > 0;
    }
    
    return {
      id: row.id,
      state: row.state,
      county: row.county,
      title: row.title,
      eventType: row.eventType as EventType,
      electionDate: row.electionDate,
      registrationDeadline: row.registrationDeadline,
      description: row.description,
      status: computeEventStatus(row.electionDate),
      visibility: (row.visibility as "public" | "private") || "private",
      archived: row.archived,
      isSubscribed,
    };
  }

  async createElectionEvent(event: Omit<StoredElectionEvent, "isSubscribed">): Promise<StoredElectionEvent> {
    await db().insert(electionEvents).values({
      id: event.id,
      state: event.state.toUpperCase(),
      county: event.county,
      title: event.title,
      eventType: event.eventType,
      electionDate: event.electionDate,
      registrationDeadline: event.registrationDeadline,
      description: event.description,
      status: event.status || "upcoming",
      visibility: event.visibility || "private",
      archived: event.archived ?? false,
      lastUpdated: new Date(),
    });

    return { ...event, isSubscribed: false };
  }

  async updateElectionEvent(id: string, updates: Partial<Omit<StoredElectionEvent, "id" | "isSubscribed">>): Promise<StoredElectionEvent | undefined> {
    const existing = await this.getElectionEvent(id);
    if (!existing) return undefined;

    await db().update(electionEvents)
      .set({
        ...(updates.state && { state: updates.state.toUpperCase() }),
        ...(updates.county !== undefined && { county: updates.county }),
        ...(updates.title && { title: updates.title }),
        ...(updates.eventType && { eventType: updates.eventType }),
        ...(updates.electionDate && { electionDate: updates.electionDate }),
        ...(updates.registrationDeadline !== undefined && { registrationDeadline: updates.registrationDeadline }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.visibility && { visibility: updates.visibility }),
        lastUpdated: new Date(),
      })
      .where(eq(electionEvents.id, id));

    return this.getElectionEvent(id);
  }

  async deleteElectionEvent(id: string): Promise<boolean> {
    await db().delete(userEventSubscriptions)
      .where(eq(userEventSubscriptions.eventId, id));
    
    await db().delete(eventNotifications)
      .where(eq(eventNotifications.eventId, id));
    
    const result = await db().delete(electionEvents)
      .where(eq(electionEvents.id, id));
    
    return true;
  }

  async archiveElectionEvent(id: string): Promise<StoredElectionEvent | undefined> {
    const existing = await this.getElectionEvent(id);
    if (!existing) return undefined;

    await db().update(electionEvents)
      .set({ archived: true, lastUpdated: new Date() })
      .where(eq(electionEvents.id, id));

    return this.getElectionEvent(id);
  }

  async restoreElectionEvent(id: string): Promise<StoredElectionEvent | undefined> {
    const existing = await this.getElectionEvent(id);
    if (!existing) return undefined;

    await db().update(electionEvents)
      .set({ archived: false, lastUpdated: new Date() })
      .where(eq(electionEvents.id, id));

    return this.getElectionEvent(id);
  }

  async autoTransitionPassedEvents(): Promise<number> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = await db().select().from(electionEvents)
      .where(eq(electionEvents.status, "upcoming"));
    
    let transitionedCount = 0;
    
    for (const event of upcomingEvents) {
      const eventDate = new Date(event.electionDate);
      if (eventDate < oneWeekAgo) {
        await db().update(electionEvents)
          .set({ status: "passed", lastUpdated: new Date() })
          .where(eq(electionEvents.id, event.id));
        transitionedCount++;
      }
    }
    
    return transitionedCount;
  }

  async subscribeToEvent(visitorId: string, eventId: string): Promise<void> {
    const existing = await db().select().from(userEventSubscriptions)
      .where(and(
        eq(userEventSubscriptions.visitorId, visitorId),
        eq(userEventSubscriptions.eventId, eventId)
      ));
    
    if (existing.length === 0) {
      await db().insert(userEventSubscriptions).values({
        visitorId,
        eventId,
        notifyOnUpdate: true,
      });
    }
  }

  async unsubscribeFromEvent(visitorId: string, eventId: string): Promise<void> {
    await db().delete(userEventSubscriptions)
      .where(and(
        eq(userEventSubscriptions.visitorId, visitorId),
        eq(userEventSubscriptions.eventId, eventId)
      ));
  }

  async getSubscribedEvents(visitorId: string): Promise<StoredElectionEvent[]> {
    const subs = await db().select().from(userEventSubscriptions)
      .where(eq(userEventSubscriptions.visitorId, visitorId));
    
    const events: StoredElectionEvent[] = [];
    
    for (const sub of subs) {
      const event = await this.getElectionEvent(sub.eventId, visitorId);
      if (event) {
        events.push(event);
      }
    }
    
    return events.sort((a, b) => 
      new Date(a.electionDate).getTime() - new Date(b.electionDate).getTime()
    );
  }

  private async initializeElectionEvents(): Promise<void> {
    const existing = await db().select().from(electionEvents).limit(1);
    if (existing.length > 0) return;

    const eventsData = [
      { id: "ny-primary-2026", state: "NY", title: "New York Primary Election", eventType: "primary", electionDate: "June 23, 2026", registrationDeadline: "June 13, 2026", description: "State and local primary elections for Democratic and Republican nominees" },
      { id: "ny-general-2026", state: "NY", title: "New York General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 24, 2026", description: "State governor, legislature, and local offices general election" },
      { id: "ny-midterm-2026", state: "NY", title: "US Congress Midterm - New York", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 24, 2026", description: "US House of Representatives and Senate midterm election" },
      { id: "nj-primary-2026", state: "NJ", title: "New Jersey Primary Election", eventType: "primary", electionDate: "June 2, 2026", registrationDeadline: "May 12, 2026", description: "State and local primary elections" },
      { id: "nj-general-2026", state: "NJ", title: "New Jersey General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 13, 2026", description: "State governor, legislature, and local offices general election" },
      { id: "nj-midterm-2026", state: "NJ", title: "US Congress Midterm - New Jersey", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 13, 2026", description: "US House of Representatives midterm election" },
      { id: "pa-primary-2026", state: "PA", title: "Pennsylvania Primary Election", eventType: "primary", electionDate: "May 19, 2026", registrationDeadline: "April 20, 2026", description: "State and local primary elections" },
      { id: "pa-general-2026", state: "PA", title: "Pennsylvania General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 19, 2026", description: "State governor, legislature, and local offices general election" },
      { id: "pa-midterm-2026", state: "PA", title: "US Congress Midterm - Pennsylvania", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 19, 2026", description: "US House of Representatives and Senate midterm election" },
      { id: "ct-primary-2026", state: "CT", title: "Connecticut Primary Election", eventType: "primary", electionDate: "August 11, 2026", registrationDeadline: "August 6, 2026", description: "State and local primary elections" },
      { id: "ct-general-2026", state: "CT", title: "Connecticut General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 27, 2026", description: "State governor, legislature, and local offices general election" },
      { id: "ct-midterm-2026", state: "CT", title: "US Congress Midterm - Connecticut", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 27, 2026", description: "US House of Representatives midterm election" },
      { id: "tx-primary-2026", state: "TX", title: "Texas Primary Election", eventType: "primary", electionDate: "March 3, 2026", registrationDeadline: "February 2, 2026", description: "State and local primary elections" },
      { id: "tx-runoff-2026", state: "TX", title: "Texas Primary Runoff Election", eventType: "runoff", electionDate: "May 26, 2026", registrationDeadline: "April 27, 2026", description: "Primary runoff for races where no candidate received majority" },
      { id: "tx-general-2026", state: "TX", title: "Texas General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 5, 2026", description: "State governor, legislature, and local offices general election" },
      { id: "tx-midterm-2026", state: "TX", title: "US Congress Midterm - Texas", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 5, 2026", description: "US House of Representatives and Senate midterm election" },
    ];

    for (const event of eventsData) {
      await db().insert(electionEvents).values(event).onConflictDoNothing();
    }
  }

  async getFinalizedVoterCard(userId: string, eventId: string): Promise<StoredFinalizedVoterCard | undefined> {
    const rows = await db().select().from(finalizedVoterCards)
      .where(and(
        eq(finalizedVoterCards.userId, userId),
        eq(finalizedVoterCards.eventId, eventId)
      ))
      .limit(1);
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      id: row.id,
      userId: row.userId,
      visitorId: row.visitorId,
      eventId: row.eventId,
      ballotId: row.ballotId,
      template: row.template as CardTemplate,
      location: row.location,
      state: row.state,
      electionDate: row.electionDate,
      electionType: row.electionType,
      decisions: row.decisions as VoterCardDecision[],
      showNotes: row.showNotes ?? true,
      isPublic: row.isPublic ?? true,
      shareUrl: row.shareUrl,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }

  async getFinalizedVoterCardById(id: string): Promise<StoredFinalizedVoterCard | undefined> {
    const rows = await db().select().from(finalizedVoterCards)
      .where(eq(finalizedVoterCards.id, id))
      .limit(1);
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      id: row.id,
      userId: row.userId,
      visitorId: row.visitorId,
      eventId: row.eventId,
      ballotId: row.ballotId,
      template: row.template as CardTemplate,
      location: row.location,
      state: row.state,
      electionDate: row.electionDate,
      electionType: row.electionType,
      decisions: row.decisions as VoterCardDecision[],
      showNotes: row.showNotes ?? true,
      isPublic: row.isPublic ?? true,
      shareUrl: row.shareUrl,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }

  async getVisitorFinalizedCards(visitorId: string): Promise<StoredFinalizedVoterCard[]> {
    const rows = await db().select().from(finalizedVoterCards)
      .where(eq(finalizedVoterCards.visitorId, visitorId))
      .orderBy(desc(finalizedVoterCards.createdAt));

    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      visitorId: row.visitorId,
      eventId: row.eventId,
      ballotId: row.ballotId,
      template: row.template as CardTemplate,
      location: row.location,
      state: row.state,
      electionDate: row.electionDate,
      electionType: row.electionType,
      decisions: row.decisions as VoterCardDecision[],
      showNotes: row.showNotes ?? true,
      isPublic: row.isPublic ?? true,
      shareUrl: row.shareUrl,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));
  }

  async saveFinalizedVoterCard(card: Omit<StoredFinalizedVoterCard, "createdAt" | "updatedAt">): Promise<StoredFinalizedVoterCard> {
    // Check for existing card by visitorId and eventId (visitor-based flow)
    let existing: StoredFinalizedVoterCard | undefined;

    if (card.visitorId) {
      const visitorCards = await this.getVisitorFinalizedCards(card.visitorId);
      existing = visitorCards.find(c => c.eventId === card.eventId);
    } else if (card.userId) {
      existing = await this.getFinalizedVoterCard(card.userId, card.eventId);
    }
    
    if (existing) {
      await db().update(finalizedVoterCards)
        .set({
          template: card.template,
          location: card.location,
          state: card.state,
          electionDate: card.electionDate,
          electionType: card.electionType,
          decisions: card.decisions,
          showNotes: card.showNotes,
          isPublic: card.isPublic,
          shareUrl: card.shareUrl,
          updatedAt: new Date(),
        })
        .where(eq(finalizedVoterCards.id, existing.id));
      
      return (await this.getFinalizedVoterCardById(existing.id))!;
    }
    
    const now = new Date();
    await db().insert(finalizedVoterCards).values({
      id: card.id,
      userId: card.userId,
      visitorId: card.visitorId,
      eventId: card.eventId,
      ballotId: card.ballotId,
      template: card.template,
      location: card.location,
      state: card.state,
      electionDate: card.electionDate,
      electionType: card.electionType,
      decisions: card.decisions,
      showNotes: card.showNotes,
      isPublic: card.isPublic,
      shareUrl: card.shareUrl,
      createdAt: now,
      updatedAt: now,
    });
    
    return {
      ...card,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateFinalizedVoterCard(id: string, updates: Partial<Omit<StoredFinalizedVoterCard, "id" | "userId" | "visitorId" | "eventId" | "createdAt">>): Promise<StoredFinalizedVoterCard | undefined> {
    const existing = await this.getFinalizedVoterCardById(id);
    if (!existing) return undefined;
    
    await db().update(finalizedVoterCards)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(finalizedVoterCards.id, id));
    
    return this.getFinalizedVoterCardById(id);
  }

  async getUserFinalizedCards(userId: string): Promise<StoredFinalizedVoterCard[]> {
    const rows = await db().select().from(finalizedVoterCards)
      .where(eq(finalizedVoterCards.userId, userId))
      .orderBy(desc(finalizedVoterCards.createdAt));
    
    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      visitorId: row.visitorId,
      eventId: row.eventId,
      ballotId: row.ballotId,
      template: row.template as CardTemplate,
      location: row.location,
      state: row.state,
      electionDate: row.electionDate,
      electionType: row.electionType,
      decisions: row.decisions as VoterCardDecision[],
      showNotes: row.showNotes ?? true,
      isPublic: row.isPublic ?? true,
      shareUrl: row.shareUrl,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));
  }
}

export const storage = new DatabaseStorage();

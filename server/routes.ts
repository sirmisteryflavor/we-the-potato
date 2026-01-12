import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { simplifyBallotMeasure, checkBias } from "./anthropic";
import { z } from "zod";
import { usernameSchema, RESERVED_USERNAMES } from "@shared/schema";

// No-op middleware for visitor-based auth (no login required)
const isAuthenticated = (_req: Request, _res: Response, next: NextFunction) => next();

const zipToStateSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/),
});

const simplifyRequestSchema = z.object({
  originalText: z.string().min(1),
  title: z.string().min(1),
});

const biasCheckSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(["summary", "argument"]),
});

const voterCardSchema = z.object({
  id: z.string(),
  template: z.enum(["minimal", "bold", "professional"]),
  location: z.string(),
  electionDate: z.string(),
  electionType: z.string(),
  decisions: z.array(z.object({
    type: z.enum(["measure", "candidate"]),
    title: z.string(),
    decision: z.string(),
    hidden: z.boolean().optional(),
    note: z.string().optional(),
  })),
  shareUrl: z.string().optional(),
});

const finalizedVoterCardSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  ballotId: z.string().nullable().optional(),
  template: z.enum(["minimal", "bold", "professional"]),
  location: z.string(),
  state: z.string().optional(),
  electionDate: z.string(),
  electionType: z.string(),
  decisions: z.array(z.object({
    type: z.enum(["measure", "candidate"]),
    title: z.string(),
    decision: z.string(),
    hidden: z.boolean().optional(),
    note: z.string().optional(),
    description: z.string().optional(),
  })),
  showNotes: z.boolean().optional(),
  shareUrl: z.string().nullable().optional(),
});

const decisionsSchema = z.object({
  visitorId: z.string(),
  ballotId: z.string(),
  measureDecisions: z.record(z.object({
    decision: z.enum(["yes", "no", "undecided"]),
    note: z.string().optional(),
  })),
  candidateSelections: z.record(z.string()),
  notes: z.record(z.string()).optional(),
});

const analyticsEventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.unknown()).optional(),
  visitorId: z.string().optional(),
  state: z.string().optional(),
});

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Visitor-based auth - no login required
  app.get("/api/auth/user", (_req: any, res) => {
    // Always return null for visitor-based flow
    return res.status(401).json({ message: "Unauthorized" });
  });
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Username endpoints
  app.get("/api/username/check/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // Validate username format
      const parseResult = usernameSchema.safeParse(username);
      if (!parseResult.success) {
        return res.json({ 
          available: false, 
          error: parseResult.error.errors[0]?.message || "Invalid username format" 
        });
      }
      
      const isAvailable = await storage.isUsernameAvailable(username);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username availability" });
    }
  });

  app.post("/api/user/username", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { username } = req.body;
      
      // Validate username format
      const parseResult = usernameSchema.safeParse(username);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: parseResult.error.errors[0]?.message || "Invalid username format" 
        });
      }
      
      // Check availability
      const isAvailable = await storage.isUsernameAvailable(username);
      if (!isAvailable) {
        return res.status(409).json({ error: "Username is already taken" });
      }
      
      const user = await storage.setUsername(userId, username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Error setting username:", error);
      if (error.message?.includes("already been set")) {
        return res.status(400).json({ error: "Username has already been set and cannot be changed" });
      }
      res.status(500).json({ error: "Failed to set username" });
    }
  });

  // Public user profile and cards endpoints
  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return public profile (exclude sensitive fields)
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:username/cards", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const cards = await storage.getUserFinalizedCards(user.id);
      // Only return public cards
      const publicCards = cards.filter(card => card.isPublic);
      
      res.json(publicCards);
    } catch (error) {
      console.error("Error fetching user cards:", error);
      res.status(500).json({ error: "Failed to fetch user cards" });
    }
  });

  app.get("/api/users/:username/cards/:cardId", async (req, res) => {
    try {
      const { username, cardId } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const card = await storage.getFinalizedVoterCardById(cardId);
      
      if (!card || card.userId !== user.id) {
        return res.status(404).json({ error: "Card not found" });
      }
      
      res.json(card);
    } catch (error) {
      console.error("Error fetching user card:", error);
      res.status(500).json({ error: "Failed to fetch card" });
    }
  });

  app.get("/api/lookup-zip/:zipCode", (req, res) => {
    try {
      const { zipCode } = req.params;
      const parsed = zipToStateSchema.safeParse({ zipCode });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid ZIP code format" });
      }

      const location = ZIP_TO_STATE[zipCode];
      
      if (!location) {
        return res.status(404).json({ 
          error: "ZIP code not found",
          supported: false 
        });
      }

      if (!SUPPORTED_STATES.includes(location.state)) {
        return res.status(400).json({ 
          error: `${location.state} is not in our pilot program`,
          supported: false,
          state: location.state 
        });
      }

      res.json({
        ...location,
        supported: true,
      });
    } catch (error) {
      console.error("ZIP lookup error:", error);
      res.status(500).json({ error: "Failed to lookup ZIP code" });
    }
  });

  app.get("/api/ballot/:state", async (req, res) => {
    try {
      const { state } = req.params;
      const { county } = req.query;

      if (!SUPPORTED_STATES.includes(state)) {
        return res.status(400).json({ error: "State not supported" });
      }

      const ballot = await storage.getBallot(state, county as string | undefined);
      
      if (!ballot) {
        return res.status(404).json({ error: "Ballot not found" });
      }

      res.json(ballot);
    } catch (error) {
      console.error("Ballot fetch error:", error);
      res.status(500).json({ error: "Failed to fetch ballot" });
    }
  });

  app.post("/api/simplify-ballot-measure", async (req, res) => {
    try {
      const parsed = simplifyRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { originalText, title } = parsed.data;
      const simplified = await simplifyBallotMeasure(originalText, title);
      
      res.json(simplified);
    } catch (error) {
      console.error("Simplification error:", error);
      res.status(500).json({ error: "Failed to simplify ballot measure" });
    }
  });

  app.post("/api/check-bias", async (req, res) => {
    try {
      const parsed = biasCheckSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { content, contentType } = parsed.data;
      const result = await checkBias(content, contentType);
      
      res.json(result);
    } catch (error) {
      console.error("Bias check error:", error);
      res.status(500).json({ error: "Failed to check bias" });
    }
  });

  app.post("/api/voter-cards", async (req, res) => {
    try {
      const parsed = voterCardSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid voter card data" });
      }

      const card = await storage.saveVoterCard(parsed.data);
      
      res.json({
        ...card,
        shareUrl: `${req.protocol}://${req.get("host")}/card/${card.id}`,
      });
    } catch (error) {
      console.error("Voter card save error:", error);
      res.status(500).json({ error: "Failed to save voter card" });
    }
  });

  app.get("/api/voter-cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.getVoterCard(id);
      
      if (!card) {
        return res.status(404).json({ error: "Voter card not found" });
      }

      res.json(card);
    } catch (error) {
      console.error("Voter card fetch error:", error);
      res.status(500).json({ error: "Failed to fetch voter card" });
    }
  });

  app.get("/api/states", (req, res) => {
    res.json({
      supported: SUPPORTED_STATES,
      pilot: true,
    });
  });

  app.get("/api/decisions/:visitorId/:ballotId", async (req, res) => {
    try {
      const { visitorId, ballotId } = req.params;
      const decisions = await storage.getDecisions(visitorId, ballotId);
      
      if (!decisions) {
        return res.status(404).json({ error: "Decisions not found" });
      }

      res.json(decisions);
    } catch (error) {
      console.error("Decisions fetch error:", error);
      res.status(500).json({ error: "Failed to fetch decisions" });
    }
  });

  app.post("/api/decisions", async (req, res) => {
    try {
      const parsed = decisionsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid decisions data", details: parsed.error });
      }

      const decisions = await storage.saveDecisions({
        ...parsed.data,
        notes: parsed.data.notes || {},
      });
      
      res.json(decisions);
    } catch (error) {
      console.error("Decisions save error:", error);
      res.status(500).json({ error: "Failed to save decisions" });
    }
  });

  app.post("/api/analytics/event", async (req, res) => {
    try {
      const parsed = analyticsEventSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid event data" });
      }

      await storage.trackEvent(
        parsed.data.eventType,
        parsed.data.eventData || {},
        parsed.data.visitorId,
        parsed.data.state
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Analytics tracking error:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/ballots", async (req, res) => {
    try {
      const allBallots = await storage.getAllBallots();
      res.json(allBallots);
    } catch (error) {
      console.error("Ballots fetch error:", error);
      res.status(500).json({ error: "Failed to fetch ballots" });
    }
  });

  app.put("/api/admin/ballots/:id", async (req, res) => {
    try {
      const ballot = await storage.saveBallot(req.body);
      res.json(ballot);
    } catch (error) {
      console.error("Ballot update error:", error);
      res.status(500).json({ error: "Failed to update ballot" });
    }
  });

  app.get("/api/events/:state", async (req, res) => {
    try {
      const { state } = req.params;
      const { visitorId } = req.query;

      if (!SUPPORTED_STATES.includes(state)) {
        return res.status(400).json({ error: "State not supported" });
      }

      const events = await storage.getElectionEvents(
        state, 
        visitorId as string | undefined
      );
      res.json(events);
    } catch (error) {
      console.error("Events fetch error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/admin/events", async (req, res) => {
    try {
      const allEvents = await storage.getAllElectionEvents();
      res.json(allEvents);
    } catch (error) {
      console.error("Admin events fetch error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/admin/events", isAuthenticated, async (req, res) => {
    try {
      const { state, county, title, eventType, electionDate, registrationDeadline, description, ballotId, visibility } = req.body;
      
      if (!state || !title || !eventType || !electionDate) {
        return res.status(400).json({ error: "Missing required fields: state, title, eventType, electionDate" });
      }

      if (!SUPPORTED_STATES.includes(state.toUpperCase())) {
        return res.status(400).json({ error: "State not supported" });
      }

      const id = `${state.toLowerCase()}-${eventType}-${Date.now()}`;
      
      const event = await storage.createElectionEvent({
        id,
        state: state.toUpperCase(),
        county: county || null,
        title,
        eventType,
        electionDate,
        registrationDeadline: registrationDeadline || null,
        description: description || null,
        ballotId: ballotId || null,
        status: "upcoming",
        visibility: visibility || "private",
        archived: false,
      });
      
      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const event = await storage.updateElectionEvent(id, updates);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteElectionEvent(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.get("/api/admin/events/archived", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getArchivedElectionEvents();
      res.json(events);
    } catch (error) {
      console.error("Get archived events error:", error);
      res.status(500).json({ error: "Failed to get archived events" });
    }
  });

  app.post("/api/admin/events/:id/archive", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const event = await storage.archiveElectionEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Archive event error:", error);
      res.status(500).json({ error: "Failed to archive event" });
    }
  });

  app.post("/api/admin/events/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const event = await storage.restoreElectionEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Restore event error:", error);
      res.status(500).json({ error: "Failed to restore event" });
    }
  });

  app.get("/api/event/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { visitorId } = req.query;
      
      const event = await storage.getElectionEvent(id, visitorId as string | undefined);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Event fetch error:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events/subscribe", async (req, res) => {
    try {
      const { visitorId, eventId } = req.body;
      
      if (!visitorId || !eventId) {
        return res.status(400).json({ error: "Missing visitorId or eventId" });
      }

      await storage.subscribeToEvent(visitorId, eventId);
      res.json({ success: true });
    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe to event" });
    }
  });

  app.post("/api/events/unsubscribe", async (req, res) => {
    try {
      const { visitorId, eventId } = req.body;
      
      if (!visitorId || !eventId) {
        return res.status(400).json({ error: "Missing visitorId or eventId" });
      }

      await storage.unsubscribeFromEvent(visitorId, eventId);
      res.json({ success: true });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe from event" });
    }
  });

  app.get("/api/subscriptions/:visitorId", async (req, res) => {
    try {
      const { visitorId } = req.params;
      const events = await storage.getSubscribedEvents(visitorId);
      res.json(events);
    } catch (error) {
      console.error("Subscriptions fetch error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/user/finalized-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const cards = await storage.getUserFinalizedCards(userId);
      res.json(cards);
    } catch (error) {
      console.error("Finalized cards fetch error:", error);
      res.status(500).json({ error: "Failed to fetch finalized cards" });
    }
  });

  app.get("/api/user/finalized-cards/:eventId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { eventId } = req.params;
      const card = await storage.getFinalizedVoterCard(userId, eventId);
      
      if (!card) {
        return res.status(404).json({ error: "Finalized card not found" });
      }

      res.json(card);
    } catch (error) {
      console.error("Finalized card fetch error:", error);
      res.status(500).json({ error: "Failed to fetch finalized card" });
    }
  });

  app.get("/api/finalized-card/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const card = await storage.getFinalizedVoterCardById(id);
      
      if (!card) {
        return res.status(404).json({ error: "Finalized card not found" });
      }

      // Check visibility - if card is private, only owner can access
      const currentUserId = req.user?.claims?.sub;
      if (!card.isPublic && card.userId !== currentUserId) {
        return res.status(403).json({ error: "This voter card is private" });
      }

      res.json(card);
    } catch (error) {
      console.error("Finalized card fetch error:", error);
      res.status(500).json({ error: "Failed to fetch finalized card" });
    }
  });

  app.post("/api/finalized-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      console.log("[POST /api/finalized-cards] userId:", userId);
      console.log("[POST /api/finalized-cards] request body keys:", Object.keys(req.body || {}));
      
      if (!userId) {
        console.log("[POST /api/finalized-cards] No userId found - returning 401");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = finalizedVoterCardSchema.safeParse(req.body);
      
      if (!parsed.success) {
        console.log("[POST /api/finalized-cards] Validation failed:", JSON.stringify(parsed.error.issues, null, 2));
        return res.status(400).json({ error: "Invalid finalized card data", details: parsed.error });
      }

      console.log("[POST /api/finalized-cards] Validation passed, saving card for eventId:", parsed.data.eventId);
      
      const card = await storage.saveFinalizedVoterCard({
        ...parsed.data,
        userId,
        visitorId: null,
        ballotId: parsed.data.ballotId ?? null,
        state: parsed.data.state ?? null,
        showNotes: parsed.data.showNotes ?? true,
        isPublic: true,
        shareUrl: parsed.data.shareUrl ?? null,
      });
      
      console.log("[POST /api/finalized-cards] Card saved successfully with id:", card.id);
      
      res.json({
        ...card,
        shareUrl: `${req.protocol}://${req.get("host")}/card/${card.id}`,
      });
    } catch (error) {
      console.error("[POST /api/finalized-cards] Error saving card:", error);
      console.error("[POST /api/finalized-cards] Error stack:", (error as Error).stack);
      res.status(500).json({ error: "Failed to save finalized card" });
    }
  });

  app.put("/api/finalized-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      
      const existingCard = await storage.getFinalizedVoterCardById(id);
      if (!existingCard) {
        return res.status(404).json({ error: "Finalized card not found" });
      }
      
      if (existingCard.userId !== userId) {
        return res.status(403).json({ error: "You can only edit your own cards" });
      }

      const updates = req.body;
      const card = await storage.updateFinalizedVoterCard(id, updates);
      
      res.json(card);
    } catch (error) {
      console.error("Finalized card update error:", error);
      res.status(500).json({ error: "Failed to update finalized card" });
    }
  });

  return httpServer;
}

import express, { type Request, Response, NextFunction } from "express";
import { storage } from "../server/storage";
import { simplifyBallotMeasure, checkBias } from "../server/anthropic";
import { z } from "zod";
import { usernameSchema } from "../shared/schema";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Schemas
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
  visitorId: z.string(),
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
  eventId: z.string().optional(),
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ZIP code lookup
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

// Supported states
app.get("/api/states", (req, res) => {
  res.json({
    supported: SUPPORTED_STATES,
    pilot: true,
  });
});

// Ballot endpoints
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

// Election events
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

// Event subscriptions
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

// Decisions
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

// Voter cards
app.post("/api/voter-cards", async (req, res) => {
  try {
    const parsed = voterCardSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid voter card data" });
    }

    const card = await storage.saveVoterCard(parsed.data);
    const host = req.headers.host || "wethepotato.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";

    res.json({
      ...card,
      shareUrl: `${protocol}://${host}/card/${card.id}`,
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

// Finalized voter cards (visitor-based, no auth required for MVP)
app.get("/api/visitor/finalized-cards/:visitorId", async (req, res) => {
  try {
    const { visitorId } = req.params;
    const cards = await storage.getVisitorFinalizedCards(visitorId);
    res.json(cards);
  } catch (error) {
    console.error("Finalized cards fetch error:", error);
    res.status(500).json({ error: "Failed to fetch finalized cards" });
  }
});

app.get("/api/finalized-card/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const card = await storage.getFinalizedVoterCardById(id);

    if (!card) {
      return res.status(404).json({ error: "Finalized card not found" });
    }

    res.json(card);
  } catch (error) {
    console.error("Finalized card fetch error:", error);
    res.status(500).json({ error: "Failed to fetch finalized card" });
  }
});

app.post("/api/finalized-cards", async (req, res) => {
  try {
    const parsed = finalizedVoterCardSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log("Validation failed:", JSON.stringify(parsed.error.issues, null, 2));
      return res.status(400).json({ error: "Invalid finalized card data", details: parsed.error });
    }

    const card = await storage.saveFinalizedVoterCard({
      ...parsed.data,
      userId: null,
      ballotId: parsed.data.ballotId ?? null,
      state: parsed.data.state ?? null,
      showNotes: parsed.data.showNotes ?? true,
      isPublic: true,
      shareUrl: parsed.data.shareUrl ?? null,
    });

    const host = req.headers.host || "wethepotato.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";

    res.json({
      ...card,
      shareUrl: `${protocol}://${host}/card/${card.id}`,
    });
  } catch (error) {
    console.error("Error saving card:", error);
    res.status(500).json({ error: "Failed to save finalized card" });
  }
});

app.put("/api/finalized-cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorId } = req.body;

    const existingCard = await storage.getFinalizedVoterCardById(id);
    if (!existingCard) {
      return res.status(404).json({ error: "Finalized card not found" });
    }

    // Only allow owner (by visitorId) to edit
    if (existingCard.visitorId !== visitorId) {
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

// AI endpoints
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

// Analytics
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

// Admin endpoints (simplified - no auth for MVP)
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

app.get("/api/admin/events", async (req, res) => {
  try {
    const allEvents = await storage.getAllElectionEvents();
    res.json(allEvents);
  } catch (error) {
    console.error("Admin events fetch error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post("/api/admin/events", async (req, res) => {
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
      visibility: visibility || "public",
      archived: false,
    });

    res.json(event);
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.put("/api/admin/events/:id", async (req, res) => {
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

// Username check (for future auth)
app.get("/api/username/check/:username", async (req, res) => {
  try {
    const { username } = req.params;

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

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  res.status(status).json({ message });
});

// Export for Vercel
export default app;

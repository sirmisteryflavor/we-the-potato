# We The Potato - Civic Engagement Web App

A mobile-first Next.js web application designed to inform and engage voters for the 2026 primary elections. The app provides comprehensive ballot information, allows users to track their voting decisions, manage election event notifications, and generate shareable "voter cards" for social sharing.

**Status**: MVP Phase 1 Complete ✅
- 2026 NY Democratic Primary with 101 real candidates from Ballotpedia
- Full ballot to voter card creation pipeline working
- Deployed on Vercel

---

## 1. PROJECT OVERVIEW

### What This App Does
"We The Potato" simplifies the election process and encourages civic participation by:
- Providing real ballot information from Ballotpedia (2026 NY House races with 101 candidates)
- Allowing users to record their voting decisions on candidates by district
- Tracking decisions in localStorage with server sync capability
- Generating shareable voter cards in multiple templates
- Supporting election event subscriptions and notifications
- Providing comprehensive ballot data storage for analytics and sharing

### Main Features
- **3-Step Onboarding**: ZIP code validation → Issue preference ranking → Complete
- **District-Based Ballots**: Automatic ballot fetching based on zipcode using district mapping
- **Candidate Voting**: Select preferred candidate per race with biographical info, photos, endorsements
- **Voter Card Generator**: Multiple templates (minimal, bold, professional) for social sharing
- **Election Events**: Browse upcoming elections by state with subscription support
- **Ballot Storage**: Complete ballot data persisted to database for analytics and future features
- **Dark/Light Mode**: Full theme support with user preference persistence
- **Responsive Design**: Mobile-first with full desktop support

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Shadcn UI, Framer Motion |
| State Management | TanStack Query v5, localStorage |
| Routing | Next.js App Router |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL (Neon) with Drizzle ORM |
| Data Sources | Ballotpedia (web scraper) |
| Authentication | localStorage (visitor IDs) |
| Image Generation | html2canvas, canvas-confetti |
| Deployment | Vercel |

---

## 2. FILE STRUCTURE

```
we-the-potato/
├── app/                             # Next.js App Router
│   ├── (routes)/                    # Route grouping
│   │   ├── card/[id]/              # Voter card display
│   │   │   └── page.tsx
│   │   └── ...other routes
│   ├── api/                         # API Routes
│   │   ├── ballot/[zipcode]/       # Get ballot for zipcode
│   │   │   └── route.ts
│   │   ├── candidates/
│   │   │   └── race/[raceId]/      # Get candidates for race
│   │   │       └── route.ts
│   │   ├── races/
│   │   │   └── by-state/[state]/   # Get races by state
│   │   │       └── route.ts
│   │   ├── lookup-zip/[zipcode]/   # Validate zipcode -> state/county
│   │   │   └── route.ts
│   │   ├── events/                  # Election events management
│   │   │   ├── [state]/            # Get events by state
│   │   │   ├── subscribe/          # Subscribe to event
│   │   │   ├── unsubscribe/        # Unsubscribe from event
│   │   │   └── ...routes
│   │   ├── finalized-cards/        # Voter card persistence
│   │   │   ├── route.ts            # Create/get cards
│   │   │   └── [id]/route.ts       # Get specific card
│   │   ├── user/                    # User-specific endpoints
│   │   │   └── finalized-cards/    # Get user's cards
│   │   │       └── route.ts
│   │   ├── visitor/                 # Visitor (anonymous) endpoints
│   │   │   └── finalized-cards/    # Get visitor's cards
│   │   │       └── [visitorId]/route.ts
│   │   └── ...other API routes
│   ├── home/                        # Home/elections page
│   │   ├── page.tsx                # Elections list
│   │   └── home-client.tsx         # Client component
│   ├── onboarding/                 # Onboarding flow
│   │   └── page.tsx
│   ├── ballot/                     # Ballot viewing and voting
│   │   └── page.tsx
│   ├── voter-card/                 # Voter card creation
│   │   ├── page.tsx
│   │   └── [id]/                   # Edit existing card
│   │       └── page.tsx
│   ├── landing-client.tsx          # Landing page client component
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Landing page
├── components/                      # Reusable React components
│   ├── ui/                          # Shadcn UI components (40+ components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   └── ...more UI components
│   ├── app-header.tsx              # Main navigation header
│   ├── candidate-card.tsx          # Candidate display component
│   ├── issue-ranker.tsx            # Drag-drop issue ranking
│   ├── nav-menu.tsx                # Navigation menu
│   ├── theme-toggle.tsx            # Dark/light mode toggle
│   ├── voter-card-preview.tsx      # Card preview component
│   ├── downloadable-voter-card.tsx # Image generation
│   └── ...other components
├── hooks/                           # Custom React hooks
│   ├── useAuth.ts                  # Authentication state
│   ├── use-measure-decisions.ts    # Decision management
│   ├── use-notes.ts                # Notes management
│   ├── use-toast.ts                # Toast notifications
│   └── ...other hooks
├── lib/                             # Utility functions
│   ├── db.ts                       # Database connection (Drizzle + Neon)
│   ├── schema.ts                   # Database schema and types
│   ├── storage.ts                  # Client localStorage utilities
│   ├── storage-server.ts           # Server-side storage operations
│   ├── queryClient.ts              # TanStack Query config
│   ├── theme.tsx                   # Theme provider
│   ├── utils.ts                    # General utilities
│   └── ...other utilities
├── data/                            # Static data
│   └── mock-ballot.ts              # Sample ballot for testing
├── scripts/                         # Node.js scripts
│   ├── seed-zipcodes.ts            # Seed zipcode -> district mapping
│   ├── seed-ny-2026-elections.ts   # Seed election events and candidates
│   └── scrape-ballotpedia-2026.ts  # Ballotpedia web scraper (101 NY candidates)
├── __tests__/                       # Test files
│   └── data-structures.test.ts     # Candidate data transformation tests
├── public/                          # Static assets
│   └── favicon.ico
├── DATA_STRUCTURE_AUDIT.md         # Documentation of data schema mismatches
├── drizzle.config.ts               # Drizzle ORM configuration
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── package-lock.json               # Dependency lock file
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── .env.local                      # Environment variables (git ignored)
```

### Critical Data Flow
**Ballot Load Path**: User enters zipcode → `/api/lookup-zip/{zipcode}` → `/api/ballot/{zipcode}` → Database saves ballot → Frontend displays races and candidates

**Voter Card Creation Path**: Select candidates → `/api/finalized-cards` POST → Database insert (with eventId, ballotId) → Redirect to card view → Share URL

### Main Logic Files
- `app/api/ballot/[zipcode]/route.ts` - Fetch and persist ballots
- `app/ballot/page.tsx` - Core ballot viewing/voting logic
- `app/voter-card/page.tsx` - Voter card creation and preview
- `lib/storage-server.ts` - Database CRUD operations
- `scripts/scrape-ballotpedia-2026.ts` - Real candidate data from Ballotpedia

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `next.config.js` - Next.js build config
- `drizzle.config.ts` - Database ORM config
- `tailwind.config.ts` - CSS utility classes
- `tsconfig.json` - TypeScript compiler options

---

## 3. DEPENDENCIES

### Core Framework
| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI rendering |
| `typescript` | Type safety |
| `vite` | Fast development bundler |
| `express` | Backend HTTP server |

### UI Components & Styling
| Package | Purpose |
|---------|---------|
| `tailwindcss` | Utility-first CSS |
| `@radix-ui/*` | Accessible UI primitives (50+ packages) |
| `class-variance-authority` | Component variant management |
| `clsx`, `tailwind-merge` | Conditional class merging |
| `lucide-react` | Icon library |
| `framer-motion` | Animations |
| `embla-carousel-react` | Carousel component |
| `recharts` | Analytics charts |

### State & Data
| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management and caching |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Form validation with Zod |
| `zod` | Runtime type validation |
| `wouter` | Client-side routing |

### Database
| Package | Purpose |
|---------|---------|
| `drizzle-orm` | TypeScript ORM |
| `drizzle-zod` | Zod schema generation from Drizzle |
| `@neondatabase/serverless` | PostgreSQL driver for Neon |
| `connect-pg-simple` | Session storage in PostgreSQL |

### Authentication
| Package | Purpose |
|---------|---------|
| `passport` | Authentication middleware |
| `openid-client` | OpenID Connect client |
| `express-session` | Session management |

### AI & Image Generation
| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude AI for ballot simplification |
| `html2canvas` | DOM to image conversion |
| `html-to-image` | Alternative image generation |
| `canvas-confetti` | Celebration effects |

### Utilities
| Package | Purpose |
|---------|---------|
| `date-fns` | Date formatting |
| `memoizee` | Function memoization |
| `p-limit`, `p-retry` | Rate limiting and retries |

### External APIs & Services
- **Anthropic Claude API** - Simplifies ballot measure language and checks for political bias
- **Replit Auth** - OAuth authentication (Google, GitHub, Apple, email)
- **Neon PostgreSQL** - Serverless database hosting

---

## 4. ENVIRONMENT VARIABLES

### Required Secrets
```bash
# Database connection
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=your-db-host.neon.tech
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432

# Session encryption
SESSION_SECRET=your-random-32-character-string

# AI Integration (automatically configured on Replit)
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-xxxxx
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### Auto-Configured by Replit
```bash
# Domain information (set automatically)
REPLIT_DOMAINS=your-app.replit.app
REPLIT_DEV_DOMAIN=your-app.replit.dev
REPL_ID=unique-repl-identifier
```

### Example `.env` File
```env
DATABASE_URL=postgresql://neondb_owner:abc123@ep-cool-rain-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=super-secret-session-key-change-me
```

---

## 5. KEY FUNCTIONS

### API Endpoints

#### Zipcode & Location
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lookup-zip/:zipCode` | Validate zipcode, return state/county/supported |

#### Ballot Data (Dynamically Loaded)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ballot/:zipcode` | Get complete ballot for zipcode (persists to DB) |
| GET | `/api/races/by-state/:state` | Get all races by state |
| GET | `/api/candidates/race/:raceId` | Get candidates for specific race |

#### Election Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:state` | Get upcoming election events by state |
| GET | `/api/event/:id` | Get details for single election event |
| POST | `/api/events/subscribe` | Subscribe to election event notifications |
| POST | `/api/events/unsubscribe` | Unsubscribe from election event |

#### Voter Cards (Finalized)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/finalized-cards` | Create finalized voter card (saves to DB) |
| GET | `/api/finalized-cards/:id` | Get finalized card by ID |
| GET | `/api/user/finalized-cards` | Get authenticated user's cards |
| GET | `/api/visitor/finalized-cards/:visitorId` | Get visitor's cards (anonymous) |

### Database Schema

#### Users Table
```typescript
users: {
  id: string (primary key)
  email: string (unique)
  username: string (unique, 3-30 chars)
  firstName: string
  lastName: string
  profileImageUrl: string
  zipCode: string
  state: string (2 chars)
  county: string
  birthYear: number
  preferences: JSON
  issueRanking: JSON
  createdAt: timestamp
}
```

#### Ballots Table (New)
```typescript
ballots: {
  id: string (primary key)
  eventId: string (FK → electionEvents)
  state: string (2 chars)
  county: string (nullable)
  city: string (nullable)
  zipcode: varchar(5) (nullable)
  electionDate: string
  electionType: string
  // Indexing fields
  raceIds: text (JSON array of race IDs)
  measureIds: text (JSON array of measure IDs)
  racesCount: integer
  measuresCount: integer
  // Denormalized data
  races: jsonb (array of complete race objects)
  measures: jsonb (array of ballot measures)
  candidates: jsonb (flattened candidates with race context)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Districts Table
```typescript
districts: {
  id: string (primary key)
  state: string
  type: 'congressional' | 'state_senate' | 'state_assembly' | 'city_council'
  number: string
  name: string
  counties: jsonb (array of county names)
  createdAt: timestamp
}
```

#### Races Table
```typescript
races: {
  id: string (primary key)
  electionYear: integer
  state: string
  districtId: string (FK → districts)
  raceType: string
  office: string (e.g., "U.S. House", "State Senate")
  position: string (nullable)
  isPrimary: boolean
  primaryType: string (nullable)
  description: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Candidates Table
```typescript
candidates: {
  id: string (primary key, e.g., "candidate-smith-john-2026-ny-13")
  electionYear: integer
  firstName: string
  lastName: string
  party: string
  incumbentStatus: string (nullable, e.g., "incumbent")
  photoUrl: string (nullable, link to Ballotpedia/Wikipedia)
  websiteUrl: string (nullable)
  bio: string (nullable)
  position: string (nullable, from Ballotpedia)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Election Events Table
```typescript
electionEvents: {
  id: string (primary key, e.g., "2026-NY-DEMOCRATIC-PRIMARY")
  state: string
  county: string (nullable)
  title: string (e.g., "2026 New York Democratic Primary")
  eventType: string (e.g., "primary", "general", "runoff")
  electionDate: string (YYYY-MM-DD)
  registrationDeadline: string (nullable)
  description: string (nullable)
  ballotId: string (FK, nullable)
  status: 'upcoming' | 'current' | 'passed'
  visibility: 'public' | 'private'
  archived: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Finalized Voter Cards Table
```typescript
finalizedVoterCards: {
  id: string (primary key)
  userId: string (FK → users, nullable)
  visitorId: string (nullable, for anonymous users)
  eventId: string (FK → electionEvents, required)
  ballotId: string (FK → ballots, nullable)
  template: 'minimal' | 'bold' | 'professional'
  location: string (e.g., "New York County, NY")
  state: string (nullable)
  electionDate: string
  electionType: string
  decisions: jsonb (array of { type, title, decision, note, hidden })
  showNotes: boolean (default: true)
  isPublic: boolean (default: true)
  shareUrl: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Important Functions by Location

**`server/anthropic.ts`**
- `simplifyBallotMeasure(text, title)` - Uses Claude to simplify complex ballot language
- `checkBias(content, type)` - Analyzes content for political bias

**`server/storage.ts`**
- `getUser(id)` / `upsertUser(user)` - User CRUD
- `isUsernameAvailable(username)` - Check username uniqueness
- `getBallot(state, county)` - Fetch ballot data
- `getUserFinalizedCards(userId)` - Get user's voter cards
- `saveFinalizedVoterCard(card)` - Persist voter card

**`client/src/lib/storage.ts`**
- `getOnboardingData()` / `saveOnboardingData(data)` - Local preferences
- `getVisitorId()` - Anonymous user tracking
- `getDecisions(ballotId)` / `saveDecisions(ballotId, decisions)` - Local decision storage

**`client/src/components/downloadable-voter-card.tsx`**
- `generateCardImage(format)` - Creates PNG from voter card DOM

---

## 6. CURRENT STATE & RECENT FIXES

### Phase 1 Complete Features ✅
- 3-step onboarding (ZIP code validation → Issue ranking → Complete)
- Ballot display with 101 real 2026 NY House candidates from Ballotpedia
- Candidate selection and decision tracking
- Voter card creation with template selection
- Ballot persistence to database with proper foreign keys
- Election event subscription and browsing
- Dark/light mode toggle with hydration-safe rendering
- Full end-to-end data flow: ballot → voter card → database

### Recently Fixed Issues (Phase 1 Completion)
1. **Hydration Errors** - Fixed SVG rendering mismatches in ThemeToggle and NavMenu components
2. **Foreign Key Constraints** - Properly designed ballot schema with eventId reference
3. **Voter Card Creation** - Fixed missing createdAt/updatedAt fields in database insert
4. **Data Transformation** - Implemented consistent pipeline: API races → flattened candidates with proper field mapping
5. **Ballot Storage** - Ballots now automatically saved to database on first load for future use cases
6. **ZIP Code Based API** - Changed from state-based to zipcode-based ballot endpoint for accuracy

### Known Limitations
1. **Single Election Event** - Currently supports only 2026 NY Democratic Primary (template for expansion)
2. **No User Authentication** - Visitor IDs used for anonymous tracking (can add OAuth later)
3. **No Email Notifications** - Subscription infrastructure exists but email delivery not implemented
4. **Ballot Measures** - UI prepared but no ballot measure data seeded yet
5. **Candidate Photos** - Limited to Ballotpedia-provided images

### Areas for Future Enhancement
1. **Ballot Measures** - Seed ballot measure data and implement voting UI
2. **Multiple Elections** - Expand to support state senate, assembly, local races
3. **AI Summaries** - Claude integration for candidate bio summarization
4. **Endorsement Badges** - Display endorsement logos on candidate cards
5. **Sharing Analytics** - Track which candidates users share and engagement
6. **Offline Support** - Service Worker for offline ballot access
7. **Search & Filter** - Full-text search across candidates and races
8. **Accessibility Audit** - Comprehensive WCAG compliance review
9. **Mobile App** - React Native version with offline support
10. **Multi-State Expansion** - Repeat NY process for NJ, PA, CT, TX pilot states

---

## 7. HOW TO RUN LOCALLY

### Prerequisites
- Node.js 18+ (20+ recommended)
- PostgreSQL database (Neon serverless recommended)
- Git for version control

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sirmisteryflavor/we-the-potato.git
   cd we-the-potato
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
   ```
   - Get DATABASE_URL from Neon dashboard
   - Add `?sslmode=require` for Neon connections

4. **Initialize the database**
   ```bash
   npm run db:push
   ```
   This creates all required tables using Drizzle ORM.

5. **Seed initial data** (Optional but recommended)
   ```bash
   npm run seed-zipcodes          # Create NYC area zipcode mappings
   npm run seed-ny-elections      # Create 2026 NY election event and districts
   npm run scrape-ballotpedia     # Fetch 101 real 2026 NY House candidates
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

### Available Scripts
```bash
npm run dev                  # Start Next.js dev server (hot reload)
npm run build               # Build for production
npm run start               # Run production build
npm run lint                # Check TypeScript and linting
npm run db:push             # Push schema changes to database
npm run seed-zipcodes       # Seed zipcode -> district mappings for NY
npm run seed-ny-elections   # Seed 2026 NY election event and districts
npm run scrape-ballotpedia  # Scrape Ballotpedia for 2026 candidates
```

### Testing the Full Flow Locally

After setup, test the complete ballot → voter card flow:

1. **Open the app**
   ```
   http://localhost:3000
   ```

2. **Complete onboarding**
   - Enter ZIP code: `10001` (NYC - New York County)
   - Rank issue preferences
   - Complete onboarding

3. **View elections**
   - Should see "2026 New York Democratic Primary"
   - Click to view ballot

4. **View ballot**
   - See U.S. House candidates for your district
   - Select preferred candidate per race
   - View decisions tab

5. **Create voter card**
   - Click "Create My Card"
   - Preview card with your decisions
   - Select template (Minimal, Bold, or Professional)
   - See finalized card with sharing URL

### Common Errors and Fixes

#### "Cannot connect to database"
- Verify `DATABASE_URL` is correct in `.env.local`
- For Neon: Include `?sslmode=require` at end of URL
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

#### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

#### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

#### "Drizzle migration failed"
```bash
# Force schema sync
npm run db:push
```

#### "No candidates showing on ballot"
- Verify seed scripts ran successfully:
  ```bash
  npm run seed-zipcodes
  npm run seed-ny-elections
  npm run scrape-ballotpedia
  ```
- Check database: `SELECT COUNT(*) FROM candidates;` (should be 101)

#### "Voter card creation fails with foreign key error"
- Ensure election event exists:
  ```bash
  npm run seed-ny-elections
  ```
- Check: `SELECT * FROM election_events;`

### Vercel Deployment

The app is auto-deployed to Vercel on every `git push` to main:

```bash
# Push changes
git add .
git commit -m "Your message"
git push origin main

# Vercel will automatically:
# 1. Build the Next.js app
# 2. Run database migrations
# 3. Deploy to vercel.app domain
```

Check deployment status at: https://vercel.com/sirmisteryflavor/we-the-potato

---

## 8. DATA SOURCES & BALLOTPEDIA INTEGRATION

### Ballotpedia Scraper
The project includes a web scraper (`scripts/scrape-ballotpedia-2026.ts`) that:
- Fetches 2026 NY Congressional race data from Ballotpedia
- Extracts 101 real candidate profiles across 14 NYC-area districts
- Collects: names, party affiliation, incumbent status, photos, websites, bios
- Implements rate limiting (2 concurrent requests) and retry logic (3 retries)
- Caches data to avoid repeated requests

**Running the scraper:**
```bash
npm run scrape-ballotpedia
```

**Data collected per candidate:**
- ID (e.g., "candidate-smith-john-2026-ny-13")
- First/Last names
- Party affiliation
- Incumbent status
- Official photo URL
- Website URL
- Bio/experience summary
- District and office information

### Data Quality
- 101 real 2026 candidates from Ballotpedia
- NYC/surrounding area focus (14 congressional districts)
- Photo URLs link to Wikipedia/official sources
- Verified against Ballotpedia directly
- Endorsement data structure ready for future expansion

### Future Data Sources
- **Ballot Measures**: State legislative tracking sites
- **Endorsements**: Interest group databases
- **Voting Records**: LegiScan API for incumbents
- **Campaign Finance**: FEC.gov for federal candidates
- **Polling**: RealClearPolitics aggregation

---

## 9. ARCHITECTURE DECISIONS

### Why Next.js?
- Unified frontend/backend in single codebase
- Server-side rendering for better performance
- API routes eliminate need for separate backend
- Built-in database integration with Drizzle
- Automatic code splitting and optimization
- Easy deployment to Vercel

### Why Zipcode-Based Ballots?
- More accurate than state-based (users want local races)
- Integrates with congressional districts
- Enables precise ballot generation
- Supports future city council/local races
- Allows ballot customization by location

### Why Ballots in Database?
- Analytics on ballot contents by geography
- Ballot versioning for historical tracking
- Enables ballot comparison tools
- Voter cards have permanent ballot reference
- Supports future features (ballot similarity, etc.)

### Data Transformation Pipeline
```
Database (firstName, lastName, bio)
    ↓
API (add office from race, default arrays)
    ↓
Frontend (combine name, map bio→experience)
    ↓
Voter Card (all required fields present)
```

---

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m "Add feature: ..."`)
5. Push to your fork (`git push origin feature/your-feature`)
6. Submit a pull request with description

---

Built with purpose for the 2026 elections. MVP Phase 1 complete, ready for expansion to additional election cycles and states.

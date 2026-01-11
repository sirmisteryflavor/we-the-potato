# We The Potato - Civic Engagement Web App

A mobile-first web application designed to inform and engage voters for the 2026 state primary elections. The app provides comprehensive ballot information, allows users to track their voting decisions, manage election event notifications, and generate shareable "voter cards" for social sharing.

---

## 1. PROJECT OVERVIEW

### What This App Does
"We The Potato" simplifies the election process and encourages civic participation by:
- Providing ballot information for 5 pilot states (NY, NJ, PA, CT, TX)
- Allowing users to record their voting decisions on ballot measures and candidates
- Generating shareable voter cards in multiple formats (1:1 square and 9:16 story)
- Supporting personalized username-based profile URLs for sharing
- Using AI to simplify complex ballot measure language

### Main Features
- **Onboarding Flow**: 4-screen flow with ZIP code validation, issue ranking, and guest/email options
- **Ballot Display**: Collapsible proposition cards with AI-simplified summaries and decision tracking
- **Voter Card Generator**: Multiple templates (minimal, bold, professional) for shareable voter cards
- **User Profiles**: Username-based public profile pages at `wethepotato.com/username`
- **Election Following**: Subscribe to election events for updates
- **Admin Panel**: Comprehensive ballot and event management with visibility controls
- **Dark/Light Mode**: Full theme support with user preference persistence

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Shadcn UI, Framer Motion |
| State Management | TanStack Query v5 |
| Routing | Wouter |
| Backend | Express.js, Node.js |
| Database | PostgreSQL (Neon) with Drizzle ORM |
| AI | Anthropic Claude (via Replit AI Integrations) |
| Authentication | Replit Auth (OpenID Connect) |
| Image Generation | html2canvas, html-to-image |

---

## 2. FILE STRUCTURE

```
we-the-potato/
├── client/                          # Frontend React application
│   ├── public/
│   │   └── favicon.png              # App favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # Shadcn UI components (50+ components)
│   │   │   │   ├── button.tsx       # Primary button component
│   │   │   │   ├── card.tsx         # Card container component
│   │   │   │   ├── dialog.tsx       # Modal dialogs
│   │   │   │   ├── form.tsx         # Form wrapper with validation
│   │   │   │   ├── tabs.tsx         # Tab navigation
│   │   │   │   └── ...              # Additional UI primitives
│   │   │   ├── app-header.tsx       # Main navigation header
│   │   │   ├── auth-gate.tsx        # Authentication wrapper component
│   │   │   ├── ballot-measure-card.tsx  # Ballot measure display card
│   │   │   ├── candidate-card.tsx   # Candidate info display
│   │   │   ├── decision-buttons.tsx # Yes/No/Skip voting buttons
│   │   │   ├── downloadable-voter-card.tsx # Card image generation
│   │   │   ├── issue-ranker.tsx     # Drag-and-drop issue ranking
│   │   │   ├── share-modal.tsx      # Social sharing modal
│   │   │   ├── theme-toggle.tsx     # Dark/light mode toggle
│   │   │   ├── username-setup-modal.tsx # Username creation modal
│   │   │   └── voter-card-preview.tsx   # Live voter card preview
│   │   ├── data/
│   │   │   └── mock-ballot.ts       # Sample ballot data for testing
│   │   ├── hooks/
│   │   │   ├── use-measure-decisions.ts # Decision state management
│   │   │   ├── use-mobile.tsx       # Mobile detection hook
│   │   │   ├── use-notes.ts         # User notes management
│   │   │   ├── use-toast.ts         # Toast notification hook
│   │   │   └── useAuth.ts           # Authentication state hook
│   │   ├── lib/
│   │   │   ├── authUtils.ts         # Auth helper functions
│   │   │   ├── card-styles.ts       # Voter card template styles
│   │   │   ├── queryClient.ts       # TanStack Query configuration
│   │   │   ├── storage.ts           # LocalStorage utilities
│   │   │   ├── theme.tsx            # Theme provider component
│   │   │   └── utils.ts             # General utility functions
│   │   ├── pages/
│   │   │   ├── admin.tsx            # Admin panel for ballot/event management
│   │   │   ├── analytics.tsx        # Analytics dashboard
│   │   │   ├── ballot.tsx           # Ballot viewing and decision making
│   │   │   ├── card.tsx             # Single voter card view page
│   │   │   ├── home-feed.tsx        # Main election feed
│   │   │   ├── landing.tsx          # Landing page
│   │   │   ├── not-found.tsx        # 404 page
│   │   │   ├── onboarding.tsx       # User onboarding flow
│   │   │   ├── profile.tsx          # User profile management
│   │   │   ├── public-profile.tsx   # Public username profile view
│   │   │   ├── share-card.tsx       # Shared card landing page
│   │   │   └── voter-card.tsx       # Voter card creation/editing
│   │   ├── App.tsx                  # Main app with routing
│   │   ├── index.css                # Global styles and Tailwind config
│   │   └── main.tsx                 # React entry point
│   └── index.html                   # HTML template
├── server/                          # Backend Express application
│   ├── anthropic.ts                 # Anthropic Claude AI integration
│   ├── db.ts                        # Database connection (Drizzle + Neon)
│   ├── index.ts                     # Server entry point
│   ├── replitAuth.ts                # Replit Auth configuration
│   ├── routes.ts                    # All API route definitions
│   ├── static.ts                    # Static file serving
│   ├── storage.ts                   # Database operations (CRUD)
│   └── vite.ts                      # Vite dev server integration
├── shared/
│   └── schema.ts                    # Database schema and TypeScript types
├── script/
│   └── build.ts                     # Production build script
├── attached_assets/                 # User-uploaded assets
├── components.json                  # Shadcn UI configuration
├── design_guidelines.md             # UI/UX design system
├── drizzle.config.ts                # Drizzle ORM configuration
├── package.json                     # Dependencies and scripts
├── postcss.config.js                # PostCSS configuration
├── replit.md                        # Project documentation for AI
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── vite.config.ts                   # Vite bundler configuration
```

### Main Logic Files
- `server/routes.ts` - All API endpoints and request handling
- `server/storage.ts` - Database CRUD operations
- `client/src/pages/ballot.tsx` - Core ballot viewing/voting logic
- `client/src/pages/voter-card.tsx` - Voter card creation
- `client/src/components/downloadable-voter-card.tsx` - Image generation

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `vite.config.ts` - Frontend bundler config
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

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/user` | Get current authenticated user |
| GET | `/api/login` | Initiate OAuth login |
| GET | `/api/callback` | OAuth callback handler |
| GET | `/api/logout` | End user session |

#### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/username/check/:username` | Check username availability |
| POST | `/api/user/username` | Set user's username |
| GET | `/api/users/:username` | Get public profile by username |
| GET | `/api/users/:username/cards` | Get user's public voter cards |

#### Ballots & Elections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lookup-zip/:zipCode` | Get state/county from ZIP |
| GET | `/api/states` | List supported states |
| GET | `/api/ballot/:state` | Get ballot for state |
| GET | `/api/events/:state` | Get election events for state |
| GET | `/api/event/:id` | Get single election event |

#### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/simplify-ballot-measure` | Simplify ballot measure text |
| POST | `/api/check-bias` | Check text for political bias |

#### Voter Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voter-cards/:id` | Get voter card by ID |
| POST | `/api/voter-cards` | Create voter card |
| GET | `/api/finalized-card/:id` | Get finalized card |
| POST | `/api/finalized-cards` | Create finalized card |
| PUT | `/api/finalized-cards/:id` | Update card (visibility, etc.) |
| GET | `/api/user/finalized-cards` | Get all user's cards |

#### Admin (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/ballots` | List all ballots |
| PUT | `/api/admin/ballots/:id` | Update ballot |
| GET/POST | `/api/admin/events` | List/create events |
| PUT/DELETE | `/api/admin/events/:id` | Update/delete event |
| POST | `/api/admin/events/:id/archive` | Archive event |

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

#### Election Events Table
```typescript
electionEvents: {
  id: string (primary key)
  state: string
  county: string
  title: string
  eventType: string
  electionDate: string
  registrationDeadline: string
  description: string
  ballotId: string (FK)
  status: 'upcoming' | 'passed'
  visibility: 'public' | 'private'
  archived: boolean
}
```

#### Finalized Voter Cards Table
```typescript
finalizedVoterCards: {
  id: string (primary key)
  userId: string (FK)
  eventId: string (FK)
  template: 'minimal' | 'bold' | 'professional'
  location: string
  electionDate: string
  decisions: JSON (array of decisions)
  showNotes: boolean
  isPublic: boolean
  shareUrl: string
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

## 6. KNOWN ISSUES

### Current Bugs
1. **html2canvas blur limitation** - CSS `filter: blur()` doesn't render in generated images; workaround uses radial gradients instead
2. **Route matching conflicts** - The `/:username/:cardId` route can conflict with `/card/:id`; resolved with careful route ordering

### Incomplete Features
1. **Email notifications** - Subscription system exists but email sending not implemented
2. **Production database operations** - Admin can only manipulate development database, not production
3. **Candidate voting** - UI exists but candidate selection logic is less developed than measure voting
4. **Analytics dashboard** - Basic tracking exists but visualization is minimal

### Areas Needing Improvement
1. **Offline support** - LocalStorage used but no Service Worker for true offline capability
2. **Image optimization** - Large voter card images not optimized for social sharing
3. **Rate limiting** - AI endpoints lack rate limiting for abuse prevention
4. **Search functionality** - Basic text search; could benefit from fuzzy matching
5. **Accessibility** - Shadcn provides good baseline but needs audit for screen readers
6. **Test coverage** - No automated tests currently implemented
7. **Error boundaries** - Missing React error boundaries for graceful failure handling

---

## 7. HOW TO RUN LOCALLY

### Prerequisites
- Node.js 20+ 
- PostgreSQL database (Neon recommended)
- Anthropic API key (optional, for AI features)

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd we-the-potato
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   SESSION_SECRET=your-secret-key-at-least-32-chars
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```
   This creates all required tables using Drizzle.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`

### Available Scripts
```bash
npm run dev      # Start development server (hot reload)
npm run build    # Build for production
npm run start    # Run production build
npm run check    # TypeScript type checking
npm run db:push  # Push schema changes to database
```

### Common Errors and Fixes

#### "Cannot connect to database"
- Verify `DATABASE_URL` is correct in `.env`
- Ensure PostgreSQL is running and accessible
- Check if SSL is required: add `?sslmode=require` to connection string

#### "Session secret required"
- Add `SESSION_SECRET` to your `.env` file
- Must be at least 32 characters for security

#### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

#### "Port 5000 already in use"
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>
```

#### "Drizzle migration failed"
- Ensure database credentials are correct
- Check if database exists and user has permissions
- Try: `npm run db:push` to force sync

#### "AI features not working"
- Anthropic API key must be set
- On Replit: AI integrations are auto-configured
- Locally: Add `AI_INTEGRATIONS_ANTHROPIC_API_KEY` to `.env`

### Running on Replit
The app is pre-configured for Replit. Simply:
1. Open the Replit project
2. Click "Run" - the workflow handles everything automatically
3. Database and AI integrations are auto-configured

---

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with purpose for the 2026 elections.

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
  ballotId: string | null;
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
    this.initializeBallotData();
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

  private async initializeBallotData() {
    const existingBallots = await db().select().from(ballots).limit(1);
    if (existingBallots.length === 0) {
      const allBallots = this.getAllStateBallots();
      for (const ballot of allBallots) {
        await db().insert(ballots).values({
          id: ballot.id,
          state: ballot.state,
          county: ballot.county,
          electionDate: ballot.electionDate,
          electionType: ballot.electionType,
          measures: ballot.measures,
          candidates: ballot.candidates,
        }).onConflictDoNothing();
      }
    }
  }

  private getAllStateBallots(): StoredBallot[] {
    return [
      this.getNYBallot(),
      this.getNJBallot(),
      this.getPABallot(),
      this.getCTBallot(),
      this.getTXBallot(),
    ];
  }

  private getNYBallot(): StoredBallot {
    return {
      id: "ny-2026-primary",
      state: "NY",
      county: null,
      electionDate: "June 23, 2026",
      electionType: "Primary Election",
      measures: [
        {
          id: "ny-prop-1",
          number: "Proposal 1",
          title: "Clean Water, Clean Air, and Green Jobs Environmental Bond Act",
          originalText: "To address and combat the impact of climate change and damage to the environment, this proposal authorizes the State to issue bonds up to four billion two hundred million dollars to fund environmental protection, natural restoration, resiliency, and clean energy projects.",
          summary: {
            oneSentence: "Authorizes $4.2 billion in bonds for environmental and clean energy projects.",
            simple: "This measure allows New York to borrow $4.2 billion to fund projects that protect the environment, restore natural areas, prepare for climate change impacts, and support clean energy. The money would go toward things like flood protection, clean water infrastructure, and green jobs.",
            detailed: "This bond act would authorize New York State to issue up to $4.2 billion in general obligation bonds to fund environmental initiatives. The funds would be allocated across several categories: $1.5 billion for climate change mitigation, $650 million for restoration and flood risk reduction, $650 million for open space land conservation, $650 million for water quality improvement, and $750 million for green building and climate-resilient community infrastructure."
          },
          fiscalImpact: "Would cost taxpayers approximately $300 million per year in bond repayments for 30 years. Creates an estimated 84,000 jobs.",
          supporters: ["Environmental Defense Fund", "NY League of Conservation Voters", "Building Trades Council"],
          opponents: ["Fiscal Policy Institute (concerns about debt)", "Some taxpayer advocacy groups"],
          category: "environment"
        },
        {
          id: "ny-prop-2",
          number: "Proposal 2",
          title: "Right to Clean Air and Water Amendment",
          originalText: "Amendment to protect the right of each person to clean air and water and a healthful environment.",
          summary: {
            oneSentence: "Adds environmental rights to the state constitution.",
            simple: "This would add a new right to the New York State Constitution, guaranteeing every person the right to clean air, clean water, and a healthful environment. It would allow citizens to sue the state if these rights are violated.",
            detailed: "This constitutional amendment would establish that each person has an enforceable right to clean air, clean water, and a healthful environment. This would make New York the third state to include environmental rights in its constitution, following Pennsylvania and Montana."
          },
          supporters: ["Sierra Club", "Earthjustice", "NY Environmental Law Center"],
          opponents: ["NY Business Council", "Some municipal governments"],
          category: "environment"
        },
        {
          id: "ny-prop-3",
          number: "Proposal 3",
          title: "Ranked Choice Voting for Local Elections",
          originalText: "This proposal would allow cities and towns in New York State to adopt ranked choice voting for local elections through local law or referendum.",
          summary: {
            oneSentence: "Lets local governments choose to use ranked choice voting.",
            simple: "This measure allows cities and towns in New York to decide if they want to use ranked choice voting for their local elections. With ranked choice voting, you rank candidates in order of preference instead of just picking one.",
            detailed: "This proposal would enable municipalities in New York to adopt ranked choice voting (RCV) for local elections. Under RCV, voters rank candidates by preference. If no candidate receives a majority of first-choice votes, the candidate with the fewest votes is eliminated and their voters' second choices are counted."
          },
          supporters: ["League of Women Voters", "FairVote NY", "Common Cause NY"],
          opponents: ["Some county election boards (implementation concerns)", "NY Conservative Party"],
          category: "public_safety"
        },
        {
          id: "ny-prop-4",
          number: "Proposal 4",
          title: "Small Business Property Tax Reduction",
          originalText: "Shall small businesses with assessed property value under $2 million receive a 15% reduction in property taxes for the next five years?",
          summary: {
            oneSentence: "Cuts property taxes by 15% for small businesses for 5 years.",
            simple: "This measure gives small businesses a 15% discount on their property taxes for five years. It applies to businesses with property worth less than $2 million. The goal is to help small businesses survive and grow.",
            detailed: "This proposal would provide a 15% property tax reduction for qualifying small businesses for a five-year period. To qualify, a business must have an assessed property value under $2 million and fewer than 50 employees."
          },
          fiscalImpact: "Estimated cost of $180 million annually in foregone tax revenue.",
          supporters: ["NY Small Business Association", "Chamber of Commerce", "Restaurant Association"],
          opponents: ["Municipal governments (revenue concerns)", "Property tax reform advocates"],
          category: "economy"
        },
        {
          id: "ny-prop-5",
          number: "Proposal 5",
          title: "Universal Pre-K Expansion",
          originalText: "This proposal would require the state to provide funding for universal pre-kindergarten for all three and four year olds by 2028.",
          summary: {
            oneSentence: "Mandates free pre-K for all 3 and 4 year olds by 2028.",
            simple: "This measure requires New York to provide free pre-kindergarten to all 3 and 4 year old children by 2028. Right now, pre-K is available in many areas but not everywhere.",
            detailed: "This constitutional amendment would mandate that New York State provide and fund universal pre-kindergarten for all three and four year old children by 2028. Currently, pre-K availability varies significantly by region."
          },
          fiscalImpact: "Estimated cost of $1.2 billion annually by 2028, funding source to be determined by legislature.",
          supporters: ["NY Education Association", "Child Care Council", "Pre-K for All Coalition"],
          opponents: ["Fiscal conservatives (cost concerns)", "Some private preschool operators"],
          category: "education"
        }
      ],
      candidates: [
        {
          id: "ny-gov-1",
          name: "Maria Santos",
          party: "Democratic",
          office: "Governor",
          positions: [
            "Expand renewable energy to 100% clean electricity by 2035",
            "Universal healthcare through state-based single payer",
            "Increase funding for public schools by 20%"
          ],
          experience: "Current Lt. Governor, former State Senator (8 years), environmental attorney",
          endorsements: ["Sierra Club", "NY Education Association", "Working Families Party"]
        },
        {
          id: "ny-gov-2", 
          name: "Robert Chen",
          party: "Republican",
          office: "Governor",
          positions: [
            "Cut state taxes by 15% to attract businesses",
            "Increase funding for law enforcement",
            "School choice through education savings accounts"
          ],
          experience: "Former Congressman (6 years), CEO of tech company, Army veteran",
          endorsements: ["NY Business Council", "Conservative Party", "Police Benevolent Association"]
        }
      ]
    };
  }

  private getNJBallot(): StoredBallot {
    return {
      id: "nj-2026-primary",
      state: "NJ",
      county: null,
      electionDate: "June 2, 2026",
      electionType: "Primary Election",
      measures: [
        {
          id: "nj-q-1",
          number: "Proposition 1",
          title: "Affordable Housing Bond Act",
          originalText: "Do you approve the 'Affordable Housing Bond Act' which authorizes the State to issue bonds in an amount not to exceed $700 million to provide funding for affordable housing production?",
          summary: {
            oneSentence: "Authorizes $700 million in bonds for affordable housing.",
            simple: "This measure allows New Jersey to borrow $700 million to build more affordable housing. The money would help create new affordable homes and apartments for families who are struggling with high housing costs.",
            detailed: "The Affordable Housing Bond Act would authorize $700 million in general obligation bonds for affordable housing production. Funds would support construction of new affordable units, rehabilitation of existing affordable housing, and mixed-income developments near transit."
          },
          fiscalImpact: "Estimated debt service of $50 million annually for 20 years.",
          supporters: ["NJ Affordable Housing Coalition", "Housing and Community Development Network", "NJ NAACP"],
          opponents: ["NJ Taxpayers Association", "Some fiscal conservatives"],
          category: "economy"
        },
        {
          id: "nj-q-2",
          number: "Proposition 2",
          title: "School Funding Formula Reform",
          originalText: "Shall the State Constitution be amended to require equitable per-pupil funding across all school districts, adjusted for student need?",
          summary: {
            oneSentence: "Requires equal school funding adjusted for student needs.",
            simple: "This amendment would change how New Jersey funds schools. Instead of wealthy districts getting more money, every student would receive fair funding based on their needs, with extra support for students who need it most.",
            detailed: "This constitutional amendment would mandate an equitable per-pupil funding formula across all 600+ school districts. The formula would include weighted funding for English language learners, students with disabilities, and students from low-income families."
          },
          fiscalImpact: "Could require redistribution of approximately $500 million annually.",
          supporters: ["Education Law Center", "NJ Education Association", "Urban League of NJ"],
          opponents: ["Some suburban districts", "NJ School Boards Association (implementation concerns)"],
          category: "education"
        },
        {
          id: "nj-q-3",
          number: "Proposition 3",
          title: "Cannabis Tax Revenue Allocation",
          originalText: "Shall the constitution be amended to allocate 50% of cannabis tax revenues to communities disproportionately impacted by cannabis enforcement?",
          summary: {
            oneSentence: "Dedicates half of marijuana tax money to impacted communities.",
            simple: "This measure would require that half of all tax money collected from marijuana sales goes to communities that were most affected by past marijuana arrests. These funds would support job training, education, and community development.",
            detailed: "This amendment would constitutionally dedicate 50% of cannabis excise tax revenue to social equity programs in municipalities identified as 'impact zones.' These are communities with historically high rates of cannabis-related arrests and convictions."
          },
          fiscalImpact: "Estimated $50-75 million annually based on current revenue projections.",
          supporters: ["NJ ACLU", "Drug Policy Alliance", "NJ Institute for Social Justice"],
          opponents: ["Some municipal leaders (prefer local control)", "NJ Taxpayers Alliance"],
          category: "public_safety"
        },
        {
          id: "nj-q-4",
          number: "Proposition 4",
          title: "Veteran Property Tax Exemption Expansion",
          originalText: "Shall the Constitution be amended to expand the property tax exemption for disabled veterans to include all veterans over age 65?",
          summary: {
            oneSentence: "Gives property tax breaks to all veterans 65 and older.",
            simple: "Currently only disabled veterans get property tax exemptions. This amendment would extend that benefit to all veterans who are 65 or older, helping older veterans stay in their homes.",
            detailed: "This constitutional amendment would expand the existing property tax exemption for disabled veterans to include all honorably discharged veterans over age 65, regardless of disability status. The exemption would apply to up to $250,000 of assessed home value."
          },
          fiscalImpact: "Estimated $120 million annually in foregone municipal tax revenue.",
          supporters: ["American Legion NJ", "VFW NJ", "Veterans of Foreign Wars"],
          opponents: ["Some municipal governments (revenue impact)", "NJ League of Municipalities"],
          category: "economy"
        }
      ],
      candidates: [
        {
          id: "nj-gov-1",
          name: "Sarah Mitchell",
          party: "Democratic",
          office: "Governor",
          age: 51,
          positions: [
            "Expand NJ Transit with new bus rapid transit lines",
            "100% clean energy by 2035",
            "Fully fund school aid formula"
          ],
          experience: "Current State Senator (10 years), former Mayor of Newark, civil rights attorney",
          endorsements: ["NJ Education Association", "Sierra Club NJ", "AFL-CIO NJ"],
          donations: {
            small: { amount: 2800000, percentage: 40 },
            large: { amount: 2450000, percentage: 35 },
            mega: { amount: 1750000, percentage: 25 },
            total: 7000000
          }
        },
        {
          id: "nj-gov-2",
          name: "Michael Russo",
          party: "Republican",
          office: "Governor",
          age: 57,
          positions: [
            "Cut property taxes by 10%",
            "Reduce business regulations",
            "Expand school choice"
          ],
          experience: "Former Bergen County Executive, business owner, Marine veteran",
          endorsements: ["NJ Chamber of Commerce", "NJ Builders Association", "PBA Local 1"],
          donations: {
            small: { amount: 1100000, percentage: 22 },
            large: { amount: 1900000, percentage: 38 },
            mega: { amount: 2000000, percentage: 40 },
            total: 5000000
          }
        }
      ]
    };
  }

  private getPABallot(): StoredBallot {
    return {
      id: "pa-2026-primary",
      state: "PA",
      county: null,
      electionDate: "May 19, 2026",
      electionType: "Primary Election",
      measures: [
        {
          id: "pa-am-1",
          number: "Amendment 1",
          title: "Victims' Rights Constitutional Amendment",
          originalText: "Shall the Pennsylvania Constitution be amended to grant crime victims certain enumerated rights, including the right to be notified of proceedings and to be heard at sentencing?",
          summary: {
            oneSentence: "Adds victims' rights to the state constitution.",
            simple: "This amendment would give crime victims constitutional rights, including the right to be told about court dates, to speak at sentencing, and to be treated with fairness throughout the legal process.",
            detailed: "Known as 'Marsy's Law,' this constitutional amendment would enumerate rights for crime victims including: notification of all proceedings, right to be present and heard at sentencing, right to reasonable protection, and right to timely disposition of the case."
          },
          supporters: ["Marsy's Law for PA", "PA District Attorneys Association", "Victims' advocacy groups"],
          opponents: ["PA ACLU (due process concerns)", "PA Association of Criminal Defense Lawyers"],
          category: "public_safety"
        },
        {
          id: "pa-am-2",
          number: "Amendment 2",
          title: "Emergency Declaration Term Limits",
          originalText: "Shall the Pennsylvania Constitution be amended to require that a disaster emergency declaration expire after 21 days unless extended by the General Assembly?",
          summary: {
            oneSentence: "Limits governor's emergency powers to 21 days without legislature approval.",
            simple: "This amendment would limit how long a governor can declare a state of emergency without the legislature's approval. Emergency orders would automatically end after 21 days unless the legislature votes to continue them.",
            detailed: "Following pandemic-era debates, this amendment would require gubernatorial emergency declarations to expire after 21 days. Extensions would require concurrent resolution of both chambers of the General Assembly."
          },
          supporters: ["PA Republican caucus", "PA Chamber of Business", "Liberty-focused groups"],
          opponents: ["PA Democratic caucus", "Public health advocates", "Emergency management officials"],
          category: "public_safety"
        },
        {
          id: "pa-am-3",
          number: "Amendment 3",
          title: "Higher Education Funding Guarantee",
          originalText: "Shall the Constitution be amended to require minimum per-student funding levels for state-related and state-owned universities?",
          summary: {
            oneSentence: "Guarantees minimum funding for public universities.",
            simple: "This amendment would require Pennsylvania to provide a minimum amount of funding per student at public universities. This would help keep tuition affordable and prevent sudden budget cuts.",
            detailed: "This amendment would constitutionally guarantee minimum per-student funding levels for Pennsylvania's 14 state-owned universities and 4 state-related universities. Funding floors would be indexed to inflation."
          },
          fiscalImpact: "Would commit approximately $600 million annually, potentially requiring new revenue.",
          supporters: ["APSCUF", "PA College Democrats", "Student government associations"],
          opponents: ["PA GOP (fiscal flexibility concerns)", "Some private colleges"],
          category: "education"
        },
        {
          id: "pa-am-4",
          number: "Amendment 4",
          title: "Clean Slate Expansion",
          originalText: "Shall the Constitution be amended to automatically seal certain non-violent criminal records after 7 years without re-offense?",
          summary: {
            oneSentence: "Automatically seals old non-violent criminal records.",
            simple: "This amendment would automatically hide old criminal records for non-violent offenses after 7 years if the person hasn't committed any new crimes. This helps people get jobs and housing.",
            detailed: "Building on existing Clean Slate legislation, this constitutional amendment would mandate automatic sealing of qualifying non-violent misdemeanors and summary offenses after 7 years without subsequent conviction."
          },
          supporters: ["PA ACLU", "Clean Slate PA", "Philadelphia Chamber of Commerce"],
          opponents: ["Some law enforcement groups", "PA District Attorneys Association"],
          category: "public_safety"
        }
      ],
      candidates: [
        {
          id: "pa-gov-1",
          name: "David Park",
          party: "Democratic",
          office: "Governor",
          age: 52,
          positions: [
            "Expand Medicaid and health coverage",
            "Invest in public education and vocational training",
            "Transition to clean energy while supporting displaced workers"
          ],
          experience: "Current Attorney General, former Philadelphia DA, Temple Law professor",
          endorsements: ["PA AFL-CIO", "PA Education Association", "Sierra Club PA"],
          donations: {
            small: { amount: 3200000, percentage: 48 },
            large: { amount: 2100000, percentage: 32 },
            mega: { amount: 1300000, percentage: 20 },
            total: 6600000
          }
        },
        {
          id: "pa-gov-2",
          name: "Jennifer Walsh",
          party: "Republican",
          office: "Governor",
          age: 49,
          positions: [
            "Support natural gas industry jobs",
            "School choice and parent rights",
            "Reduce business taxes"
          ],
          experience: "Current State Senator, former State Representative, small business owner",
          endorsements: ["PA Chamber of Business", "NRA PA", "PA Pro-Life Federation"],
          donations: {
            small: { amount: 980000, percentage: 18 },
            large: { amount: 2180000, percentage: 40 },
            mega: { amount: 2290000, percentage: 42 },
            total: 5450000
          }
        }
      ]
    };
  }

  private getCTBallot(): StoredBallot {
    return {
      id: "ct-2026-primary",
      state: "CT",
      county: null,
      electionDate: "August 11, 2026",
      electionType: "Primary Election",
      measures: [
        {
          id: "ct-q-1",
          number: "Proposition 1",
          title: "Transportation Lockbox Amendment",
          originalText: "Shall the Constitution be amended to prohibit the use of transportation fund revenues for non-transportation purposes?",
          summary: {
            oneSentence: "Protects transportation funds from being used for other purposes.",
            simple: "This amendment would make sure that money collected for roads, bridges, and public transit can only be spent on transportation. The state couldn't borrow from this fund for other things.",
            detailed: "This constitutional amendment would create a 'lockbox' protecting Special Transportation Fund revenues from being diverted to the General Fund. It would require a 3/5 supermajority vote to access transportation funds for any non-transportation purpose."
          },
          supporters: ["CT Construction Industries Association", "CT Transit Authority", "AAA Northeast"],
          opponents: ["Some fiscal policy groups (flexibility concerns)", "CT Budget watchdogs"],
          category: "economy"
        },
        {
          id: "ct-q-2",
          number: "Proposition 2",
          title: "Early Voting Implementation",
          originalText: "Shall the Constitution be amended to allow early in-person voting for not less than four days before any election?",
          summary: {
            oneSentence: "Allows voting in person before election day.",
            simple: "Connecticut currently doesn't allow early voting. This amendment would let people vote in person for at least 4 days before any election, making it easier for people with busy schedules to vote.",
            detailed: "This constitutional amendment would authorize the General Assembly to provide for early in-person voting for a period of not less than four days immediately before any election. Connecticut is one of only four states without early voting."
          },
          supporters: ["League of Women Voters CT", "CT NAACP", "Common Cause CT"],
          opponents: ["Some election officials (resource concerns)", "CT Republican Party"],
          category: "public_safety"
        },
        {
          id: "ct-q-3",
          number: "Proposition 3",
          title: "Affordable Housing Appeals Reform",
          originalText: "Shall the Constitution be amended to require municipalities with less than 10% affordable housing to approve qualifying affordable housing developments?",
          summary: {
            oneSentence: "Requires towns with little affordable housing to approve new projects.",
            simple: "Towns that don't have enough affordable housing would have to approve new affordable housing projects that meet certain standards. This aims to spread affordable housing more evenly across the state.",
            detailed: "This amendment would strengthen the state's existing affordable housing appeals process by requiring municipalities with less than 10% affordable housing to approve qualifying affordable developments meeting state standards."
          },
          supporters: ["CT Fair Housing Center", "Regional Plan Association", "Open Communities Alliance"],
          opponents: ["CT Conference of Municipalities", "Some suburban town councils"],
          category: "economy"
        },
        {
          id: "ct-q-4",
          number: "Proposition 4",
          title: "Municipal Broadband Authorization",
          originalText: "Shall the Constitution be amended to explicitly authorize municipalities to establish and operate broadband internet services?",
          summary: {
            oneSentence: "Lets towns create their own internet services.",
            simple: "This amendment would allow cities and towns in Connecticut to create their own internet services. This could give residents an alternative to private internet companies and potentially lower prices.",
            detailed: "This constitutional amendment would explicitly authorize municipalities to establish, operate, and finance broadband internet infrastructure and services, removing any legal ambiguity about municipal authority in this area."
          },
          supporters: ["CT Broadband Coalition", "CT Municipal Electric Energy Cooperative", "Consumer advocates"],
          opponents: ["Cable & telecom industry", "CT Business & Industry Association"],
          category: "economy"
        }
      ],
      candidates: [
        {
          id: "ct-gov-1",
          name: "Rachel Torres",
          party: "Democratic",
          office: "Governor",
          age: 56,
          positions: [
            "Expand paid family leave program",
            "Invest in climate resilience for coastline",
            "Fully fund education cost sharing"
          ],
          experience: "Current Lt. Governor, former State Comptroller, CPA",
          endorsements: ["CT AFL-CIO", "CT Education Association", "CT League of Conservation Voters"],
          donations: {
            small: { amount: 2100000, percentage: 42 },
            large: { amount: 1900000, percentage: 38 },
            mega: { amount: 1000000, percentage: 20 },
            total: 5000000
          }
        },
        {
          id: "ct-gov-2",
          name: "William Hart",
          party: "Republican",
          office: "Governor",
          age: 61,
          positions: [
            "Eliminate income tax for retirees",
            "Reduce business regulations",
            "Expand magnet and charter schools"
          ],
          experience: "Former State Senator, hedge fund manager, Yale MBA",
          endorsements: ["CT Business Council", "CT Realtors", "CT Manufacturers Association"],
          donations: {
            small: { amount: 750000, percentage: 15 },
            large: { amount: 1750000, percentage: 35 },
            mega: { amount: 2500000, percentage: 50 },
            total: 5000000
          }
        }
      ]
    };
  }

  private getTXBallot(): StoredBallot {
    return {
      id: "tx-2026-primary",
      state: "TX",
      county: null,
      electionDate: "March 3, 2026",
      electionType: "Primary Election",
      measures: [
        {
          id: "tx-prop-1",
          number: "Proposition 1",
          title: "Property Tax Relief for Homeowners",
          originalText: "The constitutional amendment increasing the amount of the residence homestead exemption from ad valorem taxation for public school purposes.",
          summary: {
            oneSentence: "Increases homeowner property tax exemptions.",
            simple: "This amendment would raise the amount of your home's value that is exempt from property taxes. This means homeowners would pay less in property taxes to fund public schools.",
            detailed: "This proposition would increase the residence homestead exemption from $100,000 to $140,000 for school district property taxes. The estimated average savings is $400 per homeowner annually."
          },
          fiscalImpact: "Reduces school district revenue by approximately $5.3 billion annually, to be made up by state general revenue.",
          supporters: ["TX Association of Realtors", "TX Taxpayers and Research Association", "Governor's office"],
          opponents: ["TX Public Policy Foundation (prefers other reforms)", "Some school district administrators"],
          category: "economy"
        },
        {
          id: "tx-prop-2",
          number: "Proposition 2",
          title: "Border Security Fund",
          originalText: "The constitutional amendment creating the Texas Border Security Fund and dedicating certain state revenues to border security operations.",
          summary: {
            oneSentence: "Creates dedicated funding for border security.",
            simple: "This amendment would create a special fund just for border security. A portion of state sales tax would automatically go to this fund to pay for border operations.",
            detailed: "This proposition would establish a dedicated Texas Border Security Fund, allocating 0.5% of state sales tax revenue annually. Funds would support Operation Lone Star, border barriers, and local law enforcement assistance."
          },
          fiscalImpact: "Dedicates approximately $1.7 billion annually from sales tax revenue.",
          supporters: ["TX Governor's office", "TX Public Safety Commission", "Border sheriff's associations"],
          opponents: ["TX ACLU", "Some fiscal conservatives (earmarking concerns)", "Immigrant rights groups"],
          category: "public_safety"
        },
        {
          id: "tx-prop-3",
          number: "Proposition 3",
          title: "Electric Grid Reliability",
          originalText: "The constitutional amendment creating the Texas Energy Security Fund for loans to dispatchable electric generating facilities.",
          summary: {
            oneSentence: "Creates fund to support reliable power plants.",
            simple: "After the 2021 winter storm blackouts, this amendment would create a $10 billion fund to help build and maintain power plants that can run when needed most. The goal is to prevent future grid failures.",
            detailed: "This proposition would establish a $10 billion Texas Energy Security Fund to provide low-interest loans to dispatchable generation facilities including natural gas, nuclear, and battery storage. Facilities must commit to winterization and emergency availability."
          },
          fiscalImpact: "Initial $5 billion from general revenue, with legislative authorization for an additional $5 billion in bonds.",
          supporters: ["TX Electric Cooperatives", "TX Association of Manufacturers", "Major utilities"],
          opponents: ["Environmental groups", "Some fiscal conservatives", "Wind and solar industry groups"],
          category: "environment"
        },
        {
          id: "tx-prop-4",
          number: "Proposition 4",
          title: "Water Infrastructure Investment",
          originalText: "The constitutional amendment relating to the Texas Water Fund for financing water projects statewide.",
          summary: {
            oneSentence: "Invests in water infrastructure across Texas.",
            simple: "Texas is facing water shortages in many areas. This amendment would invest billions in water projects like new reservoirs, pipelines, and treatment plants to ensure Texans have clean water for decades to come.",
            detailed: "This proposition would allocate $3 billion from the Economic Stabilization Fund to the Texas Water Fund for statewide water infrastructure including conservation, desalination, pipelines, and reservoir projects."
          },
          fiscalImpact: "One-time transfer of $3 billion from the 'Rainy Day Fund' to the Water Fund.",
          supporters: ["TX Water Conservation Association", "TX Association of Mayors", "Agriculture groups"],
          opponents: ["Some fiscal conservatives (prefer maintaining Rainy Day Fund balance)"],
          category: "environment"
        },
        {
          id: "tx-prop-5",
          number: "Proposition 5",
          title: "Broadband Infrastructure Investment",
          originalText: "The constitutional amendment establishing the Texas Broadband Infrastructure Fund to expand high-speed internet access in rural areas.",
          summary: {
            oneSentence: "Funds high-speed internet for rural Texas.",
            simple: "Many rural areas in Texas don't have high-speed internet. This amendment would create a $2 billion fund to help build internet infrastructure in underserved areas.",
            detailed: "This proposition would establish a $2 billion Texas Broadband Infrastructure Fund to finance expansion of high-speed internet access to unserved and underserved areas, prioritizing rural and economically distressed communities."
          },
          fiscalImpact: "$2 billion from American Rescue Plan funds and general revenue.",
          supporters: ["TX Farm Bureau", "Rural electric cooperatives", "TX Association of School Boards"],
          opponents: ["Some telecom industry groups (competition concerns)"],
          category: "economy"
        }
      ],
      candidates: [
        {
          id: "tx-gov-1",
          name: "Maria Garcia",
          party: "Democratic",
          office: "Governor",
          age: 48,
          positions: [
            "Expand Medicaid to cover uninsured Texans",
            "Increase public school funding per student",
            "Invest in renewable energy and grid improvements"
          ],
          experience: "Current U.S. Representative (8 years), former El Paso city councilwoman, attorney",
          endorsements: ["TX AFL-CIO", "Texas State Teachers Association", "TX Environmental Voters"],
          donations: {
            small: { amount: 4500000, percentage: 50 },
            large: { amount: 2700000, percentage: 30 },
            mega: { amount: 1800000, percentage: 20 },
            total: 9000000
          }
        },
        {
          id: "tx-gov-2",
          name: "John Matthews",
          party: "Republican",
          office: "Governor",
          age: 55,
          positions: [
            "Secure the Texas-Mexico border",
            "Eliminate property taxes for seniors",
            "Expand school choice through vouchers"
          ],
          experience: "Current Attorney General, former State Senator, former federal prosecutor",
          endorsements: ["TX Farm Bureau", "TX Association of Business", "NRA TX"],
          donations: {
            small: { amount: 2100000, percentage: 15 },
            large: { amount: 4200000, percentage: 30 },
            mega: { amount: 7700000, percentage: 55 },
            total: 14000000
          }
        }
      ]
    };
  }

  async getBallot(state: string, county?: string): Promise<StoredBallot | undefined> {
    const rows = await db().select().from(ballots).where(eq(ballots.state, state.toUpperCase()));
    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        state: row.state,
        county: row.county,
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
        lastUpdated: new Date(),
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
        ballotId: row.ballotId,
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
      ballotId: row.ballotId,
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
      ballotId: row.ballotId,
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
      ballotId: row.ballotId,
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
      ballotId: event.ballotId,
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
        ...(updates.ballotId !== undefined && { ballotId: updates.ballotId }),
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
      { id: "ny-primary-2026", state: "NY", title: "New York Primary Election", eventType: "primary", electionDate: "June 23, 2026", registrationDeadline: "June 13, 2026", description: "State and local primary elections for Democratic and Republican nominees", ballotId: "ny-2026-primary" },
      { id: "ny-general-2026", state: "NY", title: "New York General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 24, 2026", description: "State governor, legislature, and local offices general election", ballotId: null },
      { id: "ny-midterm-2026", state: "NY", title: "US Congress Midterm - New York", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 24, 2026", description: "US House of Representatives and Senate midterm election", ballotId: null },
      { id: "nj-primary-2026", state: "NJ", title: "New Jersey Primary Election", eventType: "primary", electionDate: "June 2, 2026", registrationDeadline: "May 12, 2026", description: "State and local primary elections", ballotId: "nj-2026-primary" },
      { id: "nj-general-2026", state: "NJ", title: "New Jersey General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 13, 2026", description: "State governor, legislature, and local offices general election", ballotId: null },
      { id: "nj-midterm-2026", state: "NJ", title: "US Congress Midterm - New Jersey", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 13, 2026", description: "US House of Representatives midterm election", ballotId: null },
      { id: "pa-primary-2026", state: "PA", title: "Pennsylvania Primary Election", eventType: "primary", electionDate: "May 19, 2026", registrationDeadline: "April 20, 2026", description: "State and local primary elections", ballotId: "pa-2026-primary" },
      { id: "pa-general-2026", state: "PA", title: "Pennsylvania General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 19, 2026", description: "State governor, legislature, and local offices general election", ballotId: null },
      { id: "pa-midterm-2026", state: "PA", title: "US Congress Midterm - Pennsylvania", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 19, 2026", description: "US House of Representatives and Senate midterm election", ballotId: null },
      { id: "ct-primary-2026", state: "CT", title: "Connecticut Primary Election", eventType: "primary", electionDate: "August 11, 2026", registrationDeadline: "August 6, 2026", description: "State and local primary elections", ballotId: "ct-2026-primary" },
      { id: "ct-general-2026", state: "CT", title: "Connecticut General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 27, 2026", description: "State governor, legislature, and local offices general election", ballotId: null },
      { id: "ct-midterm-2026", state: "CT", title: "US Congress Midterm - Connecticut", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 27, 2026", description: "US House of Representatives midterm election", ballotId: null },
      { id: "tx-primary-2026", state: "TX", title: "Texas Primary Election", eventType: "primary", electionDate: "March 3, 2026", registrationDeadline: "February 2, 2026", description: "State and local primary elections", ballotId: "tx-2026-primary" },
      { id: "tx-runoff-2026", state: "TX", title: "Texas Primary Runoff Election", eventType: "runoff", electionDate: "May 26, 2026", registrationDeadline: "April 27, 2026", description: "Primary runoff for races where no candidate received majority", ballotId: null },
      { id: "tx-general-2026", state: "TX", title: "Texas General Election", eventType: "general", electionDate: "November 3, 2026", registrationDeadline: "October 5, 2026", description: "State governor, legislature, and local offices general election", ballotId: null },
      { id: "tx-midterm-2026", state: "TX", title: "US Congress Midterm - Texas", eventType: "midterm", electionDate: "November 3, 2026", registrationDeadline: "October 5, 2026", description: "US House of Representatives and Senate midterm election", ballotId: null },
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

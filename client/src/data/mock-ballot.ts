import type { BallotMeasure, Candidate } from "@shared/schema";

export const NY_BALLOT_MEASURES: BallotMeasure[] = [
  {
    id: "ny-prop-1",
    number: "Proposal 1",
    title: "Clean Water, Clean Air, and Green Jobs Environmental Bond Act",
    originalText: "To address and combat the impact of climate change and damage to the environment, this proposal authorizes the State to issue bonds up to four billion two hundred million dollars to fund environmental protection, natural restoration, resiliency, and clean energy projects.",
    summary: {
      oneSentence: "Authorizes $4.2 billion in bonds for environmental and clean energy projects.",
      simple: "This measure allows New York to borrow $4.2 billion to fund projects that protect the environment, restore natural areas, prepare for climate change impacts, and support clean energy. The money would go toward things like flood protection, clean water infrastructure, and green jobs.",
      detailed: "This bond act would authorize New York State to issue up to $4.2 billion in general obligation bonds to fund environmental initiatives. The funds would be allocated across several categories: $1.5 billion for climate change mitigation, $650 million for restoration and flood risk reduction, $650 million for open space land conservation, $650 million for water quality improvement, and $750 million for green building and climate-resilient community infrastructure. Projects funded would create jobs in the growing clean energy sector while addressing aging water infrastructure and flood risks. The state would repay these bonds over 30 years through annual appropriations."
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
      detailed: "This constitutional amendment would establish that each person has an enforceable right to clean air, clean water, and a healthful environment. This would make New York the third state to include environmental rights in its constitution, following Pennsylvania and Montana. The amendment would allow citizens to bring lawsuits against the state government or private entities that violate these rights. Supporters argue this creates accountability for environmental protection, while critics worry about potential litigation costs and impacts on business development."
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
      simple: "This measure allows cities and towns in New York to decide if they want to use ranked choice voting for their local elections. With ranked choice voting, you rank candidates in order of preference instead of just picking one. If your first choice loses, your vote goes to your second choice.",
      detailed: "This proposal would enable municipalities in New York to adopt ranked choice voting (RCV) for local elections. Under RCV, voters rank candidates by preference. If no candidate receives a majority of first-choice votes, the candidate with the fewest votes is eliminated and their voters' second choices are counted. This continues until a candidate has a majority. New York City already uses RCV for primary elections. This proposal would extend the option statewide, allowing local governments to adopt it through local legislation or voter referendum. Studies show RCV tends to increase voter satisfaction and reduce negative campaigning."
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
      simple: "This measure gives small businesses a 15% discount on their property taxes for five years. It applies to businesses with property worth less than $2 million. The goal is to help small businesses survive and grow, especially after the pandemic.",
      detailed: "This proposal would provide a 15% property tax reduction for qualifying small businesses for a five-year period. To qualify, a business must have an assessed property value under $2 million and fewer than 50 employees. The tax relief is estimated to benefit approximately 125,000 small businesses across the state. The lost revenue would be offset by a combination of state aid to localities and projected economic growth from business expansion. Opponents argue this shifts the tax burden to homeowners and larger businesses."
    },
    fiscalImpact: "Estimated cost of $180 million annually in foregone tax revenue, partially offset by state reimbursement to localities.",
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
      simple: "This measure requires New York to provide free pre-kindergarten to all 3 and 4 year old children by 2028. Right now, pre-K is available in many areas but not everywhere. This would guarantee it statewide and make early education a right for all families.",
      detailed: "This constitutional amendment would mandate that New York State provide and fund universal pre-kindergarten for all three and four year old children by 2028. Currently, pre-K availability varies significantly by region, with many rural areas having limited access. The proposal would require the state to fund full-day programs meeting quality standards. Implementation would cost an estimated $1.2 billion annually when fully rolled out. Research shows that quality early childhood education improves long-term educational outcomes and reduces achievement gaps. The measure does not specify funding sources."
    },
    fiscalImpact: "Estimated cost of $1.2 billion annually by 2028, funding source to be determined by legislature.",
    supporters: ["NY Education Association", "Child Care Council", "Pre-K for All Coalition"],
    opponents: ["Fiscal conservatives (cost concerns)", "Some private preschool operators"],
    category: "education"
  },
  {
    id: "ny-prop-6",
    number: "Proposal 6", 
    title: "Police Accountability and Transparency Act",
    originalText: "This proposal establishes an independent oversight board for law enforcement and requires public disclosure of police disciplinary records.",
    summary: {
      oneSentence: "Creates civilian oversight of police and makes discipline records public.",
      simple: "This measure creates an independent board of civilians to review police misconduct complaints. It also makes police disciplinary records available to the public. The goal is to increase trust between communities and law enforcement through greater accountability.",
      detailed: "This proposal would establish an independent civilian oversight board with subpoena power to investigate complaints of police misconduct. The board would include community representatives and experts in law enforcement. Additionally, it would repeal provisions that have kept police disciplinary records secret, making them available to the public upon request. Supporters argue this will rebuild community trust and deter misconduct. Opponents, including police unions, argue it could harm officer morale and make recruiting more difficult. The measure would apply to all municipal police departments in the state."
    },
    supporters: ["NYCLU", "Communities United for Police Reform", "NAACP NY"],
    opponents: ["Police Benevolent Association", "Law Enforcement Officers Union"],
    category: "public_safety"
  },
  {
    id: "ny-prop-7",
    number: "Proposal 7",
    title: "Healthcare Worker Safety and Staffing Standards",
    originalText: "Establishes minimum staffing ratios for registered nurses and other healthcare workers in hospitals and nursing homes.",
    summary: {
      oneSentence: "Sets minimum nurse-to-patient ratios in hospitals.",
      simple: "This measure requires hospitals and nursing homes to have a minimum number of nurses for each patient. For example, ICU units would need one nurse for every two patients. This aims to improve patient safety and reduce nurse burnout.",
      detailed: "This proposal would mandate minimum staffing ratios for registered nurses and other healthcare workers in all licensed hospitals and nursing facilities. Specific ratios would vary by unit type: ICU would require 1:2 nurse-to-patient ratios, while medical-surgical units would require 1:4. The law would require hospitals to publicly report staffing levels and face penalties for violations. Supporters, including nursing unions, say this will improve patient outcomes and working conditions. Hospital associations oppose the measure, arguing it would cost $4-5 billion statewide and could force some rural hospitals to close. Studies show mixed results on whether mandated ratios improve outcomes."
    },
    fiscalImpact: "Hospital associations estimate $4-5 billion in additional costs. Proponents dispute this figure.",
    supporters: ["NY State Nurses Association", "1199SEIU Healthcare Workers", "Patient Safety Coalition"],
    opponents: ["Greater NY Hospital Association", "Healthcare Association of NY", "Rural hospital networks"],
    category: "healthcare"
  },
  {
    id: "ny-prop-8",
    number: "Proposal 8",
    title: "Recreational Cannabis Tax Revenue Allocation",
    originalText: "This proposal would allocate 40% of recreational cannabis tax revenue to community reinvestment in areas most impacted by past drug enforcement.",
    summary: {
      oneSentence: "Directs 40% of cannabis taxes to communities impacted by drug enforcement.",
      simple: "This measure dedicates 40% of tax money from recreational cannabis sales to help communities that were most affected by past marijuana enforcement. The money would fund job training, small business grants, youth programs, and substance abuse treatment in these neighborhoods.",
      detailed: "This proposal would constitutionally mandate that 40% of all tax revenue from recreational cannabis sales be allocated to a Community Reinvestment Fund. Eligible communities would be determined based on past drug arrest rates, incarceration rates, and economic indicators. Funds would support job training programs, small business grants, youth development programs, and substance abuse treatment services. The remaining 60% of tax revenue would go to the general fund, education, and drug enforcement. Current estimates suggest this could direct $100-150 million annually to impacted communities once the cannabis market is fully developed."
    },
    fiscalImpact: "Estimated $100-150 million annually to community reinvestment when cannabis market matures.",
    supporters: ["Drug Policy Alliance", "ACLU NY", "Cannabis equity advocates"],
    opponents: ["Some fiscal conservatives", "Critics who prefer different allocation"],
    category: "economy"
  },
  {
    id: "ny-prop-9",
    number: "Proposal 9",
    title: "Minimum Wage Increase to $20 by 2026",
    originalText: "This proposal would raise the state minimum wage to $20 per hour by 2026 and tie future increases to inflation.",
    summary: {
      oneSentence: "Raises minimum wage to $20/hour by 2026, then ties it to inflation.",
      simple: "This measure increases the minimum wage to $20 per hour by 2026, up from the current rate. After that, it would automatically adjust each year based on inflation so workers' purchasing power doesn't decrease over time.",
      detailed: "This proposal would raise New York's minimum wage to $20 per hour by 2026 through annual increases. Currently, the minimum wage is $15 in New York City and lower in other regions. The proposal would unify the rate statewide. After reaching $20, the minimum wage would automatically increase annually based on the Consumer Price Index to maintain purchasing power. Business groups argue this will lead to job losses and higher prices, particularly harming small businesses. Labor advocates note that $15 has not kept pace with cost of living increases since it was set. Economic studies on minimum wage impacts show mixed results depending on local conditions."
    },
    fiscalImpact: "Would raise wages for an estimated 1.5 million workers. Impact on employment disputed by economists.",
    supporters: ["32BJ SEIU", "Retail Workers Union", "Fight for $15 campaign"],
    opponents: ["NY Business Council", "Restaurant Association", "Small business coalitions"],
    category: "economy"
  },
  {
    id: "ny-prop-10",
    number: "Proposal 10",
    title: "Affordable Housing Development Fund",
    originalText: "Authorizes $3 billion in bonds to finance the construction and preservation of affordable housing throughout the state.",
    summary: {
      oneSentence: "Authorizes $3 billion for affordable housing construction.",
      simple: "This measure allows New York to borrow $3 billion to build and preserve affordable housing. The money would help create new affordable apartments and fix up existing affordable housing that's in bad condition. The goal is to address the housing shortage that's driving up rents.",
      detailed: "This bond act would authorize $3 billion in state bonds to fund affordable housing development and preservation. The funds would be distributed across several programs: $1.2 billion for new affordable housing construction, $800 million for preservation of existing affordable units at risk of market conversion, $600 million for supportive housing for homeless individuals, and $400 million for homeownership assistance programs. Projects would be required to maintain affordability for at least 40 years. The state estimates this would create or preserve 100,000 affordable units. Bond repayments would average approximately $200 million annually over 30 years."
    },
    fiscalImpact: "Annual bond repayments of approximately $200 million for 30 years. Creates estimated 100,000 affordable units.",
    supporters: ["Housing Works", "NY Housing Conference", "AARP NY", "Homeless advocacy groups"],
    opponents: ["Some fiscal conservatives", "Free-market housing advocates"],
    category: "economy"
  }
];

export const NY_CANDIDATES: Candidate[] = [
  {
    id: "ny-gov-1",
    name: "Maria Santos",
    party: "Democratic",
    office: "Governor",
    age: 54,
    positions: [
      "Expand renewable energy to 100% clean electricity by 2035",
      "Universal healthcare through state-based single payer",
      "Increase funding for public schools by 20%"
    ],
    experience: "Current Lt. Governor, former State Senator (8 years), environmental attorney",
    endorsements: ["Sierra Club", "NY Education Association", "Working Families Party"],
    donations: {
      small: { amount: 2850000, percentage: 45 },
      large: { amount: 2200000, percentage: 35 },
      mega: { amount: 1250000, percentage: 20 },
      total: 6300000
    }
  },
  {
    id: "ny-gov-2", 
    name: "Robert Chen",
    party: "Republican",
    office: "Governor",
    age: 58,
    positions: [
      "Cut state taxes by 15% to attract businesses",
      "Increase funding for law enforcement",
      "School choice through education savings accounts"
    ],
    experience: "Former Congressman (6 years), CEO of tech company, Army veteran",
    endorsements: ["NY Business Council", "Conservative Party", "Police Benevolent Association"],
    donations: {
      small: { amount: 1200000, percentage: 20 },
      large: { amount: 2400000, percentage: 40 },
      mega: { amount: 2400000, percentage: 40 },
      total: 6000000
    }
  },
  {
    id: "ny-gov-3",
    name: "Jordan Williams",
    party: "Working Families",
    office: "Governor",
    age: 38,
    positions: [
      "Green New Deal for New York with union jobs",
      "Cancel student debt for state school graduates",
      "Housing is a human right - rent control expansion"
    ],
    experience: "Community organizer, tenant rights advocate, City Council member (4 years)",
    endorsements: ["Democratic Socialists of America", "Sunrise Movement", "Tenant Action Coalition"],
    donations: {
      small: { amount: 1800000, percentage: 72 },
      large: { amount: 500000, percentage: 20 },
      mega: { amount: 200000, percentage: 8 },
      total: 2500000
    }
  },
  {
    id: "ny-ag-1",
    name: "David Thompson",
    party: "Democratic",
    office: "Attorney General",
    age: 52,
    positions: [
      "Hold corporations accountable for consumer fraud",
      "Environmental justice enforcement",
      "Civil rights protection and police accountability"
    ],
    experience: "Current Manhattan District Attorney, former federal prosecutor (12 years)",
    endorsements: ["NAACP NY", "Environmental Defense Fund", "Consumer Reports"],
    donations: {
      small: { amount: 1500000, percentage: 50 },
      large: { amount: 1050000, percentage: 35 },
      mega: { amount: 450000, percentage: 15 },
      total: 3000000
    }
  },
  {
    id: "ny-ag-2",
    name: "Susan Miller",
    party: "Republican", 
    office: "Attorney General",
    age: 61,
    positions: [
      "Tough on crime approach to reduce violence",
      "Protect Second Amendment rights",
      "Support law enforcement in prosecutions"
    ],
    experience: "Queens County DA (8 years), former NYPD legal counsel",
    endorsements: ["Police Benevolent Association", "NRA", "Conservative Party"],
    donations: {
      small: { amount: 600000, percentage: 25 },
      large: { amount: 960000, percentage: 40 },
      mega: { amount: 840000, percentage: 35 },
      total: 2400000
    }
  },
  {
    id: "ny-comp-1",
    name: "Angela Rodriguez",
    party: "Democratic",
    office: "State Comptroller",
    age: 47,
    positions: [
      "Divest pension funds from fossil fuels",
      "Increase oversight of government contracts",
      "Transparent budget reporting for all agencies"
    ],
    experience: "Deputy Comptroller (6 years), CPA, former Wall Street analyst",
    endorsements: ["350.org", "Government Accountability Coalition", "AFSCME"],
    donations: {
      small: { amount: 900000, percentage: 60 },
      large: { amount: 450000, percentage: 30 },
      mega: { amount: 150000, percentage: 10 },
      total: 1500000
    }
  },
  {
    id: "ny-comp-2",
    name: "Michael O'Brien",
    party: "Republican",
    office: "State Comptroller",
    age: 63,
    positions: [
      "Maximize pension fund returns regardless of politics",
      "Audit every state agency for waste",
      "Oppose unfunded mandates on localities"
    ],
    experience: "Former State Senator (10 years), accountant, small business owner",
    endorsements: ["NY Business Council", "Taxpayers Union", "Conservative Party"],
    donations: {
      small: { amount: 400000, percentage: 25 },
      large: { amount: 720000, percentage: 45 },
      mega: { amount: 480000, percentage: 30 },
      total: 1600000
    }
  }
];

export const MOCK_BALLOT = {
  id: "ny-2026-primary",
  state: "NY",
  county: "Kings",
  electionDate: "June 23, 2026",
  electionType: "Primary Election",
  measures: NY_BALLOT_MEASURES,
  candidates: NY_CANDIDATES,
};

export const ZIP_TO_STATE: Record<string, { state: string; county: string }> = {
  "10001": { state: "NY", county: "New York" },
  "10002": { state: "NY", county: "New York" },
  "10003": { state: "NY", county: "New York" },
  "10004": { state: "NY", county: "New York" },
  "10005": { state: "NY", county: "New York" },
  "10006": { state: "NY", county: "New York" },
  "10007": { state: "NY", county: "New York" },
  "10008": { state: "NY", county: "New York" },
  "10009": { state: "NY", county: "New York" },
  "10010": { state: "NY", county: "New York" },
  "11201": { state: "NY", county: "Kings" },
  "11211": { state: "NY", county: "Kings" },
  "11215": { state: "NY", county: "Kings" },
  "11217": { state: "NY", county: "Kings" },
  "11238": { state: "NY", county: "Kings" },
  "11206": { state: "NY", county: "Kings" },
  "10451": { state: "NY", county: "Bronx" },
  "10452": { state: "NY", county: "Bronx" },
  "10453": { state: "NY", county: "Bronx" },
  "11101": { state: "NY", county: "Queens" },
  "11102": { state: "NY", county: "Queens" },
  "11103": { state: "NY", county: "Queens" },
  "10301": { state: "NY", county: "Richmond" },
  "10302": { state: "NY", county: "Richmond" },
  "07101": { state: "NJ", county: "Essex" },
  "07102": { state: "NJ", county: "Essex" },
  "07103": { state: "NJ", county: "Essex" },
  "08601": { state: "NJ", county: "Mercer" },
  "08602": { state: "NJ", county: "Mercer" },
  "19101": { state: "PA", county: "Philadelphia" },
  "19102": { state: "PA", county: "Philadelphia" },
  "19103": { state: "PA", county: "Philadelphia" },
  "15201": { state: "PA", county: "Allegheny" },
  "15202": { state: "PA", county: "Allegheny" },
  "06101": { state: "CT", county: "Hartford" },
  "06102": { state: "CT", county: "Hartford" },
  "06103": { state: "CT", county: "Hartford" },
  "06510": { state: "CT", county: "New Haven" },
  "06511": { state: "CT", county: "New Haven" },
  "75201": { state: "TX", county: "Dallas" },
  "75202": { state: "TX", county: "Dallas" },
  "75203": { state: "TX", county: "Dallas" },
  "77001": { state: "TX", county: "Harris" },
  "77002": { state: "TX", county: "Harris" },
  "77003": { state: "TX", county: "Harris" },
  "78201": { state: "TX", county: "Bexar" },
  "78202": { state: "TX", county: "Bexar" },
  "73301": { state: "TX", county: "Travis" },
  "73344": { state: "TX", county: "Travis" },
};

export function lookupZipCode(zip: string): { state: string; county: string } | null {
  const fiveDigit = zip.substring(0, 5);
  return ZIP_TO_STATE[fiveDigit] || null;
}

export function isStateSupported(state: string): boolean {
  return ["NY", "NJ", "PA", "CT", "TX"].includes(state);
}

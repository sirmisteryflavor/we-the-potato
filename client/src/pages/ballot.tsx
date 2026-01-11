import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { BallotMeasureCard } from "@/components/ballot-measure-card";
import { CandidateCard } from "@/components/candidate-card";
import { useAuth } from "@/hooks/useAuth";
import { 
  getOnboardingData, 
  getMeasureDecisions, 
  saveMeasureDecision,
  getCandidateSelections,
  saveCandidateSelection,
  getNotes,
  saveNote,
  syncDecisionsToServer,
  loadDecisionsFromServer,
  trackAnalyticsEvent,
  getVisitorId,
  saveActiveEventId,
} from "@/lib/storage";
import { MOCK_BALLOT } from "@/data/mock-ballot";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  MapPin, 
  FileText, 
  Users, 
  CheckCircle,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  User,
  Edit2,
  History,
  Check,
  X
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { MeasureDecision, Candidate, BallotMeasure } from "@shared/schema";

interface FinalizedVoterCard {
  id: string;
  visitorId: string;
  eventId: string;
  template: string;
  location: string;
  electionDate: string;
  electionType: string;
  createdAt: string;
}

interface BallotData {
  id: string;
  state: string;
  county: string;
  electionDate: string;
  electionType: string;
  measures: BallotMeasure[];
  candidates: Candidate[];
}

interface ElectionEvent {
  id: string;
  status: "upcoming" | "passed";
  title: string;
  electionDate: string;
}

export default function Ballot() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const onboardingData = getOnboardingData();
  const [measureDecisions, setMeasureDecisions] = useState<Record<string, MeasureDecision>>(
    getMeasureDecisions()
  );
  const [candidateSelections, setCandidateSelections] = useState<Record<string, string>>(
    getCandidateSelections()
  );
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>(
    getNotes()
  );
  const [activeTab, setActiveTab] = useState("measures");
  const [expandedMeasures, setExpandedMeasures] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const hasShownCompleteToast = useRef(false);
  const previousTotalDecided = useRef<number | null>(null);
  const isInitialRender = useRef(true);

  const params = new URLSearchParams(search);
  const eventId = params.get("eventId");

  // Save eventId to localStorage for recovery if user refreshes voter-card page
  useEffect(() => {
    if (eventId) {
      saveActiveEventId(eventId);
    }
  }, [eventId]);

  const state = onboardingData?.state || "NY";
  const county = onboardingData?.county;
  const visitorId = getVisitorId();

  const { data: ballot, isLoading, error, refetch } = useQuery<BallotData>({
    queryKey: ["/api/ballot", state, county],
    queryFn: async () => {
      const url = county 
        ? `/api/ballot/${state}?county=${encodeURIComponent(county)}`
        : `/api/ballot/${state}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch ballot");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const ballotData = ballot || MOCK_BALLOT;
  const ballotId = ballotData.id;

  const { data: visitorFinalizedCards } = useQuery<FinalizedVoterCard[]>({
    queryKey: ["/api/finalized-cards", visitorId],
    queryFn: async () => {
      const res = await fetch(`/api/finalized-cards/${visitorId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!visitorId,
  });

  const { data: userFinalizedCards } = useQuery<FinalizedVoterCard[]>({
    queryKey: ["/api/user/finalized-cards"],
    queryFn: async () => {
      const res = await fetch("/api/user/finalized-cards");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: electionEvent } = useQuery<ElectionEvent>({
    queryKey: ["/api/event", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/event/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
    enabled: !!eventId,
  });

  const isEventPassed = electionEvent?.status === "passed";

  const existingCard = useMemo(() => {
    if (!eventId) return null;
    const userCard = userFinalizedCards?.find(card => card.eventId === eventId);
    if (userCard) return userCard;
    const visitorCard = visitorFinalizedCards?.find(card => card.eventId === eventId);
    return visitorCard || null;
  }, [eventId, userFinalizedCards, visitorFinalizedCards]);

  useEffect(() => {
    if (ballotId) {
      loadDecisionsFromServer(ballotId).then((loaded) => {
        if (loaded) {
          setMeasureDecisions(getMeasureDecisions());
          setCandidateSelections(getCandidateSelections());
          setCandidateNotes(getNotes());
        }
      });
      trackAnalyticsEvent("page_view", { page: "ballot" }, state);
    }
  }, [ballotId, state]);

  const syncToServer = useCallback(() => {
    if (ballotId) {
      syncDecisionsToServer(ballotId);
    }
  }, [ballotId]);

  const handleMeasureDecision = (measureId: string, decision: MeasureDecision) => {
    setMeasureDecisions((prev) => ({ ...prev, [measureId]: decision }));
    saveMeasureDecision(measureId, decision);
    syncToServer();
  };

  const handleCandidateSelect = (raceId: string, candidateId: string) => {
    setCandidateSelections((prev) => {
      const newSelections = { ...prev };
      if (newSelections[raceId] === candidateId) {
        delete newSelections[raceId];
        saveCandidateSelection(raceId, "");
      } else {
        newSelections[raceId] = candidateId;
        saveCandidateSelection(raceId, candidateId);
      }
      return newSelections;
    });
    syncToServer();
  };

  const handleCandidateNoteChange = (raceId: string, note: string) => {
    setCandidateNotes((prev) => ({ ...prev, [raceId]: note }));
    saveNote(raceId, note);
    syncToServer();
  };

  const toggleMeasureExpand = (measureId: string) => {
    setExpandedMeasures(prev => {
      const next = new Set(prev);
      if (next.has(measureId)) {
        next.delete(measureId);
      } else {
        next.add(measureId);
      }
      return next;
    });
  };

  // Initialize first measure as expanded when ballot data loads
  useEffect(() => {
    if (ballotData.measures.length > 0 && expandedMeasures.size === 0) {
      setExpandedMeasures(new Set([ballotData.measures[0].id]));
    }
  }, [ballotData.measures]);

  const candidatesByOffice = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {};
    ballotData.candidates.forEach((candidate) => {
      if (!grouped[candidate.office]) {
        grouped[candidate.office] = [];
      }
      grouped[candidate.office].push(candidate);
    });
    return grouped;
  }, [ballotData.candidates]);

  const measureIds = useMemo(() => ballotData.measures.map(m => m.id), [ballotData.measures]);
  
  const stats = useMemo(() => {
    const measureCount = measureIds.length;
    const currentMeasureIds = new Set(measureIds);
    const decidedMeasures = Object.keys(measureDecisions).filter(
      (id) => currentMeasureIds.has(id) && measureDecisions[id]?.decision && measureDecisions[id]?.decision !== "undecided"
    ).length;

    const races = Object.keys(candidatesByOffice);
    const selectedCandidates = races.filter(
      (race) => candidateSelections[race]
    ).length;

    return {
      measures: { total: measureCount, decided: decidedMeasures },
      candidates: { total: races.length, selected: selectedCandidates },
      totalDecided: decidedMeasures + selectedCandidates,
      totalItems: measureCount + races.length,
    };
  }, [measureDecisions, candidateSelections, candidatesByOffice, measureIds]);

  const location = onboardingData 
    ? `${onboardingData.county || ""} County, ${onboardingData.state}`
    : ballotData.county + " County, " + ballotData.state;

  // Show toast when user completes all decisions (transition from incomplete to complete)
  useEffect(() => {
    // Skip first render to seed initial value without triggering toast
    if (isInitialRender.current) {
      isInitialRender.current = false;
      previousTotalDecided.current = stats.totalDecided;
      return;
    }
    
    const isComplete = stats.totalDecided === stats.totalItems && stats.totalItems > 0;
    const wasIncomplete = (previousTotalDecided.current ?? 0) < stats.totalItems;
    const justMadeDecision = previousTotalDecided.current !== stats.totalDecided;
    
    // Reset toast flag if user becomes incomplete again
    if (!isComplete && hasShownCompleteToast.current) {
      hasShownCompleteToast.current = false;
    }
    
    // Only show toast when transitioning from incomplete to complete AND user just made a decision
    if (isComplete && wasIncomplete && justMadeDecision && !hasShownCompleteToast.current) {
      hasShownCompleteToast.current = true;
      toast({
        title: "You're all set!",
        description: "All decisions complete. Create your voter card to share with friends and family.",
        duration: 5000,
      });
    }
    
    previousTotalDecided.current = stats.totalDecided;
  }, [stats.totalDecided, stats.totalItems, toast]);

  if (isLoading) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-11 w-full" />
              </CardContent>
            </Card>
          ))}
        </main>
      </>
    );
  }

  if (error) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load ballot</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load the ballot information. Please try again.
        </p>
        <Button onClick={() => refetch()} data-testid="button-retry-load">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </main>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-3 border-b bg-muted/30">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span data-testid="text-election-date">{ballotData.electionDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span data-testid="text-location">{location}</span>
          </div>
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-20 sm:pb-12 pb-safe-area">
        {isEventPassed && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" data-testid="alert-election-passed">
            <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">This election has passed</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              This election date has passed. You can still view and update your decisions for your records.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger 
              value="measures" 
              className="flex items-center gap-2"
              data-testid="tab-measures"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Measures</span>
              <Badge variant="secondary" className="ml-1">
                {stats.measures.decided}/{stats.measures.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="candidates" 
              className="flex items-center gap-2"
              data-testid="tab-candidates"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Candidates</span>
              <Badge variant="secondary" className="ml-1">
                {stats.candidates.selected}/{stats.candidates.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="decisions" 
              className="flex items-center gap-2"
              data-testid="tab-decisions"
            >
              {stats.totalDecided === stats.totalItems && stats.totalItems > 0 ? (
                <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <span className="hidden sm:inline">My Decisions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="measures" className="space-y-4 mt-0">
            <div className="text-sm text-muted-foreground mb-4">
              Review each ballot measure and make your decision. Click on a proposition to expand or collapse it.
            </div>
            {ballotData.measures.map((measure) => (
              <BallotMeasureCard
                key={measure.id}
                measure={measure}
                decision={measureDecisions[measure.id] || null}
                onDecisionChange={handleMeasureDecision}
                isExpanded={expandedMeasures.has(measure.id)}
                onToggleExpand={() => toggleMeasureExpand(measure.id)}
                showExpandToggle={true}
              />
            ))}
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6 mt-0">
            <div className="text-sm text-muted-foreground mb-4">
              Select your preferred candidate for each race.
            </div>
            {Object.entries(candidatesByOffice).map(([office, candidates]) => (
              <div key={office} className="space-y-4">
                <h3 className="text-lg font-semibold" data-testid={`text-office-${office}`}>
                  {office}
                </h3>
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      isSelected={candidateSelections[office] === candidate.id}
                      onSelect={(id) => handleCandidateSelect(office, id)}
                      note={candidateNotes[office] || ""}
                      onNoteChange={(note) => handleCandidateNoteChange(office, note)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="decisions" className="mt-0">
            <div className="space-y-6">
              <div className="text-center py-8">
                {stats.totalDecided === stats.totalItems && stats.totalItems > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-12 w-12 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1" data-testid="text-decisions-status">
                      Ready to share!
                    </p>
                    <p className="text-muted-foreground mb-4">All {stats.totalItems} decisions complete</p>
                    <Button
                      onClick={() => {
                        if (existingCard) {
                          navigate(`/card/${existingCard.id}?from=ballot${eventId ? `&eventId=${eventId}` : ""}`);
                        } else {
                          navigate(eventId ? `/voter-card?eventId=${eventId}` : "/voter-card");
                        }
                      }}
                      className="w-full max-w-sm h-12 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-700/40 hover:shadow-xl hover:shadow-emerald-500/40 dark:hover:shadow-emerald-700/50 transition-all duration-300"
                      data-testid="button-create-voter-card"
                    >
                      {existingCard ? (
                        <>
                          Update My Card
                          <Edit2 className="ml-2 h-5 w-5" />
                        </>
                      ) : (
                        <>
                          Create My Card
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-6xl font-bold text-primary mb-2" data-testid="text-decisions-count">
                      {stats.totalItems - stats.totalDecided}
                    </div>
                    <p className="text-muted-foreground">
                      more to go
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.totalDecided} of {stats.totalItems} decisions made
                    </p>
                    <button
                      onClick={() => {
                        const hasPendingMeasures = stats.measures.decided < stats.measures.total;
                        setActiveTab(hasPendingMeasures ? "measures" : "candidates");
                      }}
                      className="mt-3 text-sm text-primary hover:underline font-medium"
                      data-testid="link-go-to-undecided"
                    >
                      {stats.measures.decided < stats.measures.total 
                        ? `Go to Measures (${stats.measures.total - stats.measures.decided} left)`
                        : `Go to Candidates (${stats.candidates.total - stats.candidates.selected} left)`
                      }
                    </button>
                  </>
                )}
              </div>

              {stats.candidates.selected > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Candidate Selections</h3>
                  <div className="space-y-2">
                    {Object.entries(candidatesByOffice)
                      .filter(([office]) => candidateSelections[office])
                      .map(([office, candidates]) => {
                        const selectedCandidate = candidates.find(
                          (c) => c.id === candidateSelections[office]
                        );
                        if (!selectedCandidate) return null;
                        return (
                          <div
                            key={office}
                            className="flex items-center justify-between gap-3 p-3 bg-card rounded-lg border"
                            data-testid={`decision-summary-${office}`}
                          >
                            <p className="font-medium truncate">{office}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold shrink-0 bg-muted border border-border">
                              <User className="h-4 w-4" />
                              {selectedCandidate.name} ({selectedCandidate.party})
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {stats.measures.decided > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Ballot Measures</h3>
                  <div className="space-y-2">
                    {ballotData.measures
                      .filter((m) => measureDecisions[m.id]?.decision && measureDecisions[m.id]?.decision !== "undecided")
                      .map((measure) => {
                        const decision = measureDecisions[measure.id];
                        return (
                          <div
                            key={measure.id}
                            className="p-3 bg-card rounded-lg border"
                            data-testid={`decision-summary-${measure.id}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{measure.number}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {measure.title}
                                </p>
                              </div>
                              <div
                                className={cn(
                                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold shrink-0 min-w-[60px]",
                                  decision.decision === "yes" 
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700" 
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                                )}
                              >
                                {decision.decision === "yes" ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                                {decision.decision === "yes" ? "Yes" : "No"}
                              </div>
                            </div>
                            {decision.note && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-1">Your note:</p>
                                <p className="text-sm whitespace-pre-wrap text-[#6b7789]" data-testid={`decision-note-${measure.id}`}>
                                  {decision.note}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {stats.totalDecided === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You haven't made any decisions yet.
                  </p>
                  <Button onClick={() => setActiveTab("measures")} data-testid="button-start-deciding">
                    Start reviewing ballot measures
                  </Button>
                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

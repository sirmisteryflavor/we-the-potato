import { useState, useRef, useMemo, useEffect } from "react";
import { useLocation, useSearch, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { VoterCardPreview } from "@/components/voter-card-preview";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn, sortDecisions, loginWithReturn } from "@/lib/utils";
import { 
  getOnboardingData, 
  getCandidateSelections,
  generateCardId,
  getActiveEventId,
  clearActiveEventId,
} from "@/lib/storage";
import { useNotes } from "@/hooks/use-notes";
import { useMeasureDecisions } from "@/hooks/use-measure-decisions";
import { MOCK_BALLOT } from "@/data/mock-ballot";
import { Loader2, Check, Eye, EyeOff, Edit, LogIn, Vote } from "lucide-react";
import type { CardTemplate, VoterCardData, BallotMeasure, Candidate, VoterCardDecision, FinalizedVoterCard } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface BallotData {
  id: string;
  state: string;
  county: string;
  electionDate: string;
  electionType: string;
  measures: BallotMeasure[];
  candidates: Candidate[];
}

export default function VoterCardPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const routeParams = useParams<{ cardId?: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const isEditMode = !!routeParams.cardId;
  const cardId = routeParams.cardId;
  
  const [template, setTemplate] = useState<CardTemplate>("bold");
  const [showNotes, setShowNotes] = useState(true);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const onboardingData = getOnboardingData();
  const measureDecisions = useMeasureDecisions(); // Reactive measure decisions from localStorage
  const candidateSelections = getCandidateSelections();
  const notes = useNotes(); // Reactive notes from localStorage

  const searchParams = new URLSearchParams(search);
  const eventIdFromUrl = searchParams.get("eventId") || getActiveEventId();
  const fromParam = searchParams.get("from");

  const state = onboardingData?.state || "NY";
  const county = onboardingData?.county;

  const { data: existingCard, isLoading: cardLoading } = useQuery<FinalizedVoterCard>({
    queryKey: ["/api/finalized-card", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/finalized-card/${cardId}`);
      if (!res.ok) throw new Error("Failed to fetch card");
      return res.json();
    },
    enabled: isEditMode && !!cardId,
    staleTime: 0,
  });

  const eventId = isEditMode ? existingCard?.eventId : eventIdFromUrl;

  useEffect(() => {
    if (isEditMode && existingCard && !isInitialized) {
      setTemplate(existingCard.template as CardTemplate);
      setShowNotes(existingCard.showNotes ?? true);
      // Initialize hiddenItems from server data
      const hidden = new Set<string>();
      existingCard.decisions?.forEach((d: VoterCardDecision) => {
        if (d.hidden) hidden.add(d.title);
      });
      setHiddenItems(hidden);
      setIsInitialized(true);
    }
  }, [isEditMode, existingCard, isInitialized]);

  const { data: ballot, isLoading: ballotLoading } = useQuery<BallotData>({
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
  });

  const ballotData = ballot || MOCK_BALLOT;

  const createCardMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      eventId: string;
      ballotId: string | null;
      template: CardTemplate;
      location: string;
      state?: string;
      electionDate: string;
      electionType: string;
      decisions: VoterCardDecision[];
      showNotes: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/finalized-cards", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/finalized-cards"] });
      clearActiveEventId();
      toast({
        title: "Card created!",
        description: "Your voter card has been saved for this election.",
        duration: 5000,
      });
      navigate(`/card/${data.id}?from=create`);
    },
    onError: (error: Error) => {
      console.error("[voter-card] Failed to create card:", error);
      toast({
        title: "Failed to create card",
        description: error.message || "Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async (data: {
      template: CardTemplate;
      decisions: VoterCardDecision[];
      showNotes: boolean;
    }) => {
      const response = await apiRequest("PUT", `/api/finalized-cards/${cardId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/finalized-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finalized-card", cardId] });
      toast({
        title: "Card updated!",
        description: "Your voter card has been saved.",
        duration: 5000,
      });
      const finalCardParams = fromParam 
        ? `from=${fromParam}${eventId ? `&eventId=${eventId}` : ''}`
        : 'from=profile';
      navigate(`/card/${data.id}?${finalCardParams}`);
    },
    onError: (error: Error) => {
      console.error("[voter-card] Failed to update card:", error);
      toast({
        title: "Failed to update card",
        description: error.message || "Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

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

  const allDecisions = useMemo(() => {
    const items: { id: string; type: "measure" | "candidate"; title: string; decision: string; note?: string; description?: string }[] = [];
    
    Object.entries(candidatesByOffice).forEach(([office, candidates]) => {
      const selectedId = candidateSelections[office];
      if (selectedId) {
        const candidate = candidates.find((c) => c.id === selectedId);
        if (candidate) {
          const positionsText = candidate.positions?.length 
            ? candidate.positions.join(". ") 
            : `${candidate.name} is running for ${office}`;
          const candidateNote = notes[office];
          items.push({
            id: office,
            type: "candidate",
            title: `${office}: ${candidate.name}`,
            decision: "Selected",
            note: candidateNote || undefined,
            description: `${candidate.party} candidate. ${candidate.experience || ""} ${positionsText}`.trim(),
          });
        }
      }
    });

    ballotData.measures.forEach((measure) => {
      const decision = measureDecisions[measure.id];
      if (decision) {
        items.push({
          id: measure.id,
          type: "measure",
          title: measure.number,
          decision: decision.decision.charAt(0).toUpperCase() + decision.decision.slice(1),
          note: decision.note,
          description: measure.summary?.simple || measure.summary?.oneSentence || measure.title,
        });
      }
    });

    return items;
  }, [measureDecisions, candidateSelections, candidatesByOffice, ballotData.measures, notes]);

  // Build mapping from measure number/title to measure ID for note lookups
  const measureNumberToId = useMemo(() => {
    const mapping: Record<string, string> = {};
    ballotData.measures.forEach((measure) => {
      mapping[measure.number] = measure.id;
    });
    return mapping;
  }, [ballotData.measures]);

  const cardData: VoterCardData = useMemo(() => {
    if (isEditMode && existingCard) {
      // Look up notes directly from localStorage for each decision type
      const getNote = (d: VoterCardDecision): string | undefined => {
        if (d.type === "candidate") {
          // Extract office from title (e.g., "Governor" from "Governor: John Smith")
          const colonIndex = d.title.indexOf(":");
          const office = colonIndex > 0 ? d.title.substring(0, colonIndex) : d.title;
          return notes[office];
        } else {
          // For measures, look up by measure ID in measureDecisions
          const measureId = measureNumberToId[d.title];
          if (measureId && measureDecisions[measureId]) {
            return measureDecisions[measureId].note;
          }
        }
        return undefined;
      };
      
      const decisions = sortDecisions(
        existingCard.decisions
          .map((d: VoterCardDecision) => {
            // Get note from localStorage (direct lookup), fallback to server note
            const noteFromLocalStorage = getNote(d);
            const noteFromServer = d.note;
            const noteToUse = noteFromLocalStorage || noteFromServer;
            return {
              type: d.type,
              title: d.title,
              decision: d.decision,
              hidden: hiddenItems.has(d.title), // Preserve actual hidden state
              note: showNotes ? noteToUse : undefined,
              description: d.description,
            };
          })
      );

      return {
        id: existingCard.id,
        template,
        location: existingCard.location,
        state: existingCard.state || undefined,
        electionDate: existingCard.electionDate,
        electionType: existingCard.electionType,
        decisions,
      };
    }

    const location = onboardingData 
      ? `${onboardingData.county || ""} County, ${onboardingData.state}`
      : `${ballotData.county} County, ${ballotData.state}`;

    const userState = onboardingData?.state || ballotData.state;

    const decisions = allDecisions
      .map(d => ({
        type: d.type,
        title: d.title,
        decision: d.decision,
        hidden: hiddenItems.has(d.title), // Preserve actual hidden state
        note: showNotes ? d.note : undefined,
        description: d.description,
      }));

    return {
      id: generateCardId(),
      template,
      location,
      state: userState,
      electionDate: ballotData.electionDate,
      electionType: ballotData.electionType,
      decisions,
    };
  }, [template, allDecisions, onboardingData, ballotData, showNotes, hiddenItems, isEditMode, existingCard, notes, measureDecisions, measureNumberToId]);

  const toggleItemVisibility = (title: string) => {
    setHiddenItems((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleFinalize = () => {
    if (!isAuthenticated) {
      loginWithReturn();
      return;
    }

    // Helper to look up notes directly from localStorage for each decision type
    const getNote = (d: VoterCardDecision | typeof allDecisions[0]): string | undefined => {
      if (d.type === "candidate") {
        // Extract office from title (e.g., "Governor" from "Governor: John Smith")
        const colonIndex = d.title.indexOf(":");
        const office = colonIndex > 0 ? d.title.substring(0, colonIndex) : d.title;
        return notes[office];
      } else {
        // For measures, look up by measure ID in measureDecisions
        const measureId = measureNumberToId[d.title];
        if (measureId && measureDecisions[measureId]) {
          return measureDecisions[measureId].note;
        }
      }
      return undefined;
    };

    const decisionsToUse = isEditMode && existingCard ? existingCard.decisions : allDecisions;
    
    const decisions: VoterCardDecision[] = decisionsToUse
      .map((d: VoterCardDecision | typeof allDecisions[0]) => {
        // Get note from localStorage (direct lookup), fallback to server/allDecisions note
        const noteFromLocalStorage = getNote(d);
        return {
          type: d.type as "measure" | "candidate",
          title: d.title,
          decision: d.decision,
          hidden: hiddenItems.has(d.title),
          note: noteFromLocalStorage || d.note,
          description: d.description,
        };
      });

    if (isEditMode && cardId) {
      updateCardMutation.mutate({
        template,
        decisions,
        showNotes,
      });
    } else {
      if (!eventId) {
        toast({
          title: "Cannot create card",
          description: "No election event specified.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      const location = onboardingData 
        ? `${onboardingData.county || ""} County, ${onboardingData.state}`
        : `${ballotData.county} County, ${ballotData.state}`;

      const userState = onboardingData?.state || ballotData.state;

      createCardMutation.mutate({
        id: generateCardId(),
        eventId,
        ballotId: ballotData.id || null,
        template,
        location,
        state: userState,
        electionDate: ballotData.electionDate,
        electionType: ballotData.electionType,
        decisions,
        showNotes,
      });
    }
  };

  const templates: { id: CardTemplate; name: string; description: string }[] = [
    { id: "minimal", name: "Minimal", description: "Clean and simple" },
    { id: "bold", name: "Bold", description: "Colorful gradients" },
    { id: "professional", name: "Professional", description: "Sleek and modern" },
  ];

  if (ballotLoading || (isEditMode && cardLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const displayDecisions = sortDecisions(isEditMode && existingCard ? existingCard.decisions : allDecisions);

  if (displayDecisions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Vote className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No decisions yet</h1>
        <p className="text-muted-foreground text-center mb-6">
          Make some decisions on the ballot before creating your voter card.
        </p>
        <Button onClick={() => navigate(eventId ? `/ballot?eventId=${eventId}` : "/ballot")} data-testid="button-go-to-ballot">
          Go to Ballot
        </Button>
      </div>
    );
  }

  const getBackDestination = () => {
    if (isEditMode) {
      switch (fromParam) {
        case "profile":
          return "/profile?tab=votes";
        case "home":
          return "/home";
        case "ballot":
          return eventId ? `/ballot?eventId=${eventId}` : "/ballot";
        default:
          return "/profile?tab=votes";
      }
    }
    return eventId ? `/ballot?eventId=${eventId}` : "/ballot";
  };

  const handleBack = () => {
    navigate(getBackDestination());
  };

  const isSaving = createCardMutation.isPending || updateCardMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBackButton onBack={handleBack} maxWidth="max-w-lg" />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <section>
          <h2 className="text-sm font-semibold mb-3">Preview</h2>
          <div className="flex justify-center">
            <div className="w-56">
              <VoterCardPreview ref={cardRef} data={cardData} username={user?.username || undefined} />
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button 
              variant="default"
              size="lg"
              onClick={() => navigate(eventId ? `/ballot?eventId=${eventId}` : "/ballot")}
              disabled={isSaving}
              data-testid="button-change-decisions"
            >
              <Edit className="mr-2 h-5 w-5" />
              Change My Decisions
            </Button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">Choose Template</h2>
          <div className="grid grid-cols-3 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={cn(
                  "relative p-2.5 rounded-lg border-2 transition-all text-left",
                  template === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover-elevate"
                )}
                data-testid={`button-template-${t.id}`}
              >
                {template === t.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
                <p className="font-medium text-xs">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">Options</h2>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Show Notes</p>
                  <p className="text-xs text-muted-foreground">
                    Include personal notes on card
                  </p>
                </div>
                <Switch
                  checked={showNotes}
                  onCheckedChange={setShowNotes}
                  data-testid="switch-show-notes"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">Visibility</h2>
          <Card>
            <CardContent className="p-3 space-y-3">
              {displayDecisions.map((decision) => (
                <div
                  key={decision.title}
                  className="flex items-center justify-between"
                  data-testid={`toggle-item-${decision.title}`}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium text-sm truncate">{decision.title}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {decision.decision}
                    </p>
                  </div>
                  <Button
                    variant={hiddenItems.has(decision.title) ? "outline" : "default"}
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => toggleItemVisibility(decision.title)}
                    data-testid={`button-visibility-${decision.title}`}
                  >
                    {hiddenItems.has(decision.title) ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <div className="pt-2 pb-6 max-w-sm mx-auto w-full">
          <Button 
            onClick={handleFinalize} 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSaving || authLoading || (!isEditMode && !eventId)}
            data-testid={isEditMode ? "button-save-card" : "button-create-card"}
          >
            {isSaving || authLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : !isAuthenticated ? (
              <LogIn className="mr-2 h-5 w-5" />
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            {authLoading ? "Loading..." : isEditMode ? "Save Card" : !isAuthenticated ? "Sign In to Create Card" : "Create Card"}
          </Button>
          {!isEditMode && !eventId && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please navigate from an election event to create a card.
            </p>
          )}
          {!authLoading && !isAuthenticated && !isEditMode && eventId && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Sign in is required to save your voter card
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { VoterCardPreview } from "@/components/voter-card-preview";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn, sortDecisions } from "@/lib/utils";
import {
  getOnboardingData,
  getCandidateSelections,
} from "@/lib/storage";
import { useNotes } from "@/hooks/use-notes";
import { useMeasureDecisions } from "@/hooks/use-measure-decisions";
import { MOCK_BALLOT } from "@/data/mock-ballot";
import { Loader2, Check, Eye, EyeOff, Edit, Vote } from "lucide-react";
import type { CardTemplate, VoterCardData, BallotMeasure, Candidate, VoterCardDecision, FinalizedVoterCard } from "@/lib/schema";
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

export default function EditVoterCardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const { visitorId, isLoading: authLoading } = useAuth();

  const cardId = params.id as string;
  const fromParam = searchParams.get("from");
  const eventIdParam = searchParams.get("eventId");

  const [template, setTemplate] = useState<CardTemplate>("bold");
  const [showNotes, setShowNotes] = useState(true);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const onboardingData = getOnboardingData();
  const measureDecisions = useMeasureDecisions();
  const notes = useNotes();

  const state = onboardingData?.state || "NY";
  const county = onboardingData?.county;

  const { data: existingCard, isLoading: cardLoading } = useQuery<FinalizedVoterCard>({
    queryKey: ["/api/finalized-card", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/finalized-card/${cardId}`);
      if (!res.ok) throw new Error("Failed to fetch card");
      return res.json();
    },
    enabled: !!cardId,
    staleTime: 0,
  });

  const eventId = existingCard?.eventId;

  useEffect(() => {
    if (existingCard && !isInitialized) {
      setTemplate(existingCard.template as CardTemplate);
      setShowNotes(existingCard.showNotes ?? true);
      const hidden = new Set<string>();
      existingCard.decisions?.forEach((d: VoterCardDecision) => {
        if (d.hidden) hidden.add(d.title);
      });
      setHiddenItems(hidden);
      setIsInitialized(true);
    }
  }, [existingCard, isInitialized]);

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

  const measureNumberToId = useMemo(() => {
    const mapping: Record<string, string> = {};
    ballotData.measures.forEach((measure) => {
      mapping[measure.number] = measure.id;
    });
    return mapping;
  }, [ballotData.measures]);

  const updateCardMutation = useMutation({
    mutationFn: async (data: {
      visitorId: string;
      template: CardTemplate;
      decisions: VoterCardDecision[];
      showNotes: boolean;
    }) => {
      const response = await apiRequest("PUT", `/api/finalized-cards/${cardId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitor/finalized-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finalized-card", cardId] });
      toast({
        title: "Card updated!",
        description: "Your voter card has been saved.",
        duration: 5000,
      });
      const finalCardParams = fromParam
        ? `from=${fromParam}${eventId ? `&eventId=${eventId}` : ''}`
        : 'from=profile';
      router.push(`/card/${data.id}?${finalCardParams}`);
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

  const cardData: VoterCardData = useMemo(() => {
    if (!existingCard) {
      return {
        id: cardId || "",
        template: "bold",
        location: "",
        electionDate: "",
        electionType: "",
        decisions: [],
      };
    }

    const getNote = (d: VoterCardDecision): string | undefined => {
      if (d.type === "candidate") {
        const colonIndex = d.title.indexOf(":");
        const office = colonIndex > 0 ? d.title.substring(0, colonIndex) : d.title;
        return notes[office];
      } else {
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
          const noteFromLocalStorage = getNote(d);
          const noteFromServer = d.note;
          const noteToUse = noteFromLocalStorage || noteFromServer;
          return {
            type: d.type,
            title: d.title,
            decision: d.decision,
            hidden: hiddenItems.has(d.title),
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
  }, [template, existingCard, hiddenItems, showNotes, notes, measureDecisions, measureNumberToId, cardId]);

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
    if (!visitorId) {
      toast({
        title: "Loading...",
        description: "Please wait a moment and try again.",
        duration: 3000,
      });
      return;
    }

    if (!existingCard) return;

    const getNote = (d: VoterCardDecision): string | undefined => {
      if (d.type === "candidate") {
        const colonIndex = d.title.indexOf(":");
        const office = colonIndex > 0 ? d.title.substring(0, colonIndex) : d.title;
        return notes[office];
      } else {
        const measureId = measureNumberToId[d.title];
        if (measureId && measureDecisions[measureId]) {
          return measureDecisions[measureId].note;
        }
      }
      return undefined;
    };

    const decisions: VoterCardDecision[] = existingCard.decisions.map((d: VoterCardDecision) => {
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

    updateCardMutation.mutate({
      visitorId,
      template,
      decisions,
      showNotes,
    });
  };

  const templates: { id: CardTemplate; name: string; description: string }[] = [
    { id: "minimal", name: "Minimal", description: "Clean and simple" },
    { id: "bold", name: "Bold", description: "Colorful gradients" },
    { id: "professional", name: "Professional", description: "Sleek and modern" },
  ];

  if (ballotLoading || cardLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!existingCard) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Vote className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Card not found</h1>
        <p className="text-muted-foreground text-center mb-6">
          This voter card could not be found.
        </p>
        <Button onClick={() => router.push("/home")} data-testid="button-go-home">
          Go Home
        </Button>
      </div>
    );
  }

  const displayDecisions = sortDecisions(existingCard.decisions);

  const getBackDestination = () => {
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
  };

  const handleBack = () => {
    router.push(getBackDestination());
  };

  const isSaving = updateCardMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBackButton onBack={handleBack} maxWidth="max-w-lg" />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <section>
          <h2 className="text-sm font-semibold mb-3">Preview</h2>
          <div className="flex justify-center">
            <div className="w-56">
              <VoterCardPreview ref={cardRef} data={cardData} />
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => router.push(eventId ? `/ballot?eventId=${eventId}` : "/ballot")}
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
            disabled={isSaving || authLoading}
            data-testid="button-save-card"
          >
            {isSaving || authLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            {authLoading ? "Loading..." : "Save Card"}
          </Button>
        </div>
      </main>
    </div>
  );
}

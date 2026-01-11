import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getOnboardingData, getVisitorId } from "@/lib/storage";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, 
  Bell, 
  BellOff, 
  ChevronRight, 
  ChevronDown,
  MapPin, 
  Clock,
  FileText,
  CheckCircle2,
  CreditCard,
  History
} from "lucide-react";
import type { ElectionEventData } from "@shared/schema";

interface ElectionEvent {
  id: string;
  state: string;
  county: string | null;
  title: string;
  eventType: string;
  electionDate: string;
  registrationDeadline: string | null;
  description: string | null;
  ballotId: string | null;
  status: "upcoming" | "current" | "passed";
  isSubscribed?: boolean;
}

interface FinalizedVoterCard {
  id: string;
  userId: string | null;
  eventId: string;
  template: string;
  location: string;
  electionDate: string;
  electionType: string;
  createdAt: string;
}

const eventTypeColors: Record<string, string> = {
  primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  general: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  midterm: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  runoff: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  special: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

function getDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { 
    weekday: "short",
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

interface EventCardProps {
  event: ElectionEvent;
  finalizedCard: FinalizedVoterCard | undefined;
  onEventClick: (event: ElectionEvent) => void;
  onNotificationToggle: (event: ElectionEvent, e: React.MouseEvent) => void;
  isNotificationPending: boolean;
  isPast?: boolean;
}

function EventCard({ event, finalizedCard, onEventClick, onNotificationToggle, isNotificationPending, isPast }: EventCardProps) {
  const daysUntil = getDaysUntil(event.electionDate);
  const isUpcoming = daysUntil > 0;
  const hasBallot = !!event.ballotId;
  const hasVoted = !!finalizedCard;
  const isClickable = hasBallot || hasVoted;

  return (
    <Card
      className={`overflow-visible transition-colors ${isClickable ? "hover-elevate cursor-pointer" : "opacity-75"} ${isPast ? "opacity-80" : ""}`}
      onClick={() => isClickable && onEventClick(event)}
      data-testid={`card-event-${event.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge 
                className={eventTypeColors[event.eventType] || "bg-gray-100 text-gray-800"}
              >
                {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
              </Badge>
              {event.status === "current" && (
                <Badge variant="outline" className="text-xs border-primary text-primary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              )}
              {isPast && (
                <Badge variant="secondary" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  Past
                </Badge>
              )}
              {hasVoted && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Card Created
                </Badge>
              )}
              {isUpcoming && daysUntil <= 30 && !isPast && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysUntil} days
                </Badge>
              )}
              {hasBallot && !hasVoted && !isPast && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Ballot Ready
                </Badge>
              )}
            </div>

            <h3 
              className="text-lg font-semibold mb-1"
              data-testid={`text-event-title-${event.id}`}
            >
              {event.title}
            </h3>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.electionDate)}</span>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            )}

            {event.registrationDeadline && !isPast && (
              <p className="text-xs text-muted-foreground mt-2">
                Registration deadline: {formatDate(event.registrationDeadline)}
              </p>
            )}
          </div>

          {!isPast && (
            <Button
              variant={event.isSubscribed ? "default" : "outline"}
              size="icon"
              onClick={(e) => onNotificationToggle(event, e)}
              disabled={isNotificationPending}
              data-testid={`button-notify-${event.id}`}
            >
              {event.isSubscribed ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomeFeed() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const visitorId = getVisitorId();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [onboardingData, setOnboardingData] = useState(() => getOnboardingData());
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const data = getOnboardingData();
    setOnboardingData(data);
    if (!data) {
      navigate("/onboarding");
    } else {
      setIsCheckingOnboarding(false);
    }
  }, [navigate]);

  const { data: events, isLoading } = useQuery<ElectionEvent[]>({
    queryKey: ["/api/events", onboardingData?.state, visitorId],
    queryFn: async () => {
      if (!onboardingData?.state) return [];
      const res = await fetch(`/api/events/${onboardingData.state}?visitorId=${visitorId}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    enabled: !!onboardingData?.state,
  });

  const upcomingEvents = events?.filter(e => e.status === "upcoming" || e.status === "current") || [];
  const passedEvents = events?.filter(e => e.status === "passed") || [];

  const { data: finalizedCards } = useQuery<FinalizedVoterCard[]>({
    queryKey: ["/api/user/finalized-cards"],
    queryFn: async () => {
      const res = await fetch(`/api/user/finalized-cards`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const getFinalizedCardForEvent = (eventId: string): FinalizedVoterCard | undefined => {
    return finalizedCards?.find(card => card.eventId === eventId);
  };

  const subscribeMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("POST", "/api/events/subscribe", { visitorId, eventId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("POST", "/api/events/unsubscribe", { visitorId, eventId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const handleEventClick = (event: ElectionEvent) => {
    const finalizedCard = getFinalizedCardForEvent(event.id);
    if (finalizedCard) {
      navigate(`/card/${finalizedCard.id}?from=home`);
    } else if (event.ballotId) {
      navigate(`/ballot?eventId=${event.id}`);
    }
  };

  const handleNotificationToggle = (event: ElectionEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.isSubscribed) {
      unsubscribeMutation.mutate(event.id);
    } else {
      subscribeMutation.mutate(event.id);
    }
  };

  if (isCheckingOnboarding || !onboardingData) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  const stateName = {
    NY: "New York",
    NJ: "New Jersey", 
    PA: "Pennsylvania",
    CT: "Connecticut",
    TX: "Texas",
  }[onboardingData.state] || onboardingData.state;

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold" data-testid="text-location">
            {stateName}
          </h1>
          {onboardingData.county && (
            <Badge variant="secondary" className="ml-2">
              {onboardingData.county} County
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1">Upcoming Elections</h2>
          <p className="text-sm text-muted-foreground">
            Select an election to view and track your ballot decisions
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventCard 
                    key={event.id}
                    event={event}
                    finalizedCard={getFinalizedCardForEvent(event.id)}
                    onEventClick={handleEventClick}
                    onNotificationToggle={handleNotificationToggle}
                    isNotificationPending={subscribeMutation.isPending || unsubscribeMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No upcoming elections found for your area.
                  </p>
                </CardContent>
              </Card>
            )}

            {passedEvents.length > 0 && (
              <Collapsible open={showPastEvents} onOpenChange={setShowPastEvents}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between py-3 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-past-events"
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      <span>Past Elections ({passedEvents.length})</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showPastEvents ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  {passedEvents.map((event) => (
                    <EventCard 
                      key={event.id}
                      event={event}
                      finalizedCard={getFinalizedCardForEvent(event.id)}
                      onEventClick={handleEventClick}
                      onNotificationToggle={handleNotificationToggle}
                      isNotificationPending={subscribeMutation.isPending || unsubscribeMutation.isPending}
                      isPast
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </main>
    </>
  );
}

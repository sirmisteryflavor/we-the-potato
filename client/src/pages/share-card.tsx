import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { VoterCardPreview } from "@/components/voter-card-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { getVoterCard } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Vote, CalendarDays, MapPin, Users, ArrowRight, ExternalLink, AlertCircle } from "lucide-react";
import type { VoterCardData } from "@shared/schema";

export default function ShareCardPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: cardData, isLoading, error } = useQuery<VoterCardData | null>({
    queryKey: ["/api/voter-cards", id],
    queryFn: async () => {
      const localCard = getVoterCard(id!);
      if (localCard) {
        return localCard;
      }

      try {
        const response = await fetch(`/api/voter-cards/${id}`);
        if (response.ok) {
          return response.json();
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vote className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">We The Potato</span>
            </div>
            <div className="flex items-center gap-1">
              <NavMenu />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8 space-y-4">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <div className="flex justify-center mb-8">
            <Skeleton className="w-72 h-96" />
          </div>
          <Card>
            <CardContent className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vote className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">We The Potato</span>
            </div>
            <div className="flex items-center gap-1">
              <NavMenu />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-card-not-found">
            Voter Card Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            This voter card may have been removed or the link is incorrect.
          </p>
          <Button onClick={() => navigate("/")} data-testid="button-create-own-card">
            Create Your Own Voter Card
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </main>
      </div>
    );
  }

  const visibleDecisions = cardData.decisions.filter(d => !d.hidden);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Vote className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">We The Potato</span>
          </div>
          <div className="flex items-center gap-1">
            <NavMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Users className="h-3.5 w-3.5 mr-1" />
            Shared Voter Card
          </Badge>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-card-title">
            Someone's 2026 Primary Choices
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span data-testid="text-card-location">{cardData.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span data-testid="text-card-date">{cardData.electionDate}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-72">
            <VoterCardPreview data={cardData} />
          </div>
        </div>

        {visibleDecisions.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-center">Their Decisions</h2>
            <div className="space-y-2">
              {visibleDecisions.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border"
                  data-testid={`shared-decision-${index}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.type === "measure" ? "Ballot Measure" : "Candidate Selection"}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "ml-3 shrink-0",
                      item.decision.toLowerCase() === "yes" && "bg-success text-success-foreground",
                      item.decision.toLowerCase() === "no" && "bg-destructive text-destructive-foreground",
                      item.decision.toLowerCase() === "undecided" && "bg-warning text-warning-foreground",
                      item.decision.toLowerCase() === "selected" && "bg-success text-success-foreground"
                    )}
                  >
                    {item.decision}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Make your voice heard too!</h3>
          <p className="text-muted-foreground mb-6">
            Create your own voter card and share it with friends and family.
          </p>
          <Button 
            onClick={() => navigate("/")} 
            size="lg" 
            className="h-12"
            data-testid="button-create-your-card"
          >
            Create Your Own Card
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Not registered to vote yet? Check your registration status.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open("https://vote.org/am-i-registered-to-vote/", "_blank")}
            data-testid="button-check-registration"
          >
            Check Registration
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { getOnboardingData, clearAllData } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Vote,
  MapPin,
  Calendar,
  Settings,
  Trash2,
  CreditCard,
  Search,
  Eye,
  Copy,
  Share2,
  ArrowLeft,
} from "lucide-react";

interface FinalizedCard {
  id: string;
  eventId: string;
  template: string;
  location: string;
  electionDate: string;
  electionType: string;
  isPublic: boolean;
  createdAt: string;
}

const VALID_TABS = ["votes", "settings"] as const;
type TabValue = (typeof VALID_TABS)[number];

function getTabFromSearch(search: string): TabValue {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  if (tab && VALID_TABS.includes(tab as TabValue)) {
    return tab as TabValue;
  }
  return "votes";
}

export default function Profile() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const onboardingData = getOnboardingData();
  const { visitorId, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [electionTypeFilter, setElectionTypeFilter] = useState<string>("all");

  const [activeTab, setActiveTab] = useState<TabValue>(() => getTabFromSearch(search));

  useEffect(() => {
    const tabFromUrl = getTabFromSearch(search);
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [search, activeTab]);

  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);
    navigate(`/profile?tab=${newTab}`, { replace: true });
  };

  const { data: cards = [], isLoading: cardsLoading } = useQuery<FinalizedCard[]>({
    queryKey: ["/api/visitor/finalized-cards", visitorId],
    queryFn: async () => {
      if (!visitorId) return [];
      const res = await fetch(`/api/visitor/finalized-cards/${visitorId}`);
      if (!res.ok) throw new Error("Failed to fetch cards");
      return res.json();
    },
    enabled: !!visitorId,
  });

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        cardSearchQuery === "" ||
        card.location.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
        card.electionType.toLowerCase().includes(cardSearchQuery.toLowerCase());

      const matchesType =
        electionTypeFilter === "all" ||
        card.electionType.toLowerCase().includes(electionTypeFilter.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [cards, cardSearchQuery, electionTypeFilter]);

  const handleShareCard = async (cardId: string) => {
    const shareUrl = `${window.location.origin}/card/${cardId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link with others to show your voter card.",
        duration: 3000,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all local data? This will remove your saved decisions and preferences.")) {
      clearAllData();
      toast({
        title: "Data cleared",
        description: "All local data has been removed.",
        duration: 3000,
      });
      navigate("/");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Vote className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">We The Potato</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer ml-1"
              onClick={() => navigate("/")}
              data-testid="link-home-logo"
            >
              <Vote className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg hidden sm:block">We The Potato</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NavMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              My Voter Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onboardingData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{onboardingData.county} County, {onboardingData.state}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="votes" data-testid="tab-votes">
              <CreditCard className="h-4 w-4 mr-2" />
              My Cards
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="votes" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-cards"
                />
              </div>
              <Select value={electionTypeFilter} onValueChange={setElectionTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cardsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : filteredCards.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No voter cards yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first voter card by making decisions on the ballot.
                  </p>
                  <Button onClick={() => navigate("/home")} data-testid="button-create-first-card">
                    View Elections
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCards.map((card) => (
                  <Card key={card.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {card.electionType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {card.template}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{card.location}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {card.electionDate}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/card/${card.id}`)}
                            data-testid={`button-view-card-${card.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleShareCard(card.id)}
                            data-testid={`button-share-card-${card.id}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your decisions and preferences are stored locally in your browser.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  className="w-full"
                  data-testid="button-clear-data"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Local Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We The Potato is a non-partisan voter guide for the 2026 primaries.
                  Your privacy is important to us - all your data stays on your device.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

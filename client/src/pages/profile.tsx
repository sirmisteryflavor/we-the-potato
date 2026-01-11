import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getOnboardingData, getVisitorId, clearAllData } from "@/lib/storage";
import { loginWithReturn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Vote, 
  MapPin, 
  Bell,
  Calendar,
  Settings,
  Trash2,
  User,
  ListOrdered,
  Pencil,
  LogIn,
  LogOut,
  Mail,
  CreditCard,
  Search,
  Eye,
  Copy,
  FileText,
  Globe,
  Lock,
  AtSign,
  Check,
  Loader2,
  X
} from "lucide-react";

interface SubscribedEvent {
  id: string;
  title: string;
  eventType: string;
  electionDate: string;
}

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

const VALID_TABS = ["profile", "votes", "following", "settings"] as const;
type TabValue = typeof VALID_TABS[number];

function getTabFromSearch(search: string): TabValue {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  if (tab && VALID_TABS.includes(tab as TabValue)) {
    return tab as TabValue;
  }
  return "profile";
}

export default function Profile() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const onboardingData = getOnboardingData();
  const visitorId = getVisitorId();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [electionTypeFilter, setElectionTypeFilter] = useState<string>("all");
  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabValue>(() => getTabFromSearch(search));
  
  useEffect(() => {
    const tabFromUrl = getTabFromSearch(search);
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [search]);
  
  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);
    navigate(`/profile?tab=${newTab}`, { replace: false });
  };

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);
    if (!isValidFormat) {
      setIsUsernameAvailable(false);
      setUsernameError("Username must start with a letter and contain only letters, numbers, and underscores");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
        const data = await response.json();
        setIsUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError(data.reason || "This username is not available");
        } else {
          setUsernameError(null);
        }
      } catch {
        setUsernameError("Failed to check username availability");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const setUsernameMutation = useMutation({
    mutationFn: async (usernameToSet: string) => {
      const response = await apiRequest("POST", "/api/user/username", { username: usernameToSet });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingUsername(false);
      setUsername("");
      toast({
        title: "Username set successfully!",
        description: "Your shareable profile link is now active.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set username",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSetUsername = () => {
    if (username && isUsernameAvailable && !usernameError) {
      setUsernameMutation.mutate(username);
    }
  };

  const { data: subscribedEvents } = useQuery<SubscribedEvent[]>({
    queryKey: ["/api/subscriptions", visitorId],
  });

  const { data: userCards, isLoading: cardsLoading } = useQuery<FinalizedCard[]>({
    queryKey: ["/api/user/finalized-cards"],
    enabled: isAuthenticated,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ cardId, isPublic }: { cardId: string; isPublic: boolean }) => {
      const response = await apiRequest("PUT", `/api/finalized-cards/${cardId}`, { isPublic });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/finalized-cards"] });
      toast({
        title: data.isPublic ? "Card is now public" : "Card is now private",
        description: data.isPublic 
          ? "Anyone with the link can view this card." 
          : "Only you can view this card.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update visibility",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleVisibility = (cardId: string, currentIsPublic: boolean) => {
    toggleVisibilityMutation.mutate({ cardId, isPublic: !currentIsPublic });
  };

  const filteredCards = useMemo(() => {
    if (!userCards) return [];
    let result = userCards;
    
    if (electionTypeFilter !== "all") {
      result = result.filter(card => 
        card.electionType.toLowerCase().includes(electionTypeFilter.toLowerCase())
      );
    }
    
    if (cardSearchQuery.trim()) {
      const query = cardSearchQuery.toLowerCase();
      result = result.filter(card => 
        card.location.toLowerCase().includes(query) ||
        card.electionType.toLowerCase().includes(query) ||
        card.electionDate.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [userCards, cardSearchQuery, electionTypeFilter]);

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
      clearAllData();
      navigate("/");
    }
  };

  const handleShareCard = async (cardId: string) => {
    const shareUrl = `${window.location.origin}/share/${cardId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link with others to show your voter card.",
      });
    } catch (err) {
      toast({
        title: "Unable to copy",
        description: shareUrl,
        variant: "destructive",
      });
    }
  };

  const stateName = onboardingData ? {
    NY: "New York",
    NJ: "New Jersey", 
    PA: "Pennsylvania",
    CT: "Connecticut",
    TX: "Texas",
  }[onboardingData.state] || onboardingData.state : "Unknown";

  const issueLabels: Record<string, string> = {
    economy: "Economy & Jobs",
    education: "Education",
    healthcare: "Healthcare",
    environment: "Environment",
    public_safety: "Public Safety",
  };

  const electionTypes = ["all", "primary", "general", "midterm", "special"];

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="text-xs sm:text-sm" data-testid="tab-profile">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="votes" className="text-xs sm:text-sm" data-testid="tab-votes">
              <CreditCard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">My Votes</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs sm:text-sm" data-testid="tab-following">
              <Bell className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm" data-testid="tab-settings">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {authLoading ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ) : isAuthenticated && user ? (
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover shrink-0"
                          data-testid="img-user-avatar"
                        />
                      ) : (
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        {(user.firstName || user.lastName) && (
                          <p className="font-semibold text-base sm:text-lg truncate" data-testid="text-user-name">
                            {user.firstName} {user.lastName}
                          </p>
                        )}
                        {user.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 truncate" data-testid="text-user-email">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </p>
                        )}
                        {user.username ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-username">
                            <AtSign className="h-3 w-3 shrink-0" />
                            <span>{user.username}</span>
                            <span className="text-xs">· wethepotato.com/{user.username}</span>
                          </p>
                        ) : isEditingUsername ? (
                          <div className="space-y-2 pt-1">
                            <div className="relative">
                              <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                placeholder="Choose a username"
                                className="pr-10 h-8 text-sm"
                                maxLength={20}
                                data-testid="input-username"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isCheckingUsername && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                {!isCheckingUsername && isUsernameAvailable === true && (
                                  <Check className="h-3 w-3 text-green-500" />
                                )}
                                {!isCheckingUsername && isUsernameAvailable === false && (
                                  <X className="h-3 w-3 text-destructive" />
                                )}
                              </div>
                            </div>
                            {username.length > 0 && username.length < 3 && (
                              <p className="text-xs text-muted-foreground">At least 3 characters</p>
                            )}
                            {usernameError && (
                              <p className="text-xs text-destructive">{usernameError}</p>
                            )}
                            {isUsernameAvailable && username.length >= 3 && (
                              <p className="text-xs text-green-600">wethepotato.com/{username} is available!</p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSetUsername}
                                disabled={!isUsernameAvailable || setUsernameMutation.isPending || username.length < 3}
                                data-testid="button-save-username"
                              >
                                {setUsernameMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsEditingUsername(false);
                                  setUsername("");
                                  setUsernameError(null);
                                }}
                                data-testid="button-cancel-username"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditingUsername(true)}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                            data-testid="button-set-username"
                          >
                            <AtSign className="h-3 w-3" />
                            Set username
                          </button>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = "/api/logout"}
                      className="w-full sm:w-auto shrink-0"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Sign in to sync your decisions across devices
                    </p>
                    <Button
                      onClick={() => loginWithReturn()}
                      className="w-full sm:w-auto"
                      data-testid="button-login"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Your Location
                </CardTitle>
                {onboardingData && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/onboarding?edit=location")}
                    data-testid="button-edit-location"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {onboardingData ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{stateName}</span>
                    {onboardingData.county && (
                      <Badge variant="secondary">{onboardingData.county} County</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No profile data found.</p>
                )}
              </CardContent>
            </Card>

            {onboardingData?.issueRanking && onboardingData.issueRanking.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <ListOrdered className="h-5 w-5" />
                    Issue Priorities
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/onboarding?edit=issues")}
                    data-testid="button-edit-issues"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {onboardingData.issueRanking.map((issue, index) => (
                      <Badge key={issue} variant="outline">
                        {index + 1}. {issueLabels[issue] || issue}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Votes Tab */}
          <TabsContent value="votes" className="space-y-4">
            {!isAuthenticated ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Sign in to view your voter cards</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create and manage your shareable voter cards by signing in.
                  </p>
                  <Button
                    onClick={() => loginWithReturn()}
                    data-testid="button-login-votes"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
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
                    <SelectTrigger className="w-full sm:w-40" data-testid="select-election-type">
                      <SelectValue placeholder="Election type" />
                    </SelectTrigger>
                    <SelectContent>
                      {electionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cards List */}
                {cardsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : filteredCards.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCards.map((card) => (
                      <Card key={card.id} className="overflow-visible" data-testid={`card-item-${card.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{card.location}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {card.electionType}
                                      </Badge>
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {card.electionDate}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/card/${card.id}?from=profile`)}
                                  data-testid={`button-view-${card.id}`}
                                >
                                  <Eye className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShareCard(card.id)}
                                  data-testid={`button-share-${card.id}`}
                                >
                                  <Copy className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Copy Link</span>
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-2">
                                {card.isPublic ? (
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {card.isPublic ? "Public - Anyone with the link can view" : "Private - Only you can view"}
                                </span>
                              </div>
                              <Switch
                                checked={card.isPublic}
                                onCheckedChange={() => handleToggleVisibility(card.id, card.isPublic)}
                                disabled={toggleVisibilityMutation.isPending}
                                data-testid={`switch-visibility-${card.id}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userCards && userCards.length > 0 && (cardSearchQuery || electionTypeFilter !== "all") ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No cards match your filters
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => {
                          setCardSearchQuery("");
                          setElectionTypeFilter("all");
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No voter cards yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Make decisions on a ballot to create your first shareable voter card.
                      </p>
                      <Button
                        onClick={() => navigate("/home")}
                        data-testid="button-browse-elections"
                      >
                        Browse Elections
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Election Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscribedEvents && subscribedEvents.length > 0 ? (
                  <ul className="space-y-3">
                    {subscribedEvents.map((event) => (
                      <li 
                        key={event.id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                        data-testid={`subscription-${event.id}`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{event.electionDate}</span>
                          </div>
                        </div>
                        <Badge className="self-start sm:self-auto shrink-0">{event.eventType}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-4 text-center">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No subscriptions yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Follow elections to get notified about important updates.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/home")}
                      data-testid="button-browse-elections-following"
                    >
                      Browse Elections
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">Toggle dark/light mode</p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will delete all your saved decisions, preferences, and start fresh. 
                  This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  className="w-full"
                  data-testid="button-clear-data"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
          <Vote className="h-4 w-4" />
          <span>We The Potato</span>
        </div>
    </main>
  );
}

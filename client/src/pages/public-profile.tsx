import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, MapPin, FileText } from "lucide-react";
import type { FinalizedVoterCard } from "@shared/schema";

interface PublicUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export default function PublicProfile() {
  const params = useParams();
  const username = params.username;

  const { data: user, isLoading: userLoading, error: userError } = useQuery<PublicUser>({
    queryKey: ["/api/users", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
    enabled: !!username,
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<FinalizedVoterCard[]>({
    queryKey: ["/api/users", username, "cards"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/cards`);
      if (!res.ok) throw new Error("Failed to fetch cards");
      return res.json();
    },
    enabled: !!username && !!user,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-muted-foreground mb-4">This profile doesn't exist.</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : `@${user.username}`;

  const initials = user.firstName 
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`
    : user.username.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-display-name">{displayName}</h1>
            <p className="text-muted-foreground" data-testid="text-username">@{user.username}</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Voter Cards</h2>

        {cardsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : cards && cards.length > 0 ? (
          <div className="space-y-4">
            {cards.map((card) => (
              <Link key={card.id} href={`/${username}/${card.id}`}>
                <Card className="hover-elevate cursor-pointer" data-testid={`card-voter-${card.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{card.electionType}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{card.electionDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{card.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{card.decisions.filter((d: { hidden?: boolean }) => !d.hidden).length} items</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No voter cards shared yet.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

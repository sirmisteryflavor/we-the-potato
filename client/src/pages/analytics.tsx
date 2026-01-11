import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/app-header";
import { 
  Users, 
  Share2, 
  CheckCircle, 
  TrendingUp, 
  Vote, 
  PieChart,
  Activity,
} from "lucide-react";

interface AnalyticsData {
  totalVisitors: number;
  totalShares: number;
  decisionsCompleted: number;
  stateBreakdown: Record<string, number>;
  dailyVisits: { date: string; count: number }[];
  completionRate: number;
}

export default function Analytics() {
  const [, navigate] = useLocation();

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const stateNames: Record<string, string> = {
    NY: "New York",
    NJ: "New Jersey",
    PA: "Pennsylvania",
    CT: "Connecticut",
    TX: "Texas",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader maxWidth="max-w-6xl" isLoading />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Failed to load analytics</h2>
          <Button onClick={() => navigate("/")} data-testid="button-back-home">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const totalStateVisits = Object.values(analytics.stateBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader maxWidth="max-w-6xl" />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Visitors
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-visitors">
                {analytics.totalVisitors.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cards Shared
              </CardTitle>
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-shares">
                {analytics.totalShares.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ballots Completed
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-completed">
                {analytics.decisionsCompleted.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-rate">
                {analytics.completionRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Engagement by State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.stateBreakdown).length > 0 ? (
                  Object.entries(analytics.stateBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([state, count]) => {
                      const percentage = totalStateVisits > 0 
                        ? (count / totalStateVisits) * 100 
                        : 0;
                      return (
                        <div key={state} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Vote className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {stateNames[state] || state}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No state data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Daily Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.dailyVisits.length > 0 ? (
                  <div className="flex items-end justify-between h-40 gap-1">
                    {analytics.dailyVisits.slice(-14).map((day, index) => {
                      const maxCount = Math.max(...analytics.dailyVisits.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      const date = new Date(day.date);
                      const formattedDate = date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      return (
                        <div 
                          key={day.date} 
                          className="flex-1 flex flex-col items-center gap-1"
                          title={`${formattedDate}: ${day.count} visits`}
                        >
                          <div 
                            className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          {index % 3 === 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {date.getDate()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No activity data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                We The Potato is currently tracking voter engagement across{" "}
                <strong>5 pilot states</strong> for the 2026 primary elections.
              </p>
              <ul>
                <li>
                  <strong>{analytics.totalVisitors}</strong> unique visitors have used the app
                </li>
                <li>
                  <strong>{analytics.totalShares}</strong> voter cards have been created and shared
                </li>
                <li>
                  <strong>{analytics.completionRate.toFixed(1)}%</strong> of users who start 
                  reviewing their ballot complete the process
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

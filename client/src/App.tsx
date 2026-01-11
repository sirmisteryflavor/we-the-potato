import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AppHeader } from "@/components/app-header";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import HomeFeed from "@/pages/home-feed";
import Ballot from "@/pages/ballot";
import Profile from "@/pages/profile";
import VoterCard from "@/pages/voter-card";
import CardPage from "@/pages/card";
import Analytics from "@/pages/analytics";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import PublicProfile from "@/pages/public-profile";

const PAGES_WITHOUT_HEADER = [
  "/",
  "/onboarding",
  "/voter-card",
  "/card",
  "/admin",
  "/analytics",
];

function shouldShowHeader(fullPath: string): boolean {
  const path = fullPath.split("?")[0];
  return !PAGES_WITHOUT_HEADER.some(p => 
    path === p || path.startsWith(`${p}/`)
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const showHeader = shouldShowHeader(location);
  
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppHeader />}
      {children}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/home" component={HomeFeed} />
      <Route path="/ballot" component={Ballot} />
      <Route path="/profile" component={Profile} />
      <Route path="/voter-card" component={VoterCard} />
      <Route path="/voter-card/:cardId/edit" component={VoterCard} />
      <Route path="/card/:id" component={CardPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={Admin} />
      <Route path="/:username" component={PublicProfile} />
      <Route path="/:username/:cardId" component={CardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

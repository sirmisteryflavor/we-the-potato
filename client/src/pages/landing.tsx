import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { isOnboardingComplete } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { loginWithReturn } from "@/lib/utils";
import { Vote, ArrowRight, LogIn, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Landing() {
  const [, navigate] = useLocation();
  const hasCompleted = isOnboardingComplete();
  const { user, isLoading, isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    // Non-authenticated users always start fresh with onboarding
    if (!isAuthenticated) {
      navigate("/onboarding");
      return;
    }
    // Authenticated users go to home if onboarding complete, otherwise onboarding
    if (hasCompleted) {
      navigate("/home");
    } else {
      navigate("/onboarding");
    }
  };

  const handleLogin = () => {
    loginWithReturn("/home");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-1">
          <NavMenu />
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
          <ThemeToggle />
          {isLoading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              data-testid="button-profile"
            >
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleLogin}
              data-testid="button-login"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="flex items-center gap-3 mb-8">
          <Vote className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
          <h1 
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            data-testid="text-hero-title"
          >
            We The Potato
          </h1>
        </div>

        {isAuthenticated && user && (
          <p className="text-base text-primary mb-4" data-testid="text-welcome">
            Welcome back{user.firstName ? `, ${user.firstName}` : ""}!
          </p>
        )}

        <p className="text-lg text-muted-foreground mb-10 text-center max-w-md">
          Know your ballot. Make your choice. Share your voice.
        </p>

        <Button 
          size="lg" 
          onClick={handleGetStarted}
          className="h-14 px-10 text-lg rounded-full"
          data-testid="button-get-started-hero"
        >
          {isAuthenticated 
            ? (hasCompleted ? "View Elections" : "Get Started")
            : "Sign Up"
          }
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-sm text-muted-foreground mt-8">
          2026 Primaries: NY, NJ, PA, CT, TX
        </p>
      </main>

      <footer className="p-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Non-partisan. Privacy-first.</span>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/analytics")}
            className="hover:text-foreground transition-colors"
            data-testid="link-analytics"
          >
            Analytics
          </button>
          <button 
            onClick={() => navigate("/admin")}
            className="hover:text-foreground transition-colors"
            data-testid="link-admin"
          >
            Admin
          </button>
        </div>
      </footer>
    </div>
  );
}

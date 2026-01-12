"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { isOnboardingComplete } from "@/lib/storage";
import { Vote, ArrowRight } from "lucide-react";

export default function LandingClient() {
  const router = useRouter();
  const hasCompleted = isOnboardingComplete();

  const handleGetStarted = () => {
    if (hasCompleted) {
      router.push("/home");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-1">
          <NavMenu />
          <div
            className="flex items-center gap-2 cursor-pointer ml-1"
            onClick={() => router.push("/")}
            data-testid="link-home-logo"
          >
            <Vote className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:block">We The Potato</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
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

        <p className="text-lg text-muted-foreground mb-10 text-center max-w-md">
          Know your ballot. Make your choice. Share your voice.
        </p>

        <Button
          size="lg"
          onClick={handleGetStarted}
          className="h-14 px-10 text-lg rounded-full"
          data-testid="button-get-started-hero"
        >
          {hasCompleted ? "View Elections" : "Get Started"}
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
            onClick={() => router.push("/analytics")}
            className="hover:text-foreground transition-colors"
            data-testid="link-analytics"
          >
            Analytics
          </button>
          <button
            onClick={() => router.push("/admin")}
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

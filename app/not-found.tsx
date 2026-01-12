"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Vote, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Vote className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <div className="flex flex-col gap-3">
        <Button asChild>
          <Link href="/home">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            Get Started
          </Link>
        </Button>
      </div>
    </div>
  );
}

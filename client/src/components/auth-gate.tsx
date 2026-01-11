import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loginWithReturn } from "@/lib/utils";
import { Vote, LogIn, Shield, Share2, Smartphone, ArrowLeft } from "lucide-react";

interface AuthGateProps {
  feature: "voter-card" | "sync" | "profile";
  onBack?: () => void;
  backLabel?: string;
}

const featureContent = {
  "voter-card": {
    icon: Share2,
    title: "Create Your Voter Card",
    description: "Sign in to create shareable voter cards that show your ballot decisions.",
    benefits: [
      "Create beautiful, shareable voter cards",
      "Share your decisions with friends and family",
      "Access your cards from any device",
      "Keep a record of your voting history"
    ]
  },
  "sync": {
    icon: Smartphone,
    title: "Sync Across Devices",
    description: "Sign in to save your decisions and access them from any device.",
    benefits: [
      "Never lose your ballot research",
      "Continue where you left off on any device",
      "Securely backed up to the cloud",
      "Quick sign in with Google"
    ]
  },
  "profile": {
    icon: Shield,
    title: "Your Account",
    description: "Sign in to manage your account and preferences.",
    benefits: [
      "Save your location and preferences",
      "Sync across all your devices",
      "Manage notification subscriptions",
      "Access your complete voting history"
    ]
  }
};

export function AuthGate({ feature, onBack, backLabel = "Go Back" }: AuthGateProps) {
  const content = featureContent[feature];
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              data-testid="button-auth-gate-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Vote className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">We The Potato</span>
          </div>
          {onBack && <div className="w-9 shrink-0" />}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-auth-gate-title">
              {content.title}
            </h1>
            <p className="text-muted-foreground">
              {content.description}
            </p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              {content.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm">{benefit}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-3 pt-2">
            <Button 
              className="w-full h-12"
              onClick={() => loginWithReturn()}
              data-testid="button-auth-gate-login"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign In to Continue
            </Button>
            
            {onBack && (
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={onBack}
                data-testid="button-auth-gate-back-secondary"
              >
                {backLabel}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            We use secure authentication. Your data is protected and never shared.
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressDots } from "@/components/progress-dots";
import { IssueRanker } from "@/components/issue-ranker";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { saveOnboardingData, setOnboardingComplete, getOnboardingData } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Vote, MapPin, ArrowRight, ArrowLeft, Sparkles, Check, Loader2, ListOrdered } from "lucide-react";
import type { SupportedState, IssueCategory } from "@/lib/schema";
import { ISSUE_CATEGORIES } from "@/lib/schema";

const BASE_STEPS = 4;

interface ZipLookupResult {
  state: string;
  county: string;
  supported: boolean;
  error?: string;
}

interface BallotRace {
  id: string;
  electionYear: number;
  state: string;
  raceType: string;
  office: string;
  position?: string;
  isPrimary: boolean;
  primaryType?: string;
  description?: string;
  candidates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    party: string;
    incumbentStatus?: string;
    photoUrl?: string | null;
    websiteUrl?: string | null;
    bio?: string | null;
  }>;
}

export default function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const editStep = searchParams?.get("edit") ?? null;
  const isEditMode = !!editStep;
  const [isHydrated, setIsHydrated] = useState(false);

  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ state: string; county: string } | null>(null);
  const [races, setRaces] = useState<BallotRace[]>([]);
  const [isLoadingRaces, setIsLoadingRaces] = useState(false);
  const [issueRanking, setIssueRanking] = useState<IssueCategory[]>([...ISSUE_CATEGORIES]);
  const TOTAL_STEPS = BASE_STEPS;

  useEffect(() => {
    setIsHydrated(true);

    if (isEditMode) {
      const existingData = getOnboardingData();
      if (existingData) {
        if (existingData.zipCode) setZipCode(existingData.zipCode);
        if (existingData.state && existingData.county) {
          setDetectedLocation({ state: existingData.state, county: existingData.county });
        }
        if (existingData.issueRanking) setIssueRanking(existingData.issueRanking as IssueCategory[]);
      }

      if (editStep === "location") setStep(2);
      else if (editStep === "races") setStep(3);
      else if (editStep === "issues") setStep(4);
    }
  }, [editStep, isEditMode]);

  const loadRaces = async (zip: string) => {
    setIsLoadingRaces(true);
    try {
      const response = await fetch(`/api/ballot/${zip}`);
      const data = await response.json();
      setRaces(data.races || []);
    } catch (error) {
      console.error("Failed to load races:", error);
      setRaces([]);
    } finally {
      setIsLoadingRaces(false);
    }
  };

  const validateZipCode = async (zip: string) => {
    if (!/^\d{5}$/.test(zip)) {
      setZipError("Please enter a 5-digit ZIP code");
      setDetectedLocation(null);
      return false;
    }

    setIsValidating(true);
    try {
      const response = await fetch(`/api/lookup-zip/${zip}`);
      const data: ZipLookupResult = await response.json();

      if (!response.ok || !data.supported) {
        const errorMessage = data.error ||
          `Sorry, ${data.state || 'this area'} is not in our pilot program yet. We support NY, NJ, PA, CT, and TX.`;
        setZipError(errorMessage);
        setDetectedLocation(null);
        return false;
      }

      setZipError("");
      setDetectedLocation({ state: data.state, county: data.county });

      // Load races data after location is detected
      await loadRaces(zip);

      return true;
    } catch {
      setZipError("Unable to verify ZIP code. Please try again.");
      setDetectedLocation(null);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleZipChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 5);
    setZipCode(cleaned);
    if (cleaned.length === 5) {
      validateZipCode(cleaned);
    } else {
      setZipError("");
      setDetectedLocation(null);
    }
  };


  const handleNext = async () => {
    if (step === 2) {
      if (!detectedLocation) {
        toast({
          title: "Please enter your ZIP code",
          description: "We need your location to show you relevant ballot information.",
          variant: "destructive",
        });
        return;
      }
      if (isEditMode) {
        saveAndReturn();
        return;
      }
    }

    if ((step === 3 || step === 4) && isEditMode) {
      saveAndReturn();
      return;
    }

    // On final step, complete onboarding
    if (step === TOTAL_STEPS) {
      completeOnboarding();
      return;
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    if (isEditMode) {
      router.push("/profile");
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const saveAndReturn = () => {
    const existingData = getOnboardingData();
    saveOnboardingData({
      zipCode: zipCode || existingData?.zipCode || "",
      state: (detectedLocation?.state || existingData?.state || "NY") as SupportedState,
      county: detectedLocation?.county || existingData?.county,
      issueRanking: issueRanking || existingData?.issueRanking || [],
    });
    toast({
      title: "Changes saved",
      description: "Your profile has been updated.",
    });
    router.push("/profile");
  };

  const completeOnboarding = () => {
    saveOnboardingData({
      zipCode,
      state: detectedLocation!.state as SupportedState,
      county: detectedLocation?.county,
      issueRanking,
    });
    setOnboardingComplete(true);
    router.push("/home");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
              <Vote className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-welcome-title">
              Make your voice heard
            </h1>
            <p className="text-lg text-muted-foreground max-w-sm mb-8">
              Get informed about your local elections, save your choices, and share with friends.
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI-simplified ballots</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                <span>Track decisions</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-location-title">
                Where do you vote?
              </h2>
              <p className="text-muted-foreground">
                We'll show you the ballot for your area
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="zipcode" className="text-sm font-medium">
                  ZIP Code
                </Label>
                <div className="relative">
                  <Input
                    id="zipcode"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter your 5-digit ZIP"
                    value={zipCode}
                    onChange={(e) => handleZipChange(e.target.value)}
                    className={cn(
                      "text-center text-2xl font-semibold tracking-widest h-14 mt-2",
                      zipError && "border-destructive"
                    )}
                    maxLength={5}
                    data-testid="input-zipcode"
                    autoFocus
                    disabled={isValidating}
                  />
                  {isValidating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 mt-1">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {zipError && (
                  <p className="text-sm text-destructive mt-2" data-testid="text-zip-error">
                    {zipError}
                  </p>
                )}
              </div>

              {detectedLocation && (
                <div
                  className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20"
                  data-testid="location-detected"
                >
                  <Check className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <p className="font-medium text-success">Location found</p>
                    <p className="text-sm text-muted-foreground">
                      {detectedLocation.county} County, {detectedLocation.state}
                    </p>
                  </div>
                </div>
              )}

              {!detectedLocation && !zipError && (
                <div className="text-center text-sm text-muted-foreground" data-testid="text-demo-hint">
                  <p className="mb-2">Demo ZIP codes you can try:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleZipChange("10001")}
                      className="px-3 py-1 bg-muted rounded-full hover-elevate"
                      data-testid="button-demo-ny"
                    >
                      10001 (NY)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZipChange("07101")}
                      className="px-3 py-1 bg-muted rounded-full hover-elevate"
                      data-testid="button-demo-nj"
                    >
                      07101 (NJ)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZipChange("19101")}
                      className="px-3 py-1 bg-muted rounded-full hover-elevate"
                      data-testid="button-demo-pa"
                    >
                      19101 (PA)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZipChange("75201")}
                      className="px-3 py-1 bg-muted rounded-full hover-elevate"
                      data-testid="button-demo-tx"
                    >
                      75201 (TX)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZipChange("06101")}
                      className="px-3 py-1 bg-muted rounded-full hover-elevate"
                      data-testid="button-demo-ct"
                    >
                      06101 (CT)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Vote className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Your Ballot Preview</h2>
              <p className="text-muted-foreground">
                {detectedLocation && `Here are some of the races in ${detectedLocation.county} County, ${detectedLocation.state}`}
              </p>
            </div>

            {isLoadingRaces ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : races.length > 0 ? (
              <div className="space-y-6">
                {races.slice(0, 3).map((race) => (
                  <div key={race.id} className="space-y-3">
                    <h3 className="font-semibold text-lg">{race.office}</h3>
                    <div className="space-y-2">
                      {race.candidates.slice(0, 3).map((candidate) => (
                        <div
                          key={candidate.id}
                          className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {candidate.photoUrl && (
                              <img
                                src={candidate.photoUrl}
                                alt={`${candidate.firstName} ${candidate.lastName}`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {candidate.firstName} {candidate.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {candidate.party}
                                {candidate.incumbentStatus === "incumbent" && " • Incumbent"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No races found for your area. You'll see them on your home page.</p>
              </div>
            )}

            <p className="text-sm text-center text-muted-foreground">
              You'll see your complete ballot with more races and ballot measures on your home page
            </p>
          </div>
        );

      case 4:
        return (
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ListOrdered className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-preferences-title">
                What matters most?
              </h2>
              <p className="text-muted-foreground">
                Drag to rank issues from most to least important
              </p>
            </div>

            <IssueRanker
              ranking={issueRanking}
              onChange={setIssueRanking}
            />
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
          {step > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="ml-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        <ProgressDots total={TOTAL_STEPS} current={step} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 pb-8">
        {renderStep()}
      </main>

      <footer className="p-4 pb-8 space-y-3 max-w-sm mx-auto w-full">
        {step === 1 ? (
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full h-14 text-lg"
            data-testid="button-get-started"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              onClick={handleNext}
              className="w-full h-12"
              disabled={
                (step === 2 && !detectedLocation) ||
                isValidating
              }
              data-testid="button-continue"
            >
              {isValidating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isHydrated && (isEditMode ? "Save" : (step === TOTAL_STEPS ? "Complete Onboarding" : "Continue"))}
                  {!isHydrated && "Continue"}
                  {!isEditMode && <ArrowRight className="ml-2 h-5 w-5" />}
                </>
              )}
            </Button>

            {isEditMode && (
              <Button
                variant="ghost"
                onClick={() => router.push("/profile")}
                className="w-full text-muted-foreground"
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

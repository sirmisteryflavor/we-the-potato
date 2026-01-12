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
import { Vote, MapPin, ArrowRight, ArrowLeft, SkipForward, Sparkles, Mail, Check, Loader2, ListOrdered, AtSign, X } from "lucide-react";
import type { SupportedState, IssueCategory } from "@/lib/schema";
import { ISSUE_CATEGORIES } from "@/lib/schema";

const BASE_STEPS = 4;

interface ZipLookupResult {
  state: string;
  county: string;
  supported: boolean;
  error?: string;
}

export default function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const editStep = searchParams.get("edit");
  const isEditMode = !!editStep;

  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ state: string; county: string } | null>(null);
  const [issueRanking, setIssueRanking] = useState<IssueCategory[]>([...ISSUE_CATEGORIES]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const needsUsername = false;
  const TOTAL_STEPS = BASE_STEPS;

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
        const data = await response.json();
        setIsUsernameAvailable(data.available);
        setUsernameError(data.error || null);
      } catch {
        setUsernameError("Failed to check username");
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set username",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const existingData = getOnboardingData();
      if (existingData) {
        if (existingData.zipCode) setZipCode(existingData.zipCode);
        if (existingData.state && existingData.county) {
          setDetectedLocation({ state: existingData.state, county: existingData.county });
        }
        if (existingData.issueRanking) setIssueRanking(existingData.issueRanking as IssueCategory[]);
        if (existingData.email) setEmail(existingData.email);
      }

      if (editStep === "location") setStep(2);
      else if (editStep === "issues") setStep(3);
      else if (editStep === "email") setStep(4);
    }
  }, [editStep, isEditMode]);

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

  const validateEmail = (emailValue: string) => {
    if (!emailValue) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
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

    if (step === 3 && isEditMode) {
      saveAndReturn();
      return;
    }

    if (step === 4) {
      if (email && !validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      if (isEditMode) {
        saveAndReturn();
        return;
      }
      if (needsUsername) {
        setStep(5);
        return;
      }
      completeOnboarding();
      return;
    }

    if (step === 5) {
      const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);
      if (!isUsernameAvailable || username.length < 3 || !isValidFormat) {
        toast({
          title: "Please choose a valid username",
          description: "Your username must be at least 3 characters, start with a letter, and be available.",
          variant: "destructive",
        });
        return;
      }
      try {
        await setUsernameMutation.mutateAsync(username);
        completeOnboarding();
      } catch {
      }
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

  const handleSkip = () => {
    if (step === 3) {
      if (isEditMode) {
        router.push("/profile");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (isEditMode) {
        router.push("/profile");
        return;
      }
      if (needsUsername) {
        setStep(5);
      } else {
        completeOnboarding();
      }
    } else if (step === 5) {
      completeOnboarding();
    }
  };

  const saveAndReturn = () => {
    const existingData = getOnboardingData();
    saveOnboardingData({
      zipCode: zipCode || existingData?.zipCode || "",
      state: (detectedLocation?.state || existingData?.state || "NY") as SupportedState,
      county: detectedLocation?.county || existingData?.county,
      issueRanking: issueRanking || existingData?.issueRanking || [],
      email: email || existingData?.email || undefined,
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
      email: email || undefined,
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

      case 4:
        return (
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-account-title">
                Save your progress
              </h2>
              <p className="text-muted-foreground">
                Enter your email to sync across devices (optional)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={cn("h-12 mt-2", emailError && "border-destructive")}
                  data-testid="input-email"
                />
                {emailError && (
                  <p className="text-sm text-destructive mt-2" data-testid="text-email-error">
                    {emailError}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                We'll only use this to save your choices and send election reminders.
              </p>
            </div>
          </div>
        );

      case 5:
        const isValidUsernameFormat = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);
        return (
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <AtSign className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-username-title">
                Choose your username
              </h2>
              <p className="text-muted-foreground">
                This will be part of your shareable profile link
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className={cn("h-12 mt-2 pr-10", usernameError && "border-destructive")}
                    data-testid="input-onboarding-username"
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
                    {isCheckingUsername && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    {!isCheckingUsername && isUsernameAvailable === true && <Check className="h-5 w-5 text-green-500" />}
                    {!isCheckingUsername && isUsernameAvailable === false && <X className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-sm text-destructive mt-2">{usernameError}</p>
                )}
                {!usernameError && username.length > 0 && username.length < 3 && (
                  <p className="text-sm text-muted-foreground mt-2">Username must be at least 3 characters</p>
                )}
                {!usernameError && username.length >= 3 && !isValidUsernameFormat && (
                  <p className="text-sm text-destructive mt-2">Username must start with a letter and only contain letters, numbers, and underscores</p>
                )}
                {isUsernameAvailable === true && (
                  <p className="text-sm text-green-600 mt-2">Username is available</p>
                )}
                {isUsernameAvailable === false && !usernameError && (
                  <p className="text-sm text-destructive mt-2">Username is already taken</p>
                )}
              </div>

              <div className="text-sm text-muted-foreground text-center p-3 bg-muted/50 rounded-lg">
                Your profile will be at: <span className="font-mono font-medium">wethepotato.com/{username || "yourname"}</span>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your username cannot be changed later.
              </p>
            </div>
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
                isValidating ||
                (step === 5 && (
                  !isUsernameAvailable ||
                  username.length < 3 ||
                  !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username) ||
                  setUsernameMutation.isPending
                ))
              }
              data-testid="button-continue"
            >
              {isValidating || setUsernameMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isEditMode ? "Save" : (step === TOTAL_STEPS ? "View Elections" : "Continue")}
                  {!isEditMode && <ArrowRight className="ml-2 h-5 w-5" />}
                </>
              )}
            </Button>

            {(step === 3 || step === 4 || step === 5) && !isEditMode && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-muted-foreground"
                data-testid="button-skip"
                disabled={setUsernameMutation.isPending}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                {step === 5 ? "Skip for now" : step === 4 ? "Continue as guest" : "Skip for now"}
              </Button>
            )}

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

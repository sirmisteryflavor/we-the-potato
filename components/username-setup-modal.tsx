"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsernameSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export function UsernameSetupModal({ open, onComplete }: UsernameSetupModalProps) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const response = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
        const data = await response.json();
        setIsAvailable(data.available);
        setError(data.error || null);
      } catch {
        setError("Failed to check username");
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const setUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/user/username", { username });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Username set!",
        description: "Your username has been saved and is now part of your profile.",
      });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set username",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAvailable && username.length >= 3) {
      setUsernameMutation.mutate(username);
    }
  };

  const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>
            Pick a unique username for your profile. This will be used in your shareable voter card links and cannot be changed later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="yourname"
                className="pr-10"
                maxLength={20}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                {!isChecking && isAvailable === false && <X className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {!error && username.length > 0 && username.length < 3 && (
              <p className="text-sm text-muted-foreground">Username must be at least 3 characters</p>
            )}
            {!error && username.length >= 3 && !isValidFormat && (
              <p className="text-sm text-destructive">Username must start with a letter and only contain letters, numbers, and underscores</p>
            )}
            {isAvailable === true && (
              <p className="text-sm text-green-600">Username is available</p>
            )}
            {isAvailable === false && !error && (
              <p className="text-sm text-destructive">Username is already taken</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Your profile will be at: <span className="font-mono">wethepotato.com/{username || "yourname"}</span>
          </div>
          <Button
            type="submit"
            data-testid="button-set-username"
            disabled={!isAvailable || username.length < 3 || setUsernameMutation.isPending}
            className="w-full"
          >
            {setUsernameMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting username...
              </>
            ) : (
              "Set Username"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoterCardPreview } from "@/components/voter-card-preview";
import { useToast } from "@/hooks/use-toast";
import { Download, Copy, Check, Share2, Link2 } from "lucide-react";
import { getShareUrl } from "@/lib/card-styles";
import type { VoterCardData } from "@/lib/schema";

export type AspectRatio = "9:16" | "1:1";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardData: VoterCardData | null;
  onDownload: (aspectRatio?: AspectRatio) => void;
  username?: string | null;
}

export function ShareModal({ open, onOpenChange, cardData, onDownload, username }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("9:16");
  const { toast } = useToast();
  
  if (!cardData) return null;

  const shareUrl = getShareUrl(cardData.id || '', username, cardData.shareUrl);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share it with your friends and family.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Voter Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-48">
              <VoterCardPreview data={cardData} username={username || undefined} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Your shareable link</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-sm font-mono"
                data-testid="input-share-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                data-testid="button-copy-link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view your full voter card
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Download for social media</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedAspectRatio("9:16")}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedAspectRatio === "9:16" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
                data-testid="button-aspect-9-16"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 bg-muted rounded border" />
                  <div>
                    <p className="text-sm font-medium">Story</p>
                    <p className="text-xs text-muted-foreground">9:16 vertical</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedAspectRatio("1:1")}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedAspectRatio === "1:1" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
                data-testid="button-aspect-1-1"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-muted rounded border" />
                  <div>
                    <p className="text-sm font-medium">Feed Post</p>
                    <p className="text-xs text-muted-foreground">1:1 square</p>
                  </div>
                </div>
              </button>
            </div>
            <Button
              variant="default"
              className="w-full"
              onClick={() => onDownload(selectedAspectRatio)}
              data-testid="button-download-card"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Save the image and upload it to Instagram, TikTok, or any social platform
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

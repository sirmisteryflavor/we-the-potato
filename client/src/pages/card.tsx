import { useState, useRef, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useLocation, useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VoterCardPreview } from "@/components/voter-card-preview";
import { DownloadableVoterCard } from "@/components/downloadable-voter-card";
import { ShareModal } from "@/components/share-modal";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, 
  Edit2, 
  Sparkles,
  Vote,
  Home
} from "lucide-react";
import type { CardTemplate, VoterCardData, VoterCardDecision } from "@shared/schema";
import { sortDecisions, loginWithReturn } from "@/lib/utils";
import { getShareUrl } from "@/lib/card-styles";

interface FinalizedVoterCard {
  id: string;
  userId: string | null;
  eventId: string;
  ballotId: string | null;
  template: CardTemplate;
  location: string;
  electionDate: string;
  electionType: string;
  decisions: VoterCardDecision[];
  showNotes: boolean;
  shareUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function FinalCardPage() {
  const [, navigate] = useLocation();
  const [matchCardRoute, paramsCardRoute] = useRoute("/card/:id");
  const [matchUserCard, paramsUserCard] = useRoute("/:username/:cardId");
  const search = useSearch();
  const cardRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const cardId = matchCardRoute ? paramsCardRoute?.id : paramsUserCard?.cardId;
  // Only use username from URL when we're on the /:username/:cardId route, not /card/:id
  const usernameFromUrl = matchCardRoute ? undefined : paramsUserCard?.username;
  
  const { fromParam, eventIdParam } = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return {
      fromParam: searchParams.get("from"),
      eventIdParam: searchParams.get("eventId")
    };
  }, [search]);
  
  const getBackDestination = (isOwner: boolean) => {
    switch (fromParam) {
      case "profile":
        return "/profile?tab=votes";
      case "home":
        return "/home";
      case "ballot":
        return eventIdParam ? `/ballot?eventId=${eventIdParam}` : "/ballot";
      case "edit":
      case "create":
        return "/profile?tab=votes";
      default:
        return isOwner ? "/profile?tab=votes" : "/";
    }
  };

  const { data: card, isLoading } = useQuery<FinalizedVoterCard>({
    queryKey: usernameFromUrl 
      ? ["/api/users", usernameFromUrl, "cards", cardId]
      : ["/api/finalized-card", cardId],
    queryFn: async () => {
      const url = usernameFromUrl 
        ? `/api/users/${usernameFromUrl}/cards/${cardId}`
        : `/api/finalized-card/${cardId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch card");
      return res.json();
    },
    enabled: !!cardId,
  });

  const cardOwnerUsername = usernameFromUrl || user?.username;

  const cardData: VoterCardData = useMemo(() => {
    if (!card) {
      return {
        id: cardId || "",
        template: "bold",
        location: "",
        electionDate: "",
        electionType: "",
        decisions: [],
      };
    }

    const filteredDecisions = sortDecisions(
      card.decisions
        .filter(d => !d.hidden)
        .map(d => ({
          ...d,
          note: card.showNotes ? d.note : undefined,
        }))
    );

    const stateMatch = card.location.match(/,\s*([A-Z]{2})$/);
    const stateCode = stateMatch ? stateMatch[1] : "";

    return {
      id: card.id,
      template: card.template,
      location: card.location,
      state: stateCode,
      electionDate: card.electionDate,
      electionType: card.electionType,
      decisions: filteredDecisions,
    };
  }, [card, cardId]);

  const isOwner = !authLoading && isAuthenticated && user && card?.userId && user.id && String(card.userId) === String(user.id);
  const isViewer = !authLoading && !isOwner && card;

  useEffect(() => {
    if (isOwner && card && !hasCelebrated && !isLoading) {
      setHasCelebrated(true);
      const duration = 2000;
      const end = Date.now() + duration;
      
      const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [isOwner, card, hasCelebrated, isLoading]);

  const handleDownload = async (aspectRatio: "9:16" | "1:1" = "9:16") => {
    if (!cardData) return;

    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      
      const width = aspectRatio === "1:1" ? 1080 : 1080;
      const height = aspectRatio === "1:1" ? 1080 : 1920;
      
      container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.overflow = "hidden";
      container.style.zIndex = "-1";
      container.style.opacity = "1";
      container.style.pointerEvents = "none";
      
      document.body.appendChild(container);
      
      const shareUrl = getShareUrl(cardId || '', cardOwnerUsername, card?.shareUrl);
      
      root = createRoot(container);
      flushSync(() => {
        root!.render(
          <DownloadableVoterCard 
            data={cardData} 
            aspectRatio={aspectRatio}
            shareUrl={shareUrl}
            username={cardOwnerUsername}
          />
        );
      });
      
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(container, {
        width,
        height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png", 1.0);

      const link = document.createElement("a");
      const aspectSuffix = aspectRatio === "1:1" ? "square" : "story";
      link.download = `voter-card-${aspectSuffix}-${card?.electionDate?.replace(/\s/g, "-") || "download"}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Card downloaded!",
        description: aspectRatio === "1:1" 
          ? "Perfect for your feed posts!"
          : "Share it on Instagram Stories or TikTok!",
        duration: 5000,
      });
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download failed",
        description: "Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      if (root) {
        try { root.unmount(); } catch {}
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader maxWidth="max-w-lg" isLoading />
        <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-md" />
        </main>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center px-4 text-white">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <Vote className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Card Not Found</h1>
        <p className="text-white/80 text-center mb-8 max-w-xs">
          We couldn't find this voter card. It may have been removed or the link is incorrect.
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate("/")}
            className="bg-white text-indigo-600 hover:bg-white/90 h-10 px-6 font-semibold"
            data-testid="button-create-card"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Create Your Own Card
          </Button>
          {isAuthenticated && (
            <Button 
              variant="ghost"
              onClick={() => navigate("/home")}
              className="text-white/80 hover:text-white hover:bg-white/10"
              data-testid="button-go-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          )}
        </div>
      </div>
    );
  }

  const editUrl = fromParam 
    ? `/voter-card/${card.id}/edit?from=${fromParam}${eventIdParam ? `&eventId=${eventIdParam}` : ''}`
    : `/voter-card/${card.id}/edit?from=profile`;

  const ownerActionButtons = (
    <div className="flex justify-center gap-2 w-full max-w-xs mx-auto">
      <Button 
        variant="ghost"
        size="sm"
        onClick={() => navigate(editUrl)}
        className="flex-1 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 h-8 px-3 text-xs"
        data-testid="button-edit-card"
      >
        <Edit2 className="mr-1.5 h-3 w-3" />
        Edit
      </Button>
      <Button 
        variant="ghost"
        size="sm"
        onClick={() => setShareModalOpen(true)} 
        className="flex-1 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 h-8 px-3 text-xs"
        data-testid="button-share-card"
      >
        <Share2 className="mr-1.5 h-3 w-3" />
        Share
      </Button>
    </div>
  );

  const viewerActionButtons = (
    <div className="flex flex-col items-center gap-3">
      <Button 
        onClick={() => navigate("/")}
        className="bg-white text-indigo-600 hover:bg-white/90 h-10 px-6 font-semibold shadow-lg"
        data-testid="button-create-own-card"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Create Your Own Card
      </Button>
      <p className="text-white/60 text-xs">
        Made with We The Potato
      </p>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <VoterCardPreview 
        ref={cardRef} 
        data={cardData} 
        fullScreen 
        actionButtons={isOwner ? ownerActionButtons : viewerActionButtons}
        username={cardOwnerUsername || undefined}
      />
      
      <AppHeader 
        showBackButton 
        onBack={() => navigate(getBackDestination(!!isOwner))}
        backIcon={isOwner ? "arrow" : "close"}
        variant="dark"
        maxWidth="max-w-2xl"
        fixed
      />

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        cardData={cardData}
        onDownload={handleDownload}
        username={cardOwnerUsername}
      />
    </div>
  );
}

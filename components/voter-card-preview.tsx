"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Vote, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { VoterCardData } from "@/lib/schema";
import {
  templatesTailwind,
  getElectionTitle,
  getElectionLevel,
  getElectionTypeBadge,
  getDisplayValues,
  getValueColorTailwind,
  MAX_DECISIONS,
} from "@/lib/card-styles";

export type AspectRatio = "9:16" | "1:1";

interface VoterCardPreviewProps {
  data: VoterCardData;
  className?: string;
  fullScreen?: boolean;
  actionButtons?: React.ReactNode;
  aspectRatio?: AspectRatio;
  username?: string;
}

export const VoterCardPreview = forwardRef<HTMLDivElement, VoterCardPreviewProps>(
  ({ data, className, fullScreen = false, actionButtons, aspectRatio = "9:16", username }, ref) => {
    const cardTitle = username ? `${username}'s Voter Card` : "My Voting Decisions";
    const [selectedDecision, setSelectedDecision] = useState<{
      label: string;
      type: string;
      description?: string;
    } | null>(null);

    const style = templatesTailwind[data.template];
    const visibleDecisions = data.decisions.filter(d => !d.hidden);

    const electionTitle = getElectionTitle(data.electionDate, data.electionType, data.state);
    const electionLevel = getElectionLevel(data.electionType);
    const electionTypeBadge = getElectionTypeBadge(data.electionType);

    const getValueColor = (decision: string) => getValueColorTailwind(decision, style.text);

    const handleInfoClick = (label: string, type: string, description?: string) => {
      setSelectedDecision({ label, type, description });
    };

    if (fullScreen) {
      return (
        <>
          <div
            ref={ref}
            className={cn(
              "min-h-screen flex flex-col relative overflow-hidden",
              style.background,
              className
            )}
            data-testid="voter-card-fullscreen"
          >
            {data.template === "bold" && (
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
              </div>
            )}

            {data.template === "professional" && (
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
              </div>
            )}

            <div className="relative z-10 flex flex-col flex-1 px-5 pt-16 pb-8 max-w-md mx-auto w-full">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Vote className={cn("h-6 w-6", data.template === "minimal" ? "text-primary" : "text-white")} />
                </div>
                <h1 className={cn("text-xl font-bold leading-tight", style.text)} data-testid="text-election-title">
                  {electionTitle}
                </h1>
                
                <div className="flex justify-center gap-2 mt-3" data-testid="badges-container">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", style.badgeBg, style.badgeText)} data-testid="badge-election-level">
                    {electionLevel}
                  </span>
                  {electionTypeBadge && (
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium", style.badgeBg, style.badgeText)} data-testid="badge-election-type">
                      {electionTypeBadge}
                    </span>
                  )}
                </div>
                
                <p className={cn("text-xs mt-3 font-medium", style.accent)}>{cardTitle}</p>
                
                {actionButtons && (
                  <div className="mt-3">
                    {actionButtons}
                  </div>
                )}
              </div>

              <div className="flex-1">
                {visibleDecisions.map((item, index) => {
                  const { label, value, description } = getDisplayValues(item);
                  return (
                    <div
                      key={index}
                      className={cn("py-3 border-b", style.divider, index === visibleDecisions.length - 1 && "border-b-0")}
                      data-testid={`decision-row-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInfoClick(label, item.type, description)}
                          className={cn(
                            "shrink-0 p-1 -ml-1 rounded-full transition-colors",
                            data.template === "minimal" 
                              ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100" 
                              : "text-white/50 hover:text-white hover:bg-white/10"
                          )}
                          data-testid={`button-info-${index}`}
                          aria-label={`More info about ${label}`}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <span className={cn("flex-1 text-sm font-medium", style.text)}>
                            {label}
                          </span>
                          <span className={cn("text-sm shrink-0 font-semibold text-right", getValueColor(value))}>
                            {value}
                          </span>
                        </div>
                      </div>
                      {item.note && (
                        <p className="text-xs mt-1.5 leading-relaxed text-gray-400 dark:text-gray-500 pl-[0px] pr-[0px]">
                          {item.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={cn("mt-4 pt-4 border-t text-center", style.divider)}>
                <a 
                  href="/" 
                  className={cn("text-xs hover:underline", style.accent)}
                  data-testid="link-create-your-own"
                >
                  Create your own at wethepotato.com
                </a>
              </div>
            </div>
          </div>
          <Sheet open={!!selectedDecision} onOpenChange={(open) => !open && setSelectedDecision(null)}>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] [&>button]:hidden">
              <SheetHeader className="text-left">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg">{selectedDecision?.label}</SheetTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setSelectedDecision(null)}
                    data-testid="button-close-info-sheet"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {selectedDecision?.type === "candidate" ? "Office" : "Ballot Measure"}
                </Badge>
              </SheetHeader>
              <SheetDescription asChild>
                <div className="mt-4 text-sm text-foreground leading-relaxed">
                  {selectedDecision?.description || "No additional information available for this item."}
                </div>
              </SheetDescription>
            </SheetContent>
          </Sheet>
        </>
      );
    }

    const maxDecisions = aspectRatio === "1:1" ? MAX_DECISIONS.square : MAX_DECISIONS.story;
    const hasExplicitSize = className?.includes("w-full") || className?.includes("h-full");
    const aspectClass = hasExplicitSize ? "" : (aspectRatio === "1:1" ? "aspect-square" : "aspect-[9/16]");
    
    return (
      <div
        ref={ref}
        className={cn(
          aspectClass,
          "rounded-2xl p-4 flex flex-col relative overflow-hidden",
          style.background,
          style.border,
          className
        )}
        data-testid="voter-card-preview"
      >
        {data.template === "bold" && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
          </div>
        )}

        {data.template === "professional" && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
          </div>
        )}

        <div className="relative z-10 flex flex-col h-full">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Vote className={cn("h-4 w-4", data.template === "minimal" ? "text-primary" : "text-white")} />
            </div>
            <h2 className={cn("text-sm font-bold leading-tight", style.text)}>
              {electionTitle}
            </h2>
            <div className="flex justify-center gap-1.5 mt-1.5">
              <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-medium", style.badgeBg, style.badgeText)}>
                {electionLevel}
              </span>
              {electionTypeBadge && (
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-medium", style.badgeBg, style.badgeText)}>
                  {electionTypeBadge}
                </span>
              )}
            </div>
            <p className={cn("text-[9px] mt-1.5 font-medium", style.accent)}>{cardTitle}</p>
          </div>

          <div className="flex-1 overflow-hidden">
            {visibleDecisions.slice(0, maxDecisions).map((item, index) => {
              const { label, value } = getDisplayValues(item);
              return (
                <div
                  key={index}
                  className={cn("py-1.5 border-b", style.divider, index === Math.min(visibleDecisions.length - 1, maxDecisions - 1) && "border-b-0")}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className={cn("flex-1 text-[11px] font-medium", style.text)}>
                      {label}
                    </span>
                    <span className={cn("text-[10px] shrink-0 font-semibold text-right max-w-[45%]", getValueColor(value))}>
                      {value}
                    </span>
                  </div>
                  {item.note && aspectRatio !== "1:1" && (
                    <p className={cn("text-[9px] mt-0.5 leading-tight line-clamp-2", style.notesText)}>
                      {item.note}
                    </p>
                  )}
                </div>
              );
            })}
            {visibleDecisions.length > maxDecisions && (
              <p className={cn("text-[10px] text-center pt-1", style.accent)}>
                +{visibleDecisions.length - maxDecisions} more
              </p>
            )}
          </div>

          <div className={cn("mt-2 pt-2 border-t text-center", style.divider)}>
            <p className={cn("text-[9px]", style.accent)}>
              wethepotato.com
            </p>
          </div>
        </div>
      </div>
    );
  }
);

VoterCardPreview.displayName = "VoterCardPreview";

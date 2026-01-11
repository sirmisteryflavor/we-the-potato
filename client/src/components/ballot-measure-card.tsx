import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DecisionButtons } from "@/components/decision-buttons";
import { KeywordTooltip } from "@/components/keyword-tooltip";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, Lightbulb, DollarSign, MessageSquare, Pencil, Check, X } from "lucide-react";
import type { BallotMeasure, DecisionOption, MeasureDecision } from "@shared/schema";

interface BallotMeasureCardProps {
  measure: BallotMeasure;
  decision: MeasureDecision | null;
  onDecisionChange: (measureId: string, decision: MeasureDecision) => void;
}

interface BallotMeasureCardInternalProps extends BallotMeasureCardProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showExpandToggle?: boolean;
}

export function BallotMeasureCard({ 
  measure, 
  decision, 
  onDecisionChange,
  isExpanded = true,
  onToggleExpand,
  showExpandToggle = false
}: BallotMeasureCardInternalProps) {
  const [showNote, setShowNote] = useState(!!decision?.note);
  const [note, setNote] = useState(decision?.note || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");

  useEffect(() => {
    setNote(decision?.note || "");
  }, [decision?.note]);

  const handleDecisionChange = (newDecision: DecisionOption) => {
    onDecisionChange(measure.id, {
      decision: newDecision,
      note: note || undefined,
    });
  };

  const handleStartEditNote = () => {
    setTempNote(note);
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    setNote(tempNote);
    setIsEditingNote(false);
    if (decision) {
      onDecisionChange(measure.id, {
        ...decision,
        note: tempNote || undefined,
      });
    }
  };

  const handleCancelEdit = () => {
    setTempNote("");
    setIsEditingNote(false);
  };

  const categoryColors: Record<string, string> = {
    environment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    economy: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    education: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    healthcare: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    public_safety: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <Card 
      className="overflow-visible"
      data-testid={`card-measure-${measure.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge 
            variant="secondary" 
            className="text-xs font-medium shrink-0"
            data-testid={`badge-measure-number-${measure.id}`}
          >
            {measure.number}
          </Badge>
          {measure.category && (
            <Badge 
              className={cn("text-xs capitalize", categoryColors[measure.category])}
              data-testid={`badge-measure-category-${measure.id}`}
            >
              {measure.category.replace("_", " ")}
            </Badge>
          )}
        </div>

        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          {/* Clickable header area for expand/collapse */}
          <div 
            className={cn(
              showExpandToggle && "cursor-pointer"
            )}
            onClick={() => {
              if (showExpandToggle && onToggleExpand) {
                onToggleExpand();
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 
                className="text-xl font-semibold leading-tight flex-1"
                data-testid={`text-measure-title-${measure.id}`}
              >
                {measure.title}
              </h3>
              {showExpandToggle && (
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 h-8 w-8"
                    data-testid={`button-expand-${measure.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>

            {/* Collapsed view - show official description and decision buttons */}
            {showExpandToggle && !isExpanded && (
              <div className="mt-3 space-y-3">
                {measure.originalText && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {measure.originalText}
                  </p>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  <DecisionButtons
                    value={decision?.decision || null}
                    onChange={handleDecisionChange}
                  />
                </div>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="mt-4 mb-5 space-y-4" data-testid={`content-measure-${measure.id}`}>
              {/* Official Description - prominent at top */}
              {measure.originalText && (
                <div className="p-4 bg-card rounded-lg border-2 border-foreground/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-foreground" />
                    <p className="text-sm font-semibold text-foreground">Official Description</p>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {measure.originalText}
                  </p>
                </div>
              )}

              {/* Simplified Explanation - below official */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-primary">What This Means</p>
                </div>
                <KeywordTooltip text={measure.summary.detailed} className="text-base" />
              </div>

              {measure.fiscalImpact && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Fiscal Impact</p>
                    <p className="text-sm text-muted-foreground">{measure.fiscalImpact}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {measure.supporters.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Who Supports This</p>
                    <ul className="space-y-1">
                      {measure.supporters.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {measure.opponents.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Who Opposes This</p>
                    <ul className="space-y-1">
                      {measure.opponents.map((o, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <DecisionButtons
              value={decision?.decision || null}
              onChange={handleDecisionChange}
              className="mb-3"
            />

            <div>
              <button
                type="button"
                onClick={() => {
                  setShowNote(!showNote);
                  if (!showNote && !note) {
                    setIsEditingNote(true);
                    setTempNote("");
                  }
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-toggle-note-${measure.id}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{note ? (showNote ? "Hide note" : "View note") : "Add a note"}</span>
                {showNote ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showNote && (
                <div className="mt-3">
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add your personal notes about this measure..."
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        className="min-h-24 resize-none"
                        data-testid={`input-note-${measure.id}`}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNote}
                          data-testid={`button-save-note-${measure.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          data-testid={`button-cancel-note-${measure.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {note ? (
                        <div className="p-3 bg-muted/50 rounded-lg border border-border">
                          <p className="text-sm whitespace-pre-wrap" data-testid={`text-note-${measure.id}`}>
                            {note}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEditNote}
                        data-testid={`button-edit-note-${measure.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {note ? "Edit Note" : "Add Note"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

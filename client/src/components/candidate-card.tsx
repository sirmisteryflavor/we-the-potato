import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, User, Briefcase, Award, DollarSign, MessageSquare, Pencil, ChevronDown, ChevronUp, X } from "lucide-react";
import type { Candidate } from "@shared/schema";

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
  note?: string;
  onNoteChange?: (note: string) => void;
}

export function CandidateCard({ candidate, isSelected, onSelect, note = "", onNoteChange }: CandidateCardProps) {
  const [showNote, setShowNote] = useState(!!note);
  const [localNote, setLocalNote] = useState(note);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  const handleStartEditNote = () => {
    setTempNote(localNote);
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    setLocalNote(tempNote);
    setIsEditingNote(false);
    onNoteChange?.(tempNote);
  };

  const handleCancelEdit = () => {
    setTempNote("");
    setIsEditingNote(false);
  };

  const partyColors: Record<string, string> = {
    Democratic: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Republican: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    "Working Families": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Independent: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300",
    Green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    Libertarian: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <Card
      className={cn(
        "overflow-visible transition-all duration-200",
        isSelected && "ring-2 ring-primary"
      )}
      data-testid={`card-candidate-${candidate.id}`}
    >
      <CardContent className="p-5">
        <div className="mb-4">
          <h3 
            className="text-xl font-semibold mb-2 truncate"
            data-testid={`text-candidate-name-${candidate.id}`}
          >
            {candidate.name}
          </h3>
          <Badge 
            className={cn("text-xs", partyColors[candidate.party] || partyColors.Independent)}
            data-testid={`badge-candidate-party-${candidate.id}`}
          >
            {candidate.party}
          </Badge>
        </div>

        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
          <p className="text-sm font-medium text-primary mb-1">Quick Profile</p>
          <p className="text-sm text-muted-foreground" data-testid={`text-candidate-profile-${candidate.id}`}>
            {candidate.party} candidate. {candidate.age && `Age: ${candidate.age}. `}{candidate.experience}. 
            {candidate.positions.length > 0 && ` Focuses on: ${candidate.positions.slice(0, 2).join(", ").toLowerCase()}.`}
          </p>
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Top Positions</p>
            </div>
            <ul className="space-y-1.5">
              {candidate.positions.slice(0, 3).map((position, i) => (
                <li 
                  key={i} 
                  className="text-sm text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-primary"
                >
                  {position}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Experience</p>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{candidate.experience}</p>
          </div>

          {candidate.endorsements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Key Endorsements</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-6">
                {candidate.endorsements.map((endorsement, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {endorsement}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {candidate.donations && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Donation Breakdown</p>
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Small donations (under $200)</span>
                    <span className="text-xs font-medium">{candidate.donations.small.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{ width: `${candidate.donations.small.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${candidate.donations.small.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Large donations ($200-$2,800)</span>
                    <span className="text-xs font-medium">{candidate.donations.large.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all" 
                      style={{ width: `${candidate.donations.large.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${candidate.donations.large.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Mega donations (PACs/Super PACs)</span>
                    <span className="text-xs font-medium">{candidate.donations.mega.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all" 
                      style={{ width: `${candidate.donations.mega.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${candidate.donations.mega.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => onSelect(candidate.id)}
          variant={isSelected ? "default" : "outline"}
          className="w-full"
          data-testid={`button-select-candidate-${candidate.id}`}
        >
          {isSelected ? (
            <Check className="h-4 w-4" />
          ) : (
            "Select Candidate"
          )}
        </Button>

        {isSelected && (
          <div className="mt-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setShowNote(!showNote);
                if (!showNote && !localNote) {
                  setIsEditingNote(true);
                  setTempNote("");
                }
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-toggle-note-${candidate.id}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{localNote ? (showNote ? "Hide note" : "View note") : "Add a note"}</span>
              {showNote ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showNote && (
              <div className="mt-3">
                {isEditingNote ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Add your thoughts on this candidate..."
                      className="min-h-[80px] text-sm"
                      data-testid={`textarea-note-${candidate.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        data-testid={`button-save-note-${candidate.id}`}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        data-testid={`button-cancel-note-${candidate.id}`}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-note-${candidate.id}`}>
                      {localNote}
                    </p>
                    <button
                      onClick={handleStartEditNote}
                      className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                      data-testid={`button-edit-note-${candidate.id}`}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit note
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

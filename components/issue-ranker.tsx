"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  DollarSign, 
  GraduationCap, 
  HeartPulse, 
  Leaf, 
  Shield,
  GripVertical,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import type { IssueCategory } from "@/lib/schema";

interface IssueRankerProps {
  ranking: IssueCategory[];
  onChange: (ranking: IssueCategory[]) => void;
  className?: string;
}

const issueConfig: Record<IssueCategory, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  economy: {
    label: "Economy & Jobs",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  },
  education: {
    label: "Education",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
  },
  healthcare: {
    label: "Healthcare",
    icon: <HeartPulse className="h-5 w-5" />,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800",
  },
  environment: {
    label: "Environment",
    icon: <Leaf className="h-5 w-5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
  },
  public_safety: {
    label: "Public Safety",
    icon: <Shield className="h-5 w-5" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
  },
};

const rankLabels = [
  "Most Important",
  "Very Important", 
  "Important",
  "Somewhat Important",
  "Least Important"
];

export function IssueRanker({ ranking, onChange, className }: IssueRankerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newRanking = [...ranking];
    const [removed] = newRanking.splice(fromIndex, 1);
    newRanking.splice(toIndex, 0, removed);
    onChange(newRanking);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    moveItem(fromIndex, toIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < ranking.length - 1) {
      moveItem(index, index + 1);
    }
  };

  return (
    <div className={cn("space-y-2", className)} data-testid="issue-ranker">
      {ranking.map((category, index) => {
        const config = issueConfig[category];
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={category}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all",
              config.bgColor,
              isDragging && "opacity-50 scale-95",
              isDragOver && "ring-2 ring-primary ring-offset-2",
              "touch-none select-none"
            )}
            data-testid={`issue-bubble-${category}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <GripVertical className="h-4 w-4" />
              <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
            </div>

            <div className={cn("flex items-center gap-2 flex-1", config.color)}>
              {config.icon}
              <span className="font-medium">{config.label}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  index === 0 
                    ? "text-muted-foreground/30 cursor-not-allowed" 
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
                data-testid={`button-move-up-${category}`}
                aria-label={`Move ${config.label} up`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === ranking.length - 1}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  index === ranking.length - 1 
                    ? "text-muted-foreground/30 cursor-not-allowed" 
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
                data-testid={`button-move-down-${category}`}
                aria-label={`Move ${config.label} down`}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
      
      <div className="flex justify-between text-xs text-muted-foreground pt-2 px-1">
        <span>{rankLabels[0]}</span>
        <span>{rankLabels[rankLabels.length - 1]}</span>
      </div>
    </div>
  );
}

export { issueConfig };

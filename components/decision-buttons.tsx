import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { DecisionOption } from "@/lib/schema";

interface DecisionButtonsProps {
  value: DecisionOption | null;
  onChange: (decision: DecisionOption) => void;
  className?: string;
}

export function DecisionButtons({ value, onChange, className }: DecisionButtonsProps) {
  const options: { value: DecisionOption; label: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      value: "yes",
      label: "Yes",
      icon: <Check className="h-3.5 w-3.5" />,
      activeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
    },
    {
      value: "no",
      label: "No",
      icon: <X className="h-3.5 w-3.5" />,
      activeClass: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700",
    },
  ];

  const handleClick = (optionValue: DecisionOption) => {
    if (value === optionValue) {
      onChange("undecided");
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div className={cn("flex gap-1.5", className)} role="group" aria-label="Vote decision">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            data-testid={`button-decision-${option.value}`}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-all duration-200 min-h-[44px]",
              isActive
                ? option.activeClass
                : "bg-background border-border hover-elevate active-elevate-2"
            )}
            aria-pressed={isActive}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

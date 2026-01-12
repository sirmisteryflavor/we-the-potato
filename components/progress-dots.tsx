import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export function ProgressDots({ total, current, className }: ProgressDotsProps) {
  return (
    <div 
      className={cn("flex items-center gap-2", className)}
      data-testid="progress-dots"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i + 1 === current 
              ? "w-6 bg-primary" 
              : i + 1 < current 
                ? "w-2 bg-primary/70"
                : "w-2 bg-muted"
          )}
          data-testid={`dot-${i + 1}`}
        />
      ))}
    </div>
  );
}

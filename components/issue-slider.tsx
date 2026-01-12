import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { 
  DollarSign, 
  GraduationCap, 
  HeartPulse, 
  Leaf, 
  Shield 
} from "lucide-react";
import type { IssueCategory } from "@/lib/schema";

interface IssueSliderProps {
  category: IssueCategory;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const issueConfig: Record<IssueCategory, { label: string; icon: React.ReactNode; color: string }> = {
  economy: {
    label: "Economy & Jobs",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-blue-500",
  },
  education: {
    label: "Education",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "text-purple-500",
  },
  healthcare: {
    label: "Healthcare",
    icon: <HeartPulse className="h-5 w-5" />,
    color: "text-rose-500",
  },
  environment: {
    label: "Environment",
    icon: <Leaf className="h-5 w-5" />,
    color: "text-emerald-500",
  },
  public_safety: {
    label: "Public Safety",
    icon: <Shield className="h-5 w-5" />,
    color: "text-amber-500",
  },
};

export function IssueSlider({ category, value, onChange, className }: IssueSliderProps) {
  const config = issueConfig[category];

  return (
    <div className={cn("space-y-3", className)} data-testid={`slider-issue-${category}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className="font-medium">{config.label}</span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">{value}/10</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={10}
        step={1}
        className="w-full"
        data-testid={`input-slider-${category}`}
      />
    </div>
  );
}

export { issueConfig };

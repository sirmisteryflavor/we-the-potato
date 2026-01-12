"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { Vote, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  backIcon?: "arrow" | "close";
  variant?: "default" | "dark";
  maxWidth?: string;
  fixed?: boolean;
  isLoading?: boolean;
}

export function AppHeader({
  showBackButton = false,
  onBack,
  backIcon = "arrow",
  variant = "default",
  maxWidth = "max-w-lg",
  fixed = false,
}: AppHeaderProps) {
  const router = useRouter();

  const isDark = variant === "dark";

  const headerClasses = cn(
    "top-0 z-50",
    fixed ? "fixed left-0 right-0" : "sticky",
    !isDark && "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
  );

  const darkButtonClasses = "bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 border-0";

  const BackIcon = backIcon === "close" ? X : ArrowLeft;

  return (
    <header className={headerClasses}>
      <div className={cn(maxWidth, "mx-auto px-4 py-3 flex items-center justify-between gap-2")}>
        <div className="flex items-center gap-1">
          {showBackButton ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className={isDark ? darkButtonClasses : undefined}
                data-testid={backIcon === "close" ? "button-close-viewer" : "button-back"}
              >
                <BackIcon className="h-5 w-5" />
              </Button>
              <div
                className={cn(
                  "flex items-center gap-2 cursor-pointer ml-1",
                  isDark && "text-white"
                )}
                onClick={() => router.push("/")}
                data-testid="link-home-logo"
              >
                <Vote className={cn("h-6 w-6", isDark ? "text-white" : "text-primary")} />
                <span className={cn(
                  "font-bold text-lg hidden sm:block",
                  isDark && "text-white"
                )}>
                  We The Potato
                </span>
              </div>
            </>
          ) : (
            <>
              <NavMenu className={isDark ? darkButtonClasses : undefined} />
              <div
                className={cn(
                  "flex items-center gap-2 cursor-pointer ml-1",
                  isDark && "text-white"
                )}
                onClick={() => router.push("/")}
                data-testid="link-home-logo"
              >
                <Vote className={cn("h-6 w-6", isDark ? "text-white" : "text-primary")} />
                <span className={cn(
                  "font-bold text-lg hidden sm:block",
                  isDark && "text-white"
                )}>
                  We The Potato
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showBackButton && (
            <NavMenu className={isDark ? darkButtonClasses : undefined} />
          )}
          <ThemeToggle className={isDark ? darkButtonClasses : undefined} />
        </div>
      </div>
    </header>
  );
}

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMenu } from "@/components/nav-menu";
import { useAuth } from "@/hooks/useAuth";
import { loginWithReturn } from "@/lib/utils";
import { Vote, User, LogIn, ArrowLeft, X } from "lucide-react";
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
  isLoading = false,
}: AppHeaderProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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
                onClick={() => navigate("/")}
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
                onClick={() => navigate("/")}
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
          {isLoading || authLoading ? (
            isDark ? (
              <div className="h-9 w-9 rounded-full bg-black/20 backdrop-blur-sm animate-pulse" />
            ) : (
              <Skeleton className="h-9 w-9 rounded-full" />
            )
          ) : isAuthenticated && user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className={isDark ? darkButtonClasses : undefined}
              data-testid="button-profile"
            >
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loginWithReturn()}
              className={isDark ? darkButtonClasses : undefined}
              data-testid="button-login"
            >
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

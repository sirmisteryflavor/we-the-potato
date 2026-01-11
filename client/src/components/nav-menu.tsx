import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Home, Vote, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  className?: string;
  showAdminLinks?: boolean;
}

export function NavMenu({ className, showAdminLinks = true }: NavMenuProps) {
  const [, navigate] = useLocation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(className)}
          data-testid="button-nav-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          onClick={() => navigate("/")}
          className="cursor-pointer"
          data-testid="nav-menu-landing"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/home")}
          className="cursor-pointer"
          data-testid="nav-menu-elections"
        >
          <Vote className="h-4 w-4 mr-2" />
          Elections
        </DropdownMenuItem>
        {showAdminLinks && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/analytics")}
              className="cursor-pointer"
              data-testid="nav-menu-analytics"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/admin")}
              className="cursor-pointer"
              data-testid="nav-menu-admin"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      {isHydrated && (
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => router.push("/")}
            className="cursor-pointer"
            data-testid="nav-menu-landing"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/home")}
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
                onClick={() => router.push("/analytics")}
                className="cursor-pointer"
                data-testid="nav-menu-analytics"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="cursor-pointer"
                data-testid="nav-menu-admin"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

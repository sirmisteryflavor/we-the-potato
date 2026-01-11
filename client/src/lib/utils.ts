import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortDecisions<T extends { type: string }>(decisions: T[]): T[] {
  return [...decisions].sort((a, b) => {
    if (a.type === "candidate" && b.type !== "candidate") return -1;
    if (a.type !== "candidate" && b.type === "candidate") return 1;
    return 0;
  });
}

/**
 * Navigate to login page with returnTo parameter
 * After successful login, user will be redirected back to the specified path
 */
export function loginWithReturn(returnTo?: string) {
  const path = returnTo || window.location.pathname + window.location.search;
  const encodedReturnTo = encodeURIComponent(path);
  window.location.href = `/api/login?returnTo=${encodedReturnTo}`;
}

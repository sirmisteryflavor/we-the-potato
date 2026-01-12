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

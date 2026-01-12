import type { CardTemplate } from "@/lib/schema";

export const PUBLIC_DOMAIN = "wethepotato.com";

export function getShareUrl(cardId: string, username?: string | null, existingShareUrl?: string | null): string {
  if (existingShareUrl) {
    return existingShareUrl;
  }
  if (username) {
    return `https://${PUBLIC_DOMAIN}/${username}/${cardId}`;
  }
  return `https://${PUBLIC_DOMAIN}/card/${cardId}`;
}

export function getDisplayShareUrl(cardId: string, username?: string | null, existingShareUrl?: string | null): string {
  const url = getShareUrl(cardId, username, existingShareUrl);
  return url.replace(/^https?:\/\//, '');
}

export const STATE_NAMES: Record<string, string> = {
  NY: "New York",
  NJ: "New Jersey",
  PA: "Pennsylvania",
  CT: "Connecticut",
  TX: "Texas",
};

export interface TemplateStylesTailwind {
  background: string;
  text: string;
  accent: string;
  border: string;
  notesText: string;
  divider: string;
  badgeBg: string;
  badgeText: string;
}

export interface TemplateStylesCSS {
  background: string;
  backgroundColor: string;
  text: string;
  accent: string;
  divider: string;
  badgeBg: string;
  badgeText: string;
  iconColor: string;
}

export const templatesTailwind: Record<CardTemplate, TemplateStylesTailwind> = {
  minimal: {
    background: "bg-white dark:bg-gray-900",
    text: "text-gray-900 dark:text-white",
    accent: "text-gray-500 dark:text-gray-400",
    border: "border border-gray-200 dark:border-gray-700",
    notesText: "text-gray-400 dark:text-gray-500",
    divider: "border-gray-200 dark:border-gray-700",
    badgeBg: "bg-gray-100 dark:bg-gray-800",
    badgeText: "text-gray-700 dark:text-gray-300",
  },
  bold: {
    background: "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500",
    text: "text-white",
    accent: "text-white/70",
    border: "",
    notesText: "text-white/50",
    divider: "border-white/15",
    badgeBg: "bg-white/20",
    badgeText: "text-white",
  },
  professional: {
    background: "bg-gradient-to-b from-slate-800 to-slate-900",
    text: "text-white",
    accent: "text-slate-300",
    border: "border border-slate-600",
    notesText: "text-slate-500",
    divider: "border-slate-700",
    badgeBg: "bg-slate-700",
    badgeText: "text-slate-200",
  },
};

export const templatesCSS: Record<CardTemplate, TemplateStylesCSS> = {
  minimal: {
    background: "#ffffff",
    backgroundColor: "#ffffff",
    text: "#111827",
    accent: "#6b7280",
    divider: "#e5e7eb",
    badgeBg: "#f3f4f6",
    badgeText: "#374151",
    iconColor: "#6366f1",
  },
  bold: {
    background: "linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)",
    backgroundColor: "#4f46e5",
    text: "#ffffff",
    accent: "rgba(255,255,255,0.7)",
    divider: "rgba(255,255,255,0.15)",
    badgeBg: "rgba(255,255,255,0.2)",
    badgeText: "#ffffff",
    iconColor: "#ffffff",
  },
  professional: {
    background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
    backgroundColor: "#1e293b",
    text: "#ffffff",
    accent: "#cbd5e1",
    divider: "#334155",
    badgeBg: "#334155",
    badgeText: "#e2e8f0",
    iconColor: "#ffffff",
  },
};

export function getYear(dateStr: string): string {
  try {
    const match = dateStr.match(/\d{4}/);
    return match ? match[0] : "2026";
  } catch {
    return "2026";
  }
}

export function getElectionLevel(electionType: string): string {
  const lower = electionType.toLowerCase();
  if (lower.includes("presidential") || lower.includes("federal")) return "Federal";
  if (lower.includes("municipal") || lower.includes("local") || lower.includes("city")) return "Municipal";
  if (lower.includes("state")) return "State";
  return "State";
}

export function getElectionTypeBadge(electionType: string): string {
  const lower = electionType.toLowerCase();
  if (lower.includes("primary")) return "Primary";
  if (lower.includes("general")) return "General";
  if (lower.includes("midterm")) return "Midterm";
  if (lower.includes("special")) return "Special";
  return "";
}

export function getDisplayValues(item: { type: string; title: string; decision: string; description?: string }) {
  if (item.type === "candidate") {
    const colonIndex = item.title.indexOf(":");
    if (colonIndex > -1) {
      const office = item.title.substring(0, colonIndex).trim();
      const candidateName = item.title.substring(colonIndex + 1).trim();
      return { label: office, value: candidateName, description: item.description };
    }
    return { label: item.title, value: item.decision, description: item.description };
  }
  return { label: item.title, value: item.decision, description: item.description };
}

export function getElectionTitle(
  electionDate: string,
  electionType: string,
  state?: string
): string {
  const year = getYear(electionDate);
  const electionLevel = getElectionLevel(electionType);
  const electionTypeBadge = getElectionTypeBadge(electionType);
  const stateName = state ? (STATE_NAMES[state] || state) : "";
  
  if (stateName && electionTypeBadge) {
    return `${year} ${stateName} ${electionTypeBadge}`;
  } else if (stateName) {
    return `${year} ${stateName} ${electionType}`;
  }
  return `${year} ${electionTypeBadge || electionType}`;
}

export function getValueColorTailwind(decision: string, defaultTextClass: string): string {
  const lower = decision.toLowerCase();
  if (lower === "yes") return "text-green-400";
  if (lower === "no") return "text-red-400";
  return defaultTextClass;
}

export function getValueColorCSS(decision: string, defaultColor: string): string {
  const lower = decision.toLowerCase();
  if (lower === "yes") return "#4ade80";
  if (lower === "no") return "#f87171";
  return defaultColor;
}

export const MAX_DECISIONS = {
  square: 6,
  story: 12,
  downloadSquare: 8,
  downloadStory: 14,
};

export const DOWNLOAD_DIMENSIONS = {
  width: 1080,
  storyHeight: 1920,
  squareHeight: 1080,
};

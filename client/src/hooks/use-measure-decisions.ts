import { useSyncExternalStore } from "react";
import { subscribeToMeasureDecisions } from "@/lib/storage";
import type { MeasureDecision } from "@shared/schema";

const DECISIONS_KEY = "wtp_decisions";

let cachedDecisions: Record<string, MeasureDecision> = {};
let cachedJson: string = "";

function getDecisionsSnapshot(): Record<string, MeasureDecision> {
  const stored = localStorage.getItem(DECISIONS_KEY) || "{}";
  if (stored !== cachedJson) {
    cachedJson = stored;
    try {
      cachedDecisions = JSON.parse(stored);
    } catch {
      cachedDecisions = {};
    }
  }
  return cachedDecisions;
}

export function useMeasureDecisions(): Record<string, MeasureDecision> {
  return useSyncExternalStore(subscribeToMeasureDecisions, getDecisionsSnapshot, getDecisionsSnapshot);
}

import type { OnboardingData, MeasureDecision, VoterCardData, CardTemplate } from "@shared/schema";
import { apiRequest } from "./queryClient";

const STORAGE_KEYS = {
  ONBOARDING: "wtp_onboarding",
  DECISIONS: "wtp_decisions",
  CANDIDATE_SELECTIONS: "wtp_candidate_selections",
  NOTES: "wtp_notes",
  VOTER_CARDS: "wtp_voter_cards",
  ONBOARDING_COMPLETE: "wtp_onboarding_complete",
  VISITOR_ID: "wtp_visitor_id",
  ACTIVE_EVENT_ID: "wtp_active_event_id",
} as const;

export function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
  }
  return visitorId;
}

export function getVisitorId(): string {
  return getOrCreateVisitorId();
}

export function saveOnboardingData(data: OnboardingData): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(data));
}

export function getOnboardingData(): OnboardingData | null {
  const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
  return stored ? JSON.parse(stored) : null;
}

export function setOnboardingComplete(complete: boolean): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
}

export function isOnboardingComplete(): boolean {
  const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  return stored ? JSON.parse(stored) : false;
}

export function saveMeasureDecision(measureId: string, decision: MeasureDecision): void {
  const decisions = getMeasureDecisions();
  decisions[measureId] = decision;
  localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(decisions));
  // Dispatch event so other components can react to decision changes
  window.dispatchEvent(new CustomEvent('decisions:updated', { detail: { decisions } }));
}

export function getMeasureDecisions(): Record<string, MeasureDecision> {
  const stored = localStorage.getItem(STORAGE_KEYS.DECISIONS);
  return stored ? JSON.parse(stored) : {};
}

export function getMeasureDecision(measureId: string): MeasureDecision | null {
  const decisions = getMeasureDecisions();
  return decisions[measureId] || null;
}

export function saveCandidateSelection(raceId: string, candidateId: string): void {
  const selections = getCandidateSelections();
  selections[raceId] = candidateId;
  localStorage.setItem(STORAGE_KEYS.CANDIDATE_SELECTIONS, JSON.stringify(selections));
}

export function getCandidateSelections(): Record<string, string> {
  const stored = localStorage.getItem(STORAGE_KEYS.CANDIDATE_SELECTIONS);
  return stored ? JSON.parse(stored) : {};
}

export function getCandidateSelection(raceId: string): string | null {
  const selections = getCandidateSelections();
  return selections[raceId] || null;
}

export function saveActiveEventId(eventId: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_EVENT_ID, eventId);
}

export function getActiveEventId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT_ID);
}

export function clearActiveEventId(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_EVENT_ID);
}

export function saveNote(itemId: string, note: string): void {
  const notes = getNotes();
  notes[itemId] = note;
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  // Dispatch event so other components can react to note changes
  window.dispatchEvent(new CustomEvent('notes:updated', { detail: { notes } }));
}

export function getNotes(): Record<string, string> {
  const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
  return stored ? JSON.parse(stored) : {};
}

export function getNote(itemId: string): string {
  const notes = getNotes();
  return notes[itemId] || "";
}

export async function syncDecisionsToServer(ballotId: string): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  const measureDecisions = getMeasureDecisions();
  const candidateSelections = getCandidateSelections();
  const notes = getNotes();

  try {
    await apiRequest("POST", "/api/decisions", {
      visitorId,
      ballotId,
      measureDecisions,
      candidateSelections,
      notes,
    });
  } catch (error) {
    console.error("Failed to sync decisions to server:", error);
  }
}

export async function loadDecisionsFromServer(ballotId: string): Promise<boolean> {
  const visitorId = getOrCreateVisitorId();
  
  try {
    const response = await fetch(`/api/decisions/${visitorId}/${ballotId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.measureDecisions) {
        localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(data.measureDecisions));
        window.dispatchEvent(new CustomEvent('decisions:updated', { detail: { decisions: data.measureDecisions } }));
      }
      if (data.candidateSelections) {
        localStorage.setItem(STORAGE_KEYS.CANDIDATE_SELECTIONS, JSON.stringify(data.candidateSelections));
      }
      if (data.notes) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
        window.dispatchEvent(new CustomEvent('notes:updated', { detail: { notes: data.notes } }));
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to load decisions from server:", error);
    return false;
  }
}

export async function trackAnalyticsEvent(
  eventType: string, 
  eventData?: Record<string, unknown>,
  state?: string
): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  
  try {
    await apiRequest("POST", "/api/analytics/event", {
      eventType,
      eventData,
      visitorId,
      state,
    });
  } catch (error) {
    console.error("Failed to track analytics event:", error);
  }
}

export function saveVoterCard(card: VoterCardData): void {
  const cards = getVoterCards();
  const existingIndex = cards.findIndex(c => c.id === card.id);
  if (existingIndex >= 0) {
    cards[existingIndex] = card;
  } else {
    cards.push(card);
  }
  localStorage.setItem(STORAGE_KEYS.VOTER_CARDS, JSON.stringify(cards));
}

export function getVoterCards(): VoterCardData[] {
  const stored = localStorage.getItem(STORAGE_KEYS.VOTER_CARDS);
  return stored ? JSON.parse(stored) : [];
}

export function getVoterCard(id: string): VoterCardData | null {
  const cards = getVoterCards();
  return cards.find(c => c.id === id) || null;
}

export function generateCardId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  // Dispatch events to notify subscribers of cleared data
  window.dispatchEvent(new CustomEvent('decisions:updated', { detail: { decisions: {} } }));
  window.dispatchEvent(new CustomEvent('notes:updated', { detail: { notes: {} } }));
}

// Hook for reactive notes - uses useSyncExternalStore pattern
export function subscribeToNotes(callback: () => void): () => void {
  const handleUpdate = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.NOTES) callback();
  };
  window.addEventListener('notes:updated', handleUpdate);
  window.addEventListener('focus', handleUpdate);
  window.addEventListener('storage', handleStorageEvent);
  return () => {
    window.removeEventListener('notes:updated', handleUpdate);
    window.removeEventListener('focus', handleUpdate);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// Hook for reactive measure decisions - uses useSyncExternalStore pattern
export function subscribeToMeasureDecisions(callback: () => void): () => void {
  const handleUpdate = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.DECISIONS) callback();
  };
  window.addEventListener('decisions:updated', handleUpdate);
  window.addEventListener('focus', handleUpdate);
  window.addEventListener('storage', handleStorageEvent);
  return () => {
    window.removeEventListener('decisions:updated', handleUpdate);
    window.removeEventListener('focus', handleUpdate);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

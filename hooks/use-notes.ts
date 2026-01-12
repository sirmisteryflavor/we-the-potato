import { useSyncExternalStore } from "react";
import { subscribeToNotes } from "@/lib/storage";

const NOTES_KEY = "wtp_notes";

// Cached snapshot to prevent infinite loops in useSyncExternalStore
let cachedNotes: Record<string, string> = {};
let cachedJson: string = "";

function getNotesSnapshot(): Record<string, string> {
  const stored = localStorage.getItem(NOTES_KEY) || "{}";
  // Only create new object reference if data actually changed
  if (stored !== cachedJson) {
    cachedJson = stored;
    try {
      cachedNotes = JSON.parse(stored);
    } catch {
      cachedNotes = {};
    }
  }
  return cachedNotes;
}

export function useNotes(): Record<string, string> {
  return useSyncExternalStore(subscribeToNotes, getNotesSnapshot, getNotesSnapshot);
}

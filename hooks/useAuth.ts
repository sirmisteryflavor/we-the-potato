import { useState, useEffect } from "react";

// Generate or retrieve a persistent visitor ID
function getVisitorId(): string {
  const storageKey = "wethepotato_visitor_id";
  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

export function useAuth() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize visitor ID on mount
    const id = getVisitorId();
    setVisitorId(id);
    setIsLoading(false);
  }, []);

  return {
    user: null, // No user accounts in MVP
    visitorId,
    isLoading,
    isAuthenticated: false, // Always false - visitor-based only
    error: null,
  };
}

// Export helper to get visitor ID synchronously
export function getOrCreateVisitorId(): string {
  return getVisitorId();
}

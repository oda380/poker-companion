import { useState } from "react";
import { HelpMessageId } from "@/lib/help-messages";

const STORAGE_KEY = "helpMessages";

type HelpMessageSettings = Partial<Record<HelpMessageId, boolean>>;

export function useHelpMessage(messageId: HelpMessageId) {
  // Initialize state from localStorage to avoid setState in useEffect
  const [isEnabled, setIsEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const settings: HelpMessageSettings = JSON.parse(stored);
        return settings[messageId] ?? true; // Default to enabled
      } catch {
        // Corrupted storage, fallback to default
        return true;
      }
    }
    return true;
  });

  const dismiss = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const settings: HelpMessageSettings = stored ? JSON.parse(stored) : {};
    settings[messageId] = false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsEnabled(false);
  };

  const enable = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const settings: HelpMessageSettings = stored ? JSON.parse(stored) : {};
    settings[messageId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsEnabled(true);
  };

  return { isEnabled, dismiss, enable };
}

export function resetAllHelpMessages() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload(); // Force re-render
}

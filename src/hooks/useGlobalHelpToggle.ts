import { useState } from "react";

const STORAGE_KEY = "showHelpMessages";

export function useGlobalHelpToggle() {
  const [isEnabled, setIsEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== "false"; // Default to true
  });

  const toggle = (value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setIsEnabled(value);
  };

  return { isEnabled, toggle };
}

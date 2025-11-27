"use client";

import { useEffect, useRef } from "react";
import { usePokerStore } from "@/store/usePokerStore";
import { saveCurrentGame, clearCurrentGame } from "@/lib/game-persistence";

/**
 * Auto-save game state to IndexedDB
 * Debounces saves to avoid excessive writes
 */
export function useAutoSaveGame() {
  const gameState = usePokerStore((state) => state);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce saves (500ms)
    timeoutRef.current = setTimeout(async () => {
      if (gameState.currentHand) {
        // Game in progress - save state
        await saveCurrentGame(gameState);
      } else {
        // No active game - clear saved state
        await clearCurrentGame();
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [gameState]);
}

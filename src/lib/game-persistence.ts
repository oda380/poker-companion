import { db, SavedGameState } from "./db";
import { PokerStore } from "@/store/usePokerStore";

const CURRENT_GAME_ID = "current-game";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save current game state to IndexedDB
 */
export async function saveCurrentGame(state: PokerStore): Promise<void> {
  try {
    const savedState: SavedGameState = {
      id: CURRENT_GAME_ID,
      timestamp: Date.now(),
      gameState: JSON.stringify(state),
    };

    await db.currentGame.put(savedState);
  } catch (error) {
    console.error("Failed to save current game:", error);
  }
}

/**
 * Load current game state from IndexedDB
 */
export async function loadCurrentGame(): Promise<PokerStore | null> {
  try {
    const saved = await db.currentGame.get(CURRENT_GAME_ID);

    if (!saved) return null;

    // Check if saved game is too old
    const age = Date.now() - saved.timestamp;
    if (age > MAX_AGE_MS) {
      await clearCurrentGame();
      return null;
    }

    return JSON.parse(saved.gameState) as PokerStore;
  } catch (error) {
    console.error("Failed to load current game:", error);
    return null;
  }
}

/**
 * Clear current game state from IndexedDB
 */
export async function clearCurrentGame(): Promise<void> {
  try {
    await db.currentGame.delete(CURRENT_GAME_ID);
  } catch (error) {
    console.error("Failed to clear current game:", error);
  }
}

/**
 * Check if there's a resumeable game
 */
export async function hasResumeableGame(): Promise<boolean> {
  try {
    const saved = await db.currentGame.get(CURRENT_GAME_ID);
    if (!saved) return false;

    // Check if saved game is too old
    const age = Date.now() - saved.timestamp;
    return age <= MAX_AGE_MS;
  } catch (error) {
    console.error("Failed to check for resumeable game:", error);
    return false;
  }
}

/**
 * Get saved game metadata (without full state)
 */
export async function getSavedGameMetadata(): Promise<{
  timestamp: number;
  age: number;
} | null> {
  try {
    const saved = await db.currentGame.get(CURRENT_GAME_ID);
    if (!saved) return null;

    const age = Date.now() - saved.timestamp;
    if (age > MAX_AGE_MS) {
      await clearCurrentGame();
      return null;
    }

    return {
      timestamp: saved.timestamp,
      age,
    };
  } catch (error) {
    console.error("Failed to get saved game metadata:", error);
    return null;
  }
}

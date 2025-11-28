import { create } from "zustand";
import { temporal } from "zundo";
import { TableState, Player, GameVariant, TableConfig } from "../types";
import { initializeHand, processAction } from "../lib/game-logic";
import { toast } from "sonner";
import { persist } from "zustand/middleware";
import { GAME_VARIANTS } from "../lib/constants";

export interface PokerStore extends TableState {
  // Actions
  setTableConfig: (
    name: string,
    variant: GameVariant,
    config: TableConfig
  ) => void;
  addPlayer: (name: string, seat: number, stack: number) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerStatus: (playerId: string, status: Player["status"]) => void;
  updatePlayerName: (playerId: string, name: string) => void;

  // Game Flow Actions
  startNewHand: (dealerSeat?: number) => boolean;
  revealHand: (playerId: string, cards: string[]) => void;
  resetGame: () => void;

  // Betting Actions
  playerAction: (
    actionType: "fold" | "check" | "call" | "bet" | "raise" | "allIn",
    amount?: number
  ) => void;
  rebuyPlayer: (playerId: string, amount: number) => void;

  // UI State (excluded from Undo)
  ui: {
    isSettingsOpen: boolean;
    isHandHistoryOpen: boolean;
    isShowdownDialogOpen: boolean;
    activeModal: string | null;
  };
  setUiState: (partialUi: Partial<PokerStore["ui"]>) => void;

  // State Restoration
  restoreState: (state: Partial<TableState>) => void;
}

const initialState: TableState = {
  id: "default-table",
  name: "My Poker Game",
  gameVariant: GAME_VARIANTS.TEXAS_HOLDEM.id,
  config: {
    smallBlind: 1,
    bigBlind: 2,
  },
  players: [],
  currentHand: undefined,
  handHistory: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const usePokerStore = create<PokerStore>()(
  persist(
    temporal(
      (set) => ({
        ...initialState,

        ui: {
          isSettingsOpen: false,
          isHandHistoryOpen: false,
          isShowdownDialogOpen: true, // Default to true so it opens when state changes
          activeModal: null,
        },

        setTableConfig: (name, variant, config) =>
          set({ name, gameVariant: variant, config }),

        addPlayer: (name, seat, stack) =>
          set((state) => {
            // Guard: Prevent adding players during active hand
            if (state.currentHand && !state.currentHand.finished) {
              toast.error(
                "Cannot add players during an active hand. Wait for the current hand to finish."
              );
              return state; // No change
            }

            return {
              players: [
                ...state.players,
                {
                  id: crypto.randomUUID(),
                  name,
                  seat,
                  stack,
                  isSittingOut: false,
                  status: "active",
                  wins: 0,
                },
              ],
            };
          }),

        removePlayer: (playerId) =>
          set((state) => {
            // Guard: Prevent removing players during active hand
            if (state.currentHand && !state.currentHand.finished) {
              toast.error(
                "Cannot remove players during an active hand. Wait for the current hand to finish."
              );
              return state; // No change
            }

            return {
              players: state.players.filter((p) => p.id !== playerId),
            };
          }),

        updatePlayerStatus: (playerId, status) =>
          set((state) => ({
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, status } : p
            ),
          })),

        updatePlayerName: (playerId, name) =>
          set((state) => ({
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, name } : p
            ),
          })),

        startNewHand: (dealerSeat?: number) => {
          let success = false;
          set((state) => {
            try {
              const { hand, updatedPlayers } = initializeHand(
                state,
                dealerSeat
              );
              success = true;

              // Update session in DB with current players and config
              // This ensures the session record reflects the actual game setup
              const newState = {
                ...state,
                currentHand: hand,
                players: updatedPlayers,
              };
              import("../lib/db").then(({ saveSession }) => {
                saveSession(newState);
              });

              return newState;
            } catch (e) {
              console.error("Failed to start hand:", e);
              // Show user-facing error
              toast.error("Cannot Start Hand", {
                description:
                  e instanceof Error ? e.message : "Not enough active players.",
                duration: 4000,
              });
              return state;
            }
          });
          return success;
        },

        revealHand: (playerId, cards) =>
          set((state) => {
            if (!state.currentHand) return state;

            const updatedPlayerHands = state.currentHand.playerHands.map(
              (ph) => {
                if (ph.playerId === playerId) {
                  return {
                    ...ph,
                    cards: cards.map((code) => ({ code, faceUp: true })),
                  };
                }
                return ph;
              }
            );

            return {
              ...state,
              currentHand: {
                ...state.currentHand,
                playerHands: updatedPlayerHands,
              },
            };
          }),

        resetGame: () => {
          // Force cleanup of any lingering Radix UI body locks
          // Only remove specific problematic styles to preserve scroll position
          if (typeof document !== "undefined") {
            document.body.style.pointerEvents = "";
            document.body.style.overflow = "";
            document.body.removeAttribute("data-scroll-locked");
          }

          const newState = {
            // Completely replace state to avoid persistence merge issues
            ...initialState,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            players: [], // Explicitly clear players
            handHistory: [], // Explicitly clear history
            currentHand: undefined, // Explicitly clear current hand

            // Explicitly reset UI state
            ui: {
              isSettingsOpen: false,
              isHandHistoryOpen: false,
              isShowdownDialogOpen: true,
              activeModal: null,
            },
          };

          set(newState);

          // Save new session to DB
          // We need to wait a bit for players to be added in setup,
          // but we can create the initial record here.
          import("../lib/db").then(({ saveSession }) => {
            saveSession(newState);
          });
        },

        playerAction: (actionType, amount) => {
          set((state) => {
            try {
              const oldHand = state.currentHand;
              const newState = processAction(state, actionType, amount);

              // Check if hand finished (transitioned from having a hand to undefined/finished)
              // processAction sets currentHand to undefined when hand ends via fold
              if (
                oldHand &&
                !newState.currentHand &&
                newState.handHistory.length > state.handHistory.length
              ) {
                const summary =
                  newState.handHistory[newState.handHistory.length - 1];
                // Save to DB asynchronously
                import("../lib/db").then(({ saveHand }) => {
                  saveHand(state.id, oldHand, summary);
                });
              }

              return newState;
            } catch (e) {
              console.error("Action failed:", e);
              return state;
            }
          });
        },

        rebuyPlayer: (playerId, amount) =>
          set((state) => ({
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, stack: p.stack + amount } : p
            ),
          })),

        setUiState: (partialUi) =>
          set((state) => ({
            ui: { ...state.ui, ...partialUi },
          })),

        restoreState: (state) =>
          set((currentState) => ({
            ...currentState,
            ...state,
            ui: currentState.ui, // Preserve UI state
          })),
      }),
      {
        limit: 50,
        partialize: (state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ui, ...logicState } = state;
          return logicState;
        },
      }
    ),
    {
      name: "poker-table-storage",
      partialize: (state) => {
        // Exclude UI state from persistence
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ui, ...logicState } = state;
        return logicState;
      },
    }
  )
);

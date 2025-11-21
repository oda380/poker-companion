import { create } from "zustand";
import { temporal } from "zundo";
import { TableState, Player, GameVariant, TableConfig } from "../types";
import { initializeHand, processAction } from "../lib/game-logic";

interface PokerStore extends TableState {
    // Actions
    setTableConfig: (name: string, variant: GameVariant, config: TableConfig) => void;
    addPlayer: (name: string, seat: number, stack: number) => void;
    removePlayer: (playerId: string) => void;
    updatePlayerStatus: (playerId: string, status: Player["status"]) => void;

    // Game Flow Actions
    startNewHand: (dealerSeat?: number) => void;
    dealCards: () => void; // For Stud or Hold'em streets

    // Betting Actions
    playerAction: (actionType: "fold" | "check" | "call" | "bet" | "raise" | "allIn", amount?: number) => void;

    // UI State (excluded from Undo)
    ui: {
        isSettingsOpen: boolean;
        isHandHistoryOpen: boolean;
        activeModal: string | null;
    };
    setUiState: (partialUi: Partial<PokerStore["ui"]>) => void;
}

const initialState: TableState = {
    id: "default-table",
    name: "My Poker Game",
    gameVariant: "texasHoldem",
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
    temporal(
        (set, get) => ({
            ...initialState,

            ui: {
                isSettingsOpen: false,
                isHandHistoryOpen: false,
                activeModal: null,
            },

            setTableConfig: (name, variant, config) => set({ name, gameVariant: variant, config }),

            addPlayer: (name, seat, stack) => set((state) => ({
                players: [
                    ...state.players,
                    {
                        id: crypto.randomUUID(),
                        name,
                        seat,
                        stack,
                        isSittingOut: false,
                        status: "active",
                    }
                ]
            })),

            removePlayer: (playerId) => set((state) => ({
                players: state.players.filter((p) => p.id !== playerId)
            })),

            updatePlayerStatus: (playerId, status) => set((state) => ({
                players: state.players.map((p) => p.id === playerId ? { ...p, status } : p)
            })),

            startNewHand: (dealerSeat?: number) => {
                set((state) => {
                    try {
                        const { hand, updatedPlayers } = initializeHand(state, dealerSeat);
                        return { ...state, currentHand: hand, players: updatedPlayers };
                    } catch (e) {
                        console.error("Failed to start hand:", e);
                        return state;
                    }
                });
            },

            dealCards: () => {
                // TODO: Implement dealing logic for next streets (Stud)
                // This might be part of processAction or a separate step?
                // For now, keep it empty or delegate.
            },

            playerAction: (actionType, amount) => {
                set((state) => {
                    try {
                        return processAction(state, actionType, amount);
                    } catch (e) {
                        console.error("Action failed:", e);
                        return state;
                    }
                });
            },

            setUiState: (partialUi) => set((state) => ({
                ui: { ...state.ui, ...partialUi }
            })),
        }),
        {
            limit: 50,
            partialize: (state) => {
                const { ui, ...logicState } = state;
                return logicState;
            },
        }
    )
);

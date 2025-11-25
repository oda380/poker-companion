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
    startNewHand: (dealerSeat?: number) => boolean;
    dealCards: () => void; // For Stud or Hold'em streets
    revealHand: (playerId: string, cards: string[]) => void;
    resetGame: () => void;

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

import { persist } from "zustand/middleware";

export const usePokerStore = create<PokerStore>()(
    persist(
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
                            wins: 0,
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
                    let success = false;
                    set((state) => {
                        try {
                            const { hand, updatedPlayers } = initializeHand(state, dealerSeat);
                            success = true;
                            return { ...state, currentHand: hand, players: updatedPlayers };
                        } catch (e) {
                            console.error("Failed to start hand:", e);
                            return state;
                        }
                    });
                    return success;
                },

                dealCards: () => {
                    // TODO: Implement dealing logic for next streets (Stud)
                    // This might be part of processAction or a separate step?
                    // For now, keep it empty or delegate.
                },

                revealHand: (playerId, cards) => set((state) => {
                    if (!state.currentHand) return state;

                    const updatedPlayerHands = state.currentHand.playerHands.map(ph => {
                        if (ph.playerId === playerId) {
                            return {
                                ...ph,
                                cards: cards.map(code => ({ code, faceUp: true }))
                            };
                        }
                        return ph;
                    });

                    return {
                        ...state,
                        currentHand: {
                            ...state.currentHand,
                            playerHands: updatedPlayerHands
                        }
                    };
                }),

                resetGame: () => set({
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
                        activeModal: null,
                    }
                }), // Pass true to 'set' to force replace instead of merge if supported by middleware, though standard zustand set is merge. 
                // Note: Zustand's set merges by default. To replace, we usually need the second arg to be true, 
                // but with middleware it depends. 
                // However, since we are spreading ...initialState and overriding everything, it should be fine.
                // The key addition here is ensuring we don't rely on implicit behavior.

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
        ),
        {
            name: "poker-storage",
            partialize: (state) => {
                // Exclude UI state from persistence
                const { ui, ...logicState } = state;
                return logicState;
            },
        }
    )
);

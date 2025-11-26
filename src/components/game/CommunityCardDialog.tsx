import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState, useEffect } from "react";
import { Card } from "./Card";
import { cn, getStreetColor } from "@/lib/utils";

export function CommunityCardDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const [activeSlot, setActiveSlot] = useState(0);

    // Determine if we need to show card input dialog
    const needsCardInput = currentHand?.activePlayerId === "WAITING_FOR_CARDS";
    const cardsNeeded = currentHand?.currentStreet === "flop" ? 3 : 1;

    // Sync isOpen with needsCardInput
    useEffect(() => {
        if (needsCardInput) {
            setIsOpen(true);
        }
    }, [needsCardInput]);

    // Initialize/Reset selectedCards when street changes or dialog opens
    useEffect(() => {
        if (needsCardInput) {
            setSelectedCards(Array(cardsNeeded).fill(""));
            setActiveSlot(0);
        }
    }, [needsCardInput, cardsNeeded]);

    if (!currentHand) return null;
    if (!needsCardInput) return null;

    const streetName = currentHand.currentStreet.toUpperCase();

    if (!isOpen) {
        return (
            <div className="fixed bottom-24 right-4 z-50">
                <Button
                    size="lg"
                    className="h-14 px-6 shadow-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-bottom-4"
                    onClick={() => setIsOpen(true)}
                >
                    Resume {streetName}
                </Button>
            </div>
        );
    }

    const handleCardSelect = (cardCode: string) => {
        const newCards = [...selectedCards];

        // Ensure array is big enough
        while (newCards.length < cardsNeeded) newCards.push("");

        newCards[activeSlot] = cardCode;
        setSelectedCards(newCards);

        // Auto-advance
        if (activeSlot < cardsNeeded - 1) {
            setActiveSlot(activeSlot + 1);
        }
    };

    const handleConfirm = () => {
        const filledCards = selectedCards.filter(c => c !== "");
        if (filledCards.length === cardsNeeded) {
            // Update the hand with the selected cards
            usePokerStore.setState((state) => {
                if (!state.currentHand) return state;

                // Find active players (not folded, not all-in)
                const activePlayers = state.players.filter(p =>
                    !p.isSittingOut && p.status === "active"
                );

                // Determine next step: Betting or Next Street (Runout)
                let nextActivePlayerId = "";
                let nextStreet = state.currentHand.currentStreet;
                let nextPots = state.currentHand.pots;

                // Helper to get next street name
                const getNextStreetName = (s: string) => {
                    if (s === "preflop") return "flop";
                    if (s === "flop") return "turn";
                    if (s === "turn") return "river";
                    return "showdown";
                };

                if (activePlayers.length < 2) {
                    // All-in scenario (or only 1 active): Skip betting, go to next street
                    const upcomingStreet = getNextStreetName(state.currentHand.currentStreet);

                    if (upcomingStreet === "showdown") {
                        nextActivePlayerId = ""; // Showdown
                        nextStreet = "showdown";
                    } else {
                        nextActivePlayerId = "WAITING_FOR_CARDS"; // Deal next street immediately
                        nextStreet = upcomingStreet as any;
                    }
                } else {
                    // Normal betting round
                    const sortedActive = [...activePlayers].sort((a, b) => a.seat - b.seat);
                    const nextActive = sortedActive.find(p => p.seat > state.currentHand!.dealerSeat) || sortedActive[0];

                    nextActivePlayerId = nextActive?.id || "";
                }

                return {
                    ...state,
                    currentHand: {
                        ...state.currentHand,
                        board: [...state.currentHand.board, ...filledCards],
                        activePlayerId: nextActivePlayerId,
                        currentStreet: nextStreet,
                    }
                };
            });
            setSelectedCards([]);
        }
    };

    const isComplete = selectedCards.filter(c => c !== "").length === cardsNeeded;

    return (
        <Dialog open={needsCardInput && isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Deal {streetName} Cards</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {currentHand.currentStreet === "flop"
                            ? "Burn 1 card, then deal 3 cards to the board"
                            : "Burn 1 card, then deal 1 card to the board"
                        }
                    </div>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="text-center space-y-4">
                        <div className={cn("inline-flex items-center justify-center px-4 py-1.5 rounded-full font-bold tracking-wider text-sm border", getStreetColor(currentHand.currentStreet))}>
                            {streetName} PHASE
                        </div>
                        <div className="flex justify-center gap-4 min-h-[120px] items-center">
                            {Array.from({ length: cardsNeeded }).map((_, i) => {
                                const card = selectedCards[i];
                                const isActive = i === activeSlot;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => setActiveSlot(i)}
                                        className={`relative cursor-pointer transition-all ${isActive
                                                ? "scale-110 z-10"
                                                : "hover:scale-105"
                                            }`}
                                    >
                                        {card ? (
                                            <div className={isActive ? "ring-4 ring-primary ring-offset-2 ring-offset-background rounded-lg" : ""}>
                                                <Card code={card} faceUp={true} size="large" />
                                            </div>
                                        ) : (
                                            <div className={`w-20 h-28 bg-muted/50 rounded-xl border-2 border-dashed flex items-center justify-center ${isActive ? "border-primary ring-4 ring-primary ring-offset-2 ring-offset-background" : "border-muted-foreground/30"
                                                }`}>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    Card {i + 1}
                                                </span>
                                            </div>
                                        )}

                                        {isActive && (
                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-primary font-bold text-xs animate-bounce">
                                                EDITING
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-64">
                        <CardKeyboard
                            onCardSelect={handleCardSelect}
                            usedCards={[...currentHand.board, ...selectedCards.filter(c => c !== "")]}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className="w-full h-12 text-lg font-bold"
                            onClick={handleConfirm}
                            disabled={!isComplete}
                        >
                            Confirm {streetName}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

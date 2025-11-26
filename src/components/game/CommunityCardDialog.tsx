import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState, useEffect } from "react";
import { Card } from "./Card";

export function CommunityCardDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(true);

    // Determine if we need to show card input dialog
    const needsCardInput = currentHand?.activePlayerId === "WAITING_FOR_CARDS";

    // Sync isOpen with needsCardInput
    useEffect(() => {
        if (needsCardInput) {
            setIsOpen(true);
        }
    }, [needsCardInput]);

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

    const cardsNeeded = currentHand.currentStreet === "flop" ? 3 : 1;

    const handleCardSelect = (cardCode: string) => {
        if (selectedCards.length < cardsNeeded) {
            setSelectedCards([...selectedCards, cardCode]);
        }
    };

    const handleRemoveLast = () => {
        setSelectedCards(selectedCards.slice(0, -1));
    };

    const handleConfirm = () => {
        if (selectedCards.length === cardsNeeded) {
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
                    // We need to advance the street state immediately
                    // Note: This is a simplified runout. Ideally we'd loop, but for now we just
                    // set the state to "WAITING_FOR_CARDS" for the *next* street.

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
                    // First to act is left of dealer
                    const dealerIndex = activePlayers.findIndex(p => p.seat === state.currentHand!.dealerSeat);
                    // If dealer not found (e.g. folded), start from seat 0? 
                    // Better: sort by seat and find next active after dealerSeat
                    const sortedActive = [...activePlayers].sort((a, b) => a.seat - b.seat);
                    const nextActive = sortedActive.find(p => p.seat > state.currentHand!.dealerSeat) || sortedActive[0];

                    nextActivePlayerId = nextActive?.id || "";
                }

                return {
                    ...state,
                    currentHand: {
                        ...state.currentHand,
                        board: [...state.currentHand.board, ...selectedCards],
                        activePlayerId: nextActivePlayerId,
                        currentStreet: nextStreet, // Only changes if skipping betting
                        // If we skipped betting, we should technically reset committed/bets?
                        // But since we just dealt cards, committed/bets were already reset by processAction
                        // before entering WAITING_FOR_CARDS. So we are good.
                    }
                };
            });
            setSelectedCards([]);
        }
    };

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
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-wider text-sm border border-primary/20">
                            {streetName} PHASE
                        </div>
                        <div className="flex justify-center gap-2 min-h-[100px] items-center">
                            {selectedCards.map((card, i) => (
                                <Card key={i} code={card} faceUp={true} size="medium" />
                            ))}
                            {Array.from({ length: cardsNeeded - selectedCards.length }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="w-14 h-20 bg-muted rounded border-2 border-dashed border-muted-foreground/30"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-64">
                        <CardKeyboard
                            onCardSelect={handleCardSelect}
                            usedCards={[...currentHand.board, ...selectedCards]}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleRemoveLast}
                            disabled={selectedCards.length === 0}
                        >
                            Remove Last
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleConfirm}
                            disabled={selectedCards.length !== cardsNeeded}
                        >
                            Confirm {streetName}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

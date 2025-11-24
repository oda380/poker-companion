import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState } from "react";

export function CommunityCardDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);

    if (!currentHand) return null;

    // Determine if we need to show card input dialog
    const needsCardInput = currentHand.activePlayerId === "WAITING_FOR_CARDS";

    if (!needsCardInput) return null;

    const cardsNeeded = currentHand.currentStreet === "flop" ? 3 : 1;
    const streetName = currentHand.currentStreet.toUpperCase();

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

                // Find active players
                const activePlayers = state.players.filter(p =>
                    !p.isSittingOut && p.status === "active"
                );

                // First to act is left of dealer
                const dealerIndex = activePlayers.findIndex(p => p.seat === state.currentHand!.dealerSeat);
                const firstToAct = activePlayers[(dealerIndex + 1) % activePlayers.length];

                return {
                    ...state,
                    currentHand: {
                        ...state.currentHand,
                        board: [...state.currentHand.board, ...selectedCards],
                        activePlayerId: firstToAct?.id || ""
                    }
                };
            });
            setSelectedCards([]);
        }
    };

    return (
        <Dialog open={needsCardInput} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Deal {streetName} Cards</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                            {currentHand.currentStreet === "flop"
                                ? "Burn 1 card, then deal 3 cards to the board"
                                : "Burn 1 card, then deal 1 card to the board"
                            }
                        </div>
                        <div className="flex justify-center gap-2 min-h-[100px] items-center">
                            {selectedCards.map((card, i) => (
                                <div
                                    key={i}
                                    className="w-16 h-22 bg-white rounded border-2 border-primary shadow-lg flex items-center justify-center text-2xl font-bold text-black"
                                >
                                    {card}
                                </div>
                            ))}
                            {Array.from({ length: cardsNeeded - selectedCards.length }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="w-16 h-22 bg-muted rounded border-2 border-dashed border-muted-foreground/30"
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

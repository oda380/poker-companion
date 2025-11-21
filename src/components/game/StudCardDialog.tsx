import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState } from "react";

export function StudCardDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const players = usePokerStore((state) => state.players);
    const [selectedCard, setSelectedCard] = useState<string>("");
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

    if (!currentHand || currentHand.gameVariant !== "fiveCardStud") return null;

    // Only show if waiting for Stud card dealing
    const needsStudCard = currentHand.activePlayerId === "WAITING_FOR_STUD_CARD";

    if (!needsStudCard) return null;

    const activePlayers = players.filter(p =>
        !p.isSittingOut && p.status !== "folded"
    );

    if (activePlayers.length === 0) return null;

    const currentPlayer = activePlayers[currentPlayerIndex];
    const playerHand = currentHand.playerHands.find(h => h.playerId === currentPlayer.id);
    const cardCount = playerHand?.cards.length || 0;

    const streetName = currentHand.currentStreet.replace("street", "Street ");

    const handleCardSelect = (cardCode: string) => {
        setSelectedCard(cardCode);
    };

    const handleConfirm = () => {
        if (!selectedCard) return;

        usePokerStore.setState((state) => {
            if (!state.currentHand) return state;

            // Add card to current player's hand (always face-up after initial deal)
            const updatedPlayerHands = state.currentHand.playerHands.map(ph => {
                if (ph.playerId === currentPlayer.id) {
                    return {
                        ...ph,
                        cards: [...ph.cards, { code: selectedCard, faceUp: true }]
                    };
                }
                return ph;
            });

            // Check if this was the last player
            const isLastPlayer = currentPlayerIndex === activePlayers.length - 1;

            if (isLastPlayer) {
                // All players have received their card - start betting round
                const dealerIndex = activePlayers.findIndex(p => p.seat === state.currentHand!.dealerSeat);
                const firstToAct = activePlayers[(dealerIndex + 1) % activePlayers.length];

                return {
                    ...state,
                    currentHand: {
                        ...state.currentHand,
                        playerHands: updatedPlayerHands,
                        activePlayerId: firstToAct.id,
                        currentBet: 0,
                        perPlayerCommitted: {}
                    }
                };
            } else {
                // Move to next player
                return {
                    ...state,
                    currentHand: {
                        ...state.currentHand,
                        playerHands: updatedPlayerHands
                    }
                };
            }
        });

        // Move to next player or close dialog
        if (currentPlayerIndex < activePlayers.length - 1) {
            setCurrentPlayerIndex(currentPlayerIndex + 1);
            setSelectedCard("");
        } else {
            // Reset for next time
            setCurrentPlayerIndex(0);
            setSelectedCard("");
        }
    };

    return (
        <Dialog open={needsStudCard} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Deal {streetName} Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                            Dealing to: <span className="font-bold">{currentPlayer.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Card {cardCount + 1} of 5 (Face-Up)
                        </div>
                    </div>

                    {/* Current player's existing cards */}
                    {playerHand && playerHand.cards.length > 0 && (
                        <div className="flex justify-center gap-2 p-3 bg-muted/30 rounded">
                            {playerHand.cards.map((card, i) => (
                                <div
                                    key={i}
                                    className={`w-10 h-14 rounded border-2 shadow flex items-center justify-center text-sm font-bold ${card.faceUp
                                            ? 'bg-white border-gray-300 text-black'
                                            : 'bg-blue-600 border-blue-700 text-white'
                                        }`}
                                >
                                    {card.faceUp ? card.code : '🂠'}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Selected card preview */}
                    <div className="flex justify-center">
                        {selectedCard ? (
                            <div className="w-16 h-22 bg-white rounded border-2 border-primary shadow-lg flex items-center justify-center text-2xl font-bold text-black">
                                {selectedCard}
                            </div>
                        ) : (
                            <div className="w-16 h-22 bg-muted rounded border-2 border-dashed border-muted-foreground/30" />
                        )}
                    </div>

                    <div className="h-56">
                        <CardKeyboard onCardSelect={handleCardSelect} />
                    </div>

                    <Button
                        size="lg"
                        className="w-full"
                        onClick={handleConfirm}
                        disabled={!selectedCard}
                    >
                        Confirm Card
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

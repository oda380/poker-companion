import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState, useEffect } from "react";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";

export function StudCardDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const players = usePokerStore((state) => state.players);
    const [selectedCard, setSelectedCard] = useState<string>("");
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(true);

    // Only show if waiting for Stud card dealing
    const needsStudCard = currentHand?.activePlayerId === "WAITING_FOR_STUD_CARD";
    const isStud = currentHand?.gameVariant === "fiveCardStud";

    // Sync isOpen with needsStudCard
    useEffect(() => {
        if (needsStudCard) {
            setIsOpen(true);
        }
    }, [needsStudCard]);

    if (!currentHand || !isStud) return null;
    if (!needsStudCard) return null;

    const streetName = currentHand.currentStreet.replace("street", "Street ");

    if (!isOpen) {
        return (
            <div className="fixed bottom-24 right-4 z-50">
                <Button
                    size="lg"
                    className="h-14 px-6 shadow-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-bottom-4"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="mr-2 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">
                        {streetName.split(" ")[1]}
                    </div>
                    Resume Dealing
                </Button>
            </div>
        );
    }

    const activePlayers = players.filter(p =>
        !p.isSittingOut && p.status !== "folded"
    );

    if (activePlayers.length === 0) return null;

    const currentPlayer = activePlayers[currentPlayerIndex];
    const playerHand = currentHand.playerHands.find(h => h.playerId === currentPlayer.id);
    const cardCount = playerHand?.cards.length || 0;


    const handleCardSelect = (cardCode: string) => {
        setSelectedCard(cardCode);
    };

    const handleConfirm = () => {
        if (!selectedCard) return;

        usePokerStore.setState((state) => {
            if (!state.currentHand) return state;

            // All cards dealt through this dialog are face-up
            // (Hole card is already a placeholder from initialization)
            const isFaceUp = true;

            // Add card to current player's hand
            const updatedPlayerHands = state.currentHand.playerHands.map(ph => {
                if (ph.playerId === currentPlayer.id) {
                    return {
                        ...ph,
                        cards: [...ph.cards, { code: selectedCard, faceUp: isFaceUp }]
                    };
                }
                return ph;
            });

            // Check if this was the last player
            const isLastPlayer = currentPlayerIndex === activePlayers.length - 1;

            if (isLastPlayer) {
                // All players have received their card - check if we can bet
                const bettingPlayers = activePlayers.filter(p => p.status === "active");

                if (bettingPlayers.length < 2) {
                    // All-in scenario: Skip betting, go to next street
                    let nextStreet = state.currentHand.currentStreet;
                    let nextActiveId = "";

                    const getNextStreet = (s: string) => {
                        if (s === "street1") return "street2";
                        if (s === "street2") return "street3";
                        if (s === "street3") return "street4";
                        if (s === "street4") return "street5";
                        return "showdown";
                    };

                    const upcomingStreet = getNextStreet(state.currentHand.currentStreet);

                    if (upcomingStreet === "showdown") {
                        nextStreet = "showdown";
                        nextActiveId = "";
                    } else {
                        nextStreet = upcomingStreet as any;
                        nextActiveId = "WAITING_FOR_STUD_CARD";
                    }

                    return {
                        ...state,
                        currentHand: {
                            ...state.currentHand,
                            playerHands: updatedPlayerHands,
                            activePlayerId: nextActiveId,
                            currentStreet: nextStreet,
                            currentBet: 0,
                            perPlayerCommitted: {}
                        }
                    };
                } else {
                    // Normal betting round
                    const dealerIndex = activePlayers.findIndex(p => p.seat === state.currentHand!.dealerSeat);
                    // Find next active player (not all-in)
                    // Note: In Stud, high hand usually acts first, but for MVP we use rotation
                    // TODO: Implement high-hand-acts-first logic for Stud

                    // Simple rotation for now, skipping all-ins
                    let nextIdx = (dealerIndex + 1) % activePlayers.length;
                    let nextPlayer = activePlayers[nextIdx];
                    let attempts = 0;

                    while (nextPlayer.status === "allIn" && attempts < activePlayers.length) {
                        nextIdx = (nextIdx + 1) % activePlayers.length;
                        nextPlayer = activePlayers[nextIdx];
                        attempts++;
                    }

                    return {
                        ...state,
                        currentHand: {
                            ...state.currentHand,
                            playerHands: updatedPlayerHands,
                            activePlayerId: nextPlayer.id,
                            currentBet: 0,
                            perPlayerCommitted: {}
                        }
                    };
                }
            } else {
                // Move to next player for dealing
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
        <Dialog open={needsStudCard && isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
            <DialogContent className="sm:max-w-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Deal {streetName} Card</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Select a card to deal face-up to the current player.
                    </div>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPlayer.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-wider text-sm border border-primary/20 uppercase">
                                {streetName}
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Dealing to</div>
                                <div className="text-4xl font-bold text-primary">{currentPlayer.name}</div>
                            </div>

                            <div className="text-xs text-muted-foreground font-medium bg-muted inline-block px-3 py-1 rounded-full">
                                Card {cardCount + 1} of 5 (Face-Up)
                            </div>
                        </div>

                        {/* Current player's existing cards */}
                        {playerHand && playerHand.cards.length > 0 && (
                            <div className="flex justify-center gap-2 p-3 bg-muted/30 rounded-xl overflow-x-auto">
                                {playerHand.cards.map((card, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Card code={card.code} faceUp={card.faceUp} size="small" />
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Selected card preview */}
                        <div className="flex justify-center h-32 items-center">
                            {selectedCard ? (
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                >
                                    <Card code={selectedCard} faceUp={true} size="large" />
                                </motion.div>
                            ) : (
                                <div className="w-20 h-28 bg-muted/50 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center animate-pulse">
                                    <span className="text-xs text-muted-foreground font-medium">Select Card</span>
                                </div>
                            )}
                        </div>

                        <div className="h-48 bg-muted/20 rounded-xl p-2">
                            <CardKeyboard
                                onCardSelect={handleCardSelect}
                                usedCards={[
                                    // All cards from all player hands
                                    ...currentHand.playerHands.flatMap(ph => ph.cards.map(c => c.code)),
                                    // Currently selected card (if any)
                                    ...(selectedCard ? [selectedCard] : [])
                                ]}
                            />
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-14 text-lg font-bold shadow-md"
                            onClick={handleConfirm}
                            disabled={!selectedCard}
                        >
                            Confirm Card
                        </Button>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

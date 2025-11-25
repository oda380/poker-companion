import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState } from "react";
import { evaluateWinners } from "@/lib/hand-evaluator";
import { Trophy } from "lucide-react";
import { Card } from "./Card";

interface EvaluationResult {
    winners: Array<{ playerId: string; handDescription: string }>;
    allHands: Record<string, { cards: string[]; handDescription: string }>;
}

export function ShowdownDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const players = usePokerStore((state) => state.players);
    const [playerHands, setPlayerHands] = useState<Record<string, string[]>>({});
    const [currentInputPlayer, setCurrentInputPlayer] = useState<string | null>(null);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

    // Only show if hand is in showdown phase (no active player)
    const isShowdown = currentHand && currentHand.activePlayerId === "";

    if (!isShowdown) return null;

    const remainingPlayers = players.filter(p =>
        !p.isSittingOut &&
        p.status !== "folded" &&
        currentHand.playerHands.some(ph => ph.playerId === p.id)
    );

    const totalPot = (currentHand.pots?.reduce((sum, pot) => sum + pot.amount, 0) || 0) +
        Object.values(currentHand.perPlayerCommitted).reduce((sum, amt) => sum + amt, 0);

    // For Stud, extract face-up cards and check if hole cards need input
    const isStud = currentHand.gameVariant === "fiveCardStud";

    // Auto-populate logic removed to ensure hole card input is triggered


    // Check if we're still inputting hands
    // For Stud: need to input hole card (1 card) for each player
    // For Hold'em: need to input 2 hole cards for each player
    const playersNeedingInput = remainingPlayers.filter(p => {
        const hand = playerHands[p.id];
        if (isStud) {
            // Stud: need exactly 1 more card (the hole card)
            return !hand || hand.length < 1;
        } else {
            // Hold'em: need 2 cards
            return !hand || hand.length < 2;
        }
    });
    const needsInput = playersNeedingInput.length > 0;

    const handleCardSelect = (cardCode: string) => {
        const maxCards = isStud ? 1 : 2; // Stud: 1 hole card, Hold'em: 2 hole cards
        if (selectedCards.length < maxCards) {
            setSelectedCards([...selectedCards, cardCode]);
        }
    };

    const handleRemoveLast = () => {
        setSelectedCards(selectedCards.slice(0, -1));
    };

    const handleConfirmHand = () => {
        const requiredCards = isStud ? 1 : 2;
        if (currentInputPlayer && selectedCards.length === requiredCards) {
            setPlayerHands({
                ...playerHands,
                [currentInputPlayer]: selectedCards
            });
            setSelectedCards([]);
            setCurrentInputPlayer(null);
        }
    };

    const handleStartInput = (playerId: string) => {
        setCurrentInputPlayer(playerId);
        setSelectedCards([]);
    };

    const handleEvaluate = () => {
        if (!currentHand) return;

        try {
            // For Stud, combine hole cards (from input) with face-up cards (from hand state)
            let fullPlayerHands = { ...playerHands };
            if (isStud) {
                fullPlayerHands = {};
                Object.entries(playerHands).forEach(([playerId, holeCards]) => {
                    // Get face-up cards from current hand
                    const playerHandState = currentHand.playerHands.find(ph => ph.playerId === playerId);
                    const faceUpCards = playerHandState?.cards.filter(c => c.faceUp && c.code).map(c => c.code) || [];

                    // Combine: hole card(s) + face-up cards
                    const combined = [...holeCards, ...faceUpCards];

                    // Validate: Stud hands should have cards (usually 5, but at least some)
                    if (combined.length === 0) {
                        console.warn(`Player ${playerId} has no cards to evaluate`);
                    }

                    fullPlayerHands[playerId] = combined;
                });
            }

            // Evaluate winners using poker-evaluator
            const winners = evaluateWinners(
                fullPlayerHands,
                currentHand.board,
                currentHand.gameVariant
            );

            if (!winners || winners.length === 0) {
                // If evaluation failed (returned empty), show error
                alert("Error evaluating hands. Please check that all cards are entered correctly.");
                return;
            }

            // Store all hands with descriptions for display
            const allHands: Record<string, { cards: string[]; handDescription: string }> = {};
            Object.entries(fullPlayerHands).forEach(([playerId, cards]) => {
                const winner = winners.find(w => w.playerId === playerId);
                allHands[playerId] = {
                    cards,
                    handDescription: winner?.handDescription || "Lost"
                };
                // Reveal hand on table
                usePokerStore.getState().revealHand(playerId, cards);
            });

            setEvaluationResult({ winners, allHands });
        } catch (e) {
            console.error("Handle evaluate error:", e);
            alert("An unexpected error occurred during evaluation.");
        }
    };

    const handleConfirmResults = () => {
        if (!currentHand || !evaluationResult) return;

        // Calculate total pot
        const totalPot = (currentHand.pots?.reduce((sum, pot) => sum + pot.amount, 0) || 0) +
            Object.values(currentHand.perPlayerCommitted).reduce((sum, amt) => sum + amt, 0);

        // Award pot to winners
        const potPerWinner = Math.floor(totalPot / evaluationResult.winners.length);

        const summary = {
            id: Math.random().toString(36).substring(2, 15),
            handNumber: currentHand.handNumber,
            gameVariant: currentHand.gameVariant,
            dealerSeat: currentHand.dealerSeat,
            winners: evaluationResult.winners.map(w => ({
                playerId: w.playerId,
                potShare: potPerWinner,
                handDescription: w.handDescription
            })),
            playerHands: Object.entries(evaluationResult.allHands).map(([playerId, info]) => ({
                playerId,
                cards: info.cards,
                handDescription: info.handDescription
            })),
            totalPot,
            createdAt: new Date().toISOString()
        };

        // Save to DB before clearing state
        import('@/lib/db').then(({ saveHand }) => {
            saveHand(usePokerStore.getState().id, currentHand, summary);
        });

        usePokerStore.setState((state) => ({
            ...state,
            players: state.players.map(p => {
                const winner = evaluationResult.winners.find(w => w.playerId === p.id);
                return winner ? { ...p, stack: p.stack + potPerWinner, wins: (p.wins || 0) + 1 } : p;
            }),
            currentHand: undefined,
            handHistory: [
                ...state.handHistory,
                summary
            ]
        }));

        // Reset state
        setPlayerHands({});
        setEvaluationResult(null);
    };

    const handleClose = (open: boolean) => {
        if (open) return; // Only handle closing

        if (currentInputPlayer) {
            // If inputting a hand, go back to player list
            setCurrentInputPlayer(null);
            setSelectedCards([]);
        } else {
            // Otherwise, close dialog (undo)
            usePokerStore.temporal.getState().undo();
        }
    };

    return (
        <Dialog open={isShowdown} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {evaluationResult ? "Showdown Results" : "Showdown - Input Player Hands"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Pot</div>
                        <div className="text-4xl font-bold text-primary">{totalPot}</div>
                    </div>

                    {/* Board Cards */}
                    {currentHand.board.length > 0 && (
                        <div className="flex justify-center gap-2 p-4 bg-muted/30 rounded">
                            {currentHand.board.map((card, i) => (
                                <Card key={i} code={card} faceUp={true} size="medium" />
                            ))}
                        </div>
                    )}

                    {evaluationResult ? (
                        /* Results Screen */
                        <div className="space-y-4">
                            {remainingPlayers.map((player) => {
                                const isWinner = evaluationResult.winners.some(w => w.playerId === player.id);
                                const handInfo = evaluationResult.allHands[player.id];

                                return (
                                    <div
                                        key={player.id}
                                        className={`p-4 rounded-lg border-2 ${isWinner
                                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                                            : 'border-gray-200 bg-gray-50 dark:bg-gray-900'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {isWinner && <Trophy className="w-5 h-5 text-yellow-500" />}
                                                <span className="font-bold text-lg">{player.name}</span>
                                            </div>
                                            <span className={`text-sm font-medium ${isWinner ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                                                {handInfo?.handDescription}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {handInfo?.cards.map((card, i) => (
                                                <Card key={i} code={card} faceUp={true} size="small" />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleConfirmResults}
                            >
                                Confirm & Start Next Hand
                            </Button>
                        </div>
                    ) : needsInput ? (
                        /* Hand Input Screen */
                        <>
                            {currentInputPlayer ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="font-bold text-lg">
                                            {players.find(p => p.id === currentInputPlayer)?.name}'s Hand
                                        </div>
                                        <div className="flex justify-center gap-2 mt-2 h-24 items-center">
                                            {selectedCards.map((card, i) => (
                                                <Card key={i} code={card} faceUp={true} size="medium" />
                                            ))}
                                            {Array.from({ length: (isStud ? 1 : 2) - selectedCards.length }).map((_, i) => (
                                                <div
                                                    key={`empty-${i}`}
                                                    className="w-14 h-20 bg-muted rounded border-2 border-dashed border-muted-foreground/30"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-48">
                                        <CardKeyboard
                                            onCardSelect={handleCardSelect}
                                            usedCards={[
                                                // Board cards (Hold'em)
                                                ...currentHand.board,
                                                // All entered player hands
                                                ...Object.values(playerHands).flat(),
                                                // Currently selected cards
                                                ...selectedCards
                                            ]}
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
                                            onClick={handleConfirmHand}
                                            disabled={selectedCards.length !== (isStud ? 1 : 2)}
                                        >
                                            Confirm Hand
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Select player to input their hand:</div>
                                    {remainingPlayers.map((player) => (
                                        <Button
                                            key={player.id}
                                            variant="outline"
                                            className="w-full h-14 text-lg justify-start"
                                            onClick={() => handleStartInput(player.id)}
                                        >
                                            {player.name}
                                            {playerHands[player.id] && (
                                                <span className="ml-2 text-sm text-green-600">✓ Hand entered</span>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center text-sm text-muted-foreground">
                                All hands entered. Click below to evaluate and see results.
                            </div>
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleEvaluate}
                            >
                                Evaluate Hands
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

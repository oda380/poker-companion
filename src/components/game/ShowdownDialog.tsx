"use client";

import { usePokerStore } from "@/store/usePokerStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState, useEffect } from "react";
import { evaluateWinners } from "@/lib/hand-evaluator";
import { Trophy, Check, Eye } from "lucide-react";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getStreetColor } from "@/lib/utils";

interface EvaluationResult {
  winners: Array<{ playerId: string; handDescription: string }>;
  allHands: Record<string, { cards: string[]; handDescription: string }>;
}

export function ShowdownDialog() {
  const currentHand = usePokerStore((state) => state.currentHand);
  const players = usePokerStore((state) => state.players);
  const [playerHands, setPlayerHands] = useState<Record<string, string[]>>({});
  const [currentInputPlayer, setCurrentInputPlayer] = useState<string | null>(
    null
  );
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [activeSlot, setActiveSlot] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);

  // Only show if hand is in showdown phase (no active player)
  const isShowdown = currentHand && currentHand.activePlayerId === "";

  const isShowdownDialogOpen = usePokerStore(
    (state) => state.ui.isShowdownDialogOpen
  );
  const setUiState = usePokerStore((state) => state.setUiState);

  // Sync isOpen with isShowdown
  useEffect(() => {
    if (isShowdown) {
      setUiState({ isShowdownDialogOpen: true });
    }
  }, [isShowdown, setUiState]);

  if (!isShowdown) return null;

  const remainingPlayers = players.filter(
    (p) =>
      !p.isSittingOut &&
      p.status !== "folded" &&
      currentHand.playerHands.some((ph) => ph.playerId === p.id)
  );

  const totalPot =
    (currentHand.pots?.reduce((sum, pot) => sum + pot.amount, 0) || 0) +
    Object.values(currentHand.perPlayerCommitted).reduce(
      (sum, amt) => sum + amt,
      0
    );

  // For Stud, extract face-up cards and check if hole cards need input
  const isStud = currentHand.gameVariant === "fiveCardStud";

  // Check if we're still inputting hands
  const playersNeedingInput = remainingPlayers.filter((p) => {
    const hand = playerHands[p.id];
    if (isStud) {
      return !hand || hand.length < 1;
    } else {
      return !hand || hand.length < 2;
    }
  });
  const needsInput = playersNeedingInput.length > 0;

  const handleCardSelect = (cardCode: string) => {
    const maxCards = isStud ? 1 : 2;
    const newCards = [...selectedCards];

    // Ensure array is big enough (fill with empty strings if needed)
    while (newCards.length < maxCards) newCards.push("");

    newCards[activeSlot] = cardCode;
    setSelectedCards(newCards);

    // Auto-advance if not last slot
    if (activeSlot < maxCards - 1) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleConfirmHand = () => {
    const requiredCards = isStud ? 1 : 2;
    // Check if all slots are filled (no empty strings)
    const filledCards = selectedCards.filter((c) => c !== "");
    if (currentInputPlayer && filledCards.length === requiredCards) {
      setPlayerHands({
        ...playerHands,
        [currentInputPlayer]: filledCards,
      });
      setSelectedCards([]);
      setCurrentInputPlayer(null);
    }
  };

  const handleStartInput = (playerId: string) => {
    setCurrentInputPlayer(playerId);
    const maxCards = isStud ? 1 : 2;

    // Pre-fill with existing hand if available
    if (playerHands[playerId]) {
      const existing = [...playerHands[playerId]];
      while (existing.length < maxCards) existing.push("");
      setSelectedCards(existing);
    } else {
      // Initialize with empty strings
      setSelectedCards(Array(maxCards).fill(""));
    }
    setActiveSlot(0);
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
          const playerHandState = currentHand.playerHands.find(
            (ph) => ph.playerId === playerId
          );
          const faceUpCards =
            playerHandState?.cards
              .filter((c) => c.faceUp && c.code)
              .map((c) => c.code) || [];

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
      const winners = evaluateWinners(fullPlayerHands, currentHand.board);

      if (!winners || winners.length === 0) {
        // If evaluation failed (returned empty), show error
        alert(
          "Error evaluating hands. Please check that all cards are entered correctly."
        );
        return;
      }

      // Store all hands with descriptions for display
      const allHands: Record<
        string,
        { cards: string[]; handDescription: string }
      > = {};
      Object.entries(fullPlayerHands).forEach(([playerId, cards]) => {
        const winner = winners.find((w) => w.playerId === playerId);
        allHands[playerId] = {
          cards,
          handDescription: winner?.handDescription || "Lost",
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
    const totalPot =
      (currentHand.pots?.reduce((sum, pot) => sum + pot.amount, 0) || 0) +
      Object.values(currentHand.perPlayerCommitted).reduce(
        (sum, amt) => sum + amt,
        0
      );

    // Award pot to winners
    const potPerWinner = Math.floor(totalPot / evaluationResult.winners.length);

    const summary = {
      id: Math.random().toString(36).substring(2, 15),
      handNumber: currentHand.handNumber,
      gameVariant: currentHand.gameVariant,
      dealerSeat: currentHand.dealerSeat,
      winners: evaluationResult.winners.map((w) => ({
        playerId: w.playerId,
        potShare: potPerWinner,
        handDescription: w.handDescription,
      })),
      playerHands: Object.entries(evaluationResult.allHands).map(
        ([playerId, info]) => ({
          playerId,
          cards: info.cards,
          handDescription: info.handDescription,
        })
      ),
      totalPot,
      createdAt: new Date().toISOString(),
    };

    // Save to DB before clearing state
    import("@/lib/db").then(({ saveHand }) => {
      saveHand(usePokerStore.getState().id, currentHand, summary);
    });

    usePokerStore.setState((state) => ({
      ...state,
      players: state.players.map((p) => {
        const winner = evaluationResult.winners.find(
          (w) => w.playerId === p.id
        );
        return winner
          ? { ...p, stack: p.stack + potPerWinner, wins: (p.wins || 0) + 1 }
          : p;
      }),
      currentHand: undefined,
      handHistory: [...state.handHistory, summary],
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
    } else if (isReviewing) {
      // If reviewing, go back to "All Set" view (if all valid)
      setIsReviewing(false);
    } else {
      // Otherwise, close dialog (undo)
      usePokerStore.temporal.getState().undo();
    }
    setUiState({ isShowdownDialogOpen: false });
  };

  // Helper to check if hand is complete
  const isHandComplete =
    selectedCards.filter((c) => c !== "").length === (isStud ? 1 : 2);

  return (
    <Dialog
      open={isShowdown && isShowdownDialogOpen}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {evaluationResult ? (
              <>
                <Trophy className="w-6 h-6 text-amber-500" />
                Showdown Results
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "px-3 py-1 rounded-full border text-sm font-bold tracking-wider uppercase",
                    getStreetColor("showdown")
                  )}
                >
                  Showdown
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!evaluationResult && !currentInputPlayer && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm">
                <div className="font-bold text-amber-900 dark:text-amber-100">
                  {isStud ? "Reveal Hole Cards" : "Reveal Hands"}
                </div>
                <div className="text-amber-800/80 dark:text-amber-200/80">
                  {isStud
                    ? "Input the final face-down hole card for each player to determine the winner."
                    : "Input the hole cards for each active player."}
                </div>
              </div>
            </div>
          )}
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
            <div className="space-y-6">
              <AnimatePresence>
                {evaluationResult.winners.map((winner, idx) => {
                  const player = players.find((p) => p.id === winner.playerId);
                  const handInfo = evaluationResult.allHands[winner.playerId];

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-24 h-24" />
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-6 h-6 text-amber-500" />
                          <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-sm">
                            Winner
                          </span>
                        </div>

                        <div className="text-3xl font-bold mb-1">
                          {player?.name || "Unknown"}
                        </div>
                        <div className="text-xl text-muted-foreground mb-4">
                          {winner.handDescription}
                        </div>

                        <div className="flex gap-2 mb-4">
                          {handInfo?.cards.map((card, i) => (
                            <Card
                              key={i}
                              code={card}
                              faceUp={true}
                              size="medium"
                            />
                          ))}
                        </div>

                        <div className="text-lg font-medium">
                          Wins{" "}
                          <span className="text-primary font-bold">
                            {Math.floor(
                              totalPot / evaluationResult.winners.length
                            )}
                          </span>{" "}
                          chips
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <Button
                className="w-full h-14 text-lg font-bold"
                onClick={handleConfirmResults}
              >
                Start Next Hand
              </Button>
            </div>
          ) : needsInput || isReviewing ? (
            /* Hand Input Screen */
            <AnimatePresence mode="wait">
              {currentInputPlayer ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                        Input Hand For
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {players.find((p) => p.id === currentInputPlayer)?.name}
                      </div>
                    </div>

                    {/* Card Display Area - Responsive Layout */}
                    <div className="flex flex-col md:flex-row justify-center gap-4 mt-4 items-center">
                      {/* Face-up cards for Stud - Always in a row */}
                      {isStud && (
                        <div className="flex gap-3 justify-center">
                          {currentHand.playerHands
                            .find((ph) => ph.playerId === currentInputPlayer)
                            ?.cards.filter((c) => c.faceUp)
                            .map((card, i) => (
                              <motion.div
                                key={`faceup-${i}`}
                                className="opacity-90 grayscale-[0.3]"
                              >
                                <Card
                                  code={card.code}
                                  faceUp={true}
                                  size="large"
                                />
                              </motion.div>
                            ))}
                        </div>
                      )}

                      {/* Input Slots for Hole Card(s) */}
                      <div className="flex gap-4 justify-center min-h-[120px] items-center">
                        {Array.from({ length: isStud ? 1 : 2 }).map((_, i) => {
                          const card = selectedCards[i];
                          const isActive = i === activeSlot;

                          return (
                            <motion.div
                              key={i}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setActiveSlot(i)}
                              className={`relative cursor-pointer rounded-xl transition-all ${
                                isActive
                                  ? "ring-4 ring-primary ring-offset-2 ring-offset-background z-10"
                                  : "hover:ring-2 hover:ring-primary/50"
                              }`}
                            >
                              {card ? (
                                <Card code={card} faceUp={true} size="large" />
                              ) : (
                                <div className="w-20 h-28 bg-muted/50 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {isStud ? "Hole Card" : `Card ${i + 1}`}
                                  </span>
                                </div>
                              )}

                              {/* Active Indicator */}
                              {isActive && (
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-primary font-bold text-xs animate-bounce">
                                  EDITING
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="h-48 bg-muted/20 rounded-xl p-2">
                    <CardKeyboard
                      onCardSelect={handleCardSelect}
                      usedCards={[
                        ...currentHand.board,
                        // Include all face-up cards from all players to prevent duplicates
                        ...currentHand.playerHands.flatMap((ph) =>
                          ph.cards
                            .filter((c) => c.faceUp && c.code)
                            .map((c) => c.code)
                        ),
                        ...Object.values(playerHands).flat(),
                        ...selectedCards.filter((c) => c !== ""),
                      ]}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="w-full h-12 text-lg font-bold"
                      onClick={handleConfirmHand}
                      disabled={!isHandComplete}
                    >
                      Confirm Hand
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold">
                      Who&apos;s still in?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tap a player to enter their hole cards
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {remainingPlayers.map((player) => {
                      const hasHand = !!playerHands[player.id];
                      return (
                        <motion.button
                          key={player.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStartInput(player.id)}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            hasHand
                              ? "bg-green-500/10 border-green-500/50"
                              : "bg-card hover:bg-accent border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-bold text-lg truncate">
                            {player.name}
                          </div>
                          <div
                            className={`text-sm mt-1 flex items-center gap-1 ${
                              hasHand
                                ? "text-green-600 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {hasHand ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Ready</span>
                              </>
                            ) : (
                              <span>Tap to enter</span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {isReviewing && !needsInput && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-2"
                    >
                      <Button
                        className="w-full h-12 text-lg font-bold"
                        variant="secondary"
                        onClick={() => setIsReviewing(false)}
                      >
                        Done Reviewing
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-8"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold">All Set!</h3>
                <p className="text-muted-foreground">
                  Hands are entered. Ready to see who won?
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-16 text-xl font-bold shadow-lg animate-pulse text-white"
                  onClick={handleEvaluate}
                >
                  Evaluate Hands
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-lg font-medium border-2 border-dashed"
                  onClick={() => setIsReviewing(true)}
                >
                  Review / Edit Hands
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

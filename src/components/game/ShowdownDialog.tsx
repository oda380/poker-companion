"use client";

import { usePokerStore } from "@/store/usePokerStore";
import { applyPayoutsToPlayers } from "@/lib/payout-calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState, useEffect, useMemo } from "react";
import { evaluateShowdown } from "@/lib/hand-evaluator";
import { Trophy, Check, Eye } from "lucide-react";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getStreetColor } from "@/lib/utils";
import { GAME_VARIANTS } from "@/lib/constants";
import { getTotalPotValue } from "@/lib/game-logic";

interface EvaluationResult {
  potResults: Array<{
    potId: string;
    potAmount: number;
    winners: Array<{ playerId: string; handDescription: string }>;
    eligiblePlayerIds: string[];
  }>;
  allHands: Record<string, { cards: string[]; handDescription: string }>;
  refunds: Record<string, number>;
}

function buildSeatRing(
  playersInHand: Array<{ id: string; seat: number }>,
  dealerSeat: number
) {
  const sorted = [...playersInHand].sort((a, b) => a.seat - b.seat);
  const dealerIdx = sorted.findIndex((p) => p.seat === dealerSeat);

  // Ring order starts at the first seat clockwise AFTER dealer.
  if (dealerIdx >= 0) {
    return [...sorted.slice(dealerIdx + 1), ...sorted.slice(0, dealerIdx + 1)];
  }
  // Fallback: dealer not found (should be rare) -> just use sorted order
  return sorted;
}

/**
 * Apply refunds to shares map (used in both uiShares and handleConfirmResults)
 * to ensure they stay in sync.
 *
 * Pure function - returns a new object, safe for useMemo.
 */
function applyRefundsToShares(
  shares: Record<string, number>,
  refunds: Record<string, number>
): Record<string, number> {
  const next = { ...shares };
  for (const [playerId, amt] of Object.entries(refunds)) {
    next[playerId] = (next[playerId] || 0) + amt;
  }
  return next;
}

function calculateWinnerSharesFromPotResults(args: {
  potResults: EvaluationResult["potResults"];
  players: Array<{ id: string; seat: number }>;
  dealerSeat: number;
}): Record<string, number> {
  const { potResults, players, dealerSeat } = args;

  const shares: Record<string, number> = {};

  for (const potResult of potResults) {
    const eligiblePlayers = players.filter((p) =>
      potResult.eligiblePlayerIds.includes(p.id)
    );

    const ring = buildSeatRing(
      eligiblePlayers.map((p) => ({ id: p.id, seat: p.seat })),
      dealerSeat
    );

    const pos = new Map<string, number>();
    ring.forEach((p, idx) => pos.set(p.id, idx));

    const winnersSorted = [...potResult.winners].sort(
      (a, b) =>
        (pos.get(a.playerId) ?? Number.MAX_SAFE_INTEGER) -
        (pos.get(b.playerId) ?? Number.MAX_SAFE_INTEGER)
    );

    const n = Math.max(1, winnersSorted.length);
    const base = Math.floor(potResult.potAmount / n);
    const rem = potResult.potAmount % n;

    winnersSorted.forEach((w, i) => {
      const potShare = base + (i < rem ? 1 : 0);
      shares[w.playerId] = (shares[w.playerId] || 0) + potShare;
    });
  }

  return shares;
}

/** ✅ Single source of truth: winners shares + refunds */
function calculateFinalShares(args: {
  potResults: EvaluationResult["potResults"];
  refunds: EvaluationResult["refunds"];
  players: Array<{ id: string; seat: number }>;
  dealerSeat: number;
}): Record<string, number> {
  const baseShares = calculateWinnerSharesFromPotResults({
    potResults: args.potResults,
    players: args.players,
    dealerSeat: args.dealerSeat,
  });

  return applyRefundsToShares(baseShares, args.refunds);
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

  const isShowdown = currentHand && currentHand.activePlayerId === "";
  const isShowdownDialogOpen = usePokerStore(
    (state) => state.ui.isShowdownDialogOpen
  );
  const setUiState = usePokerStore((state) => state.setUiState);

  useEffect(() => {
    if (isShowdown) setUiState({ isShowdownDialogOpen: true });
  }, [isShowdown, setUiState]);

  // SAFE: can be computed even when currentHand is undefined
  const isStud = currentHand?.gameVariant === GAME_VARIANTS.FIVE_CARD_STUD.id;

  const getRequiredCardsForPlayer = (playerId: string) => {
    if (!currentHand) return isStud ? 1 : 2;
    if (!isStud) return 2;

    const handState = currentHand.playerHands.find(
      (ph) => ph.playerId === playerId
    );
    if (!handState) return 1;

    const missingDown = handState.cards.filter(
      (c) => !c.faceUp && !c.code
    ).length;

    return Math.max(0, missingDown);
  };

  // ✅ Hook must be unconditional (called every render before any return)
  const requiredCardsForCurrent = useMemo(() => {
    if (!currentInputPlayer) return isStud ? 1 : 2;
    return getRequiredCardsForPlayer(currentInputPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInputPlayer, isStud, currentHand?.id, currentHand?.playerHands]);

  // ✅ Compute shares for UI display with useMemo (matches confirm payout exactly)
  const dealerSeat = currentHand?.dealerSeat;
  const uiShares = useMemo(() => {
    if (!evaluationResult || dealerSeat === undefined) return null;

    return calculateFinalShares({
      potResults: evaluationResult.potResults,
      refunds: evaluationResult.refunds,
      players,
      dealerSeat,
    });
  }, [evaluationResult, players, dealerSeat]);

  // Early return AFTER hooks
  if (!isShowdown || !currentHand) return null;

  const remainingPlayers = players.filter(
    (p) =>
      !p.isSittingOut &&
      p.status !== "folded" &&
      currentHand.playerHands.some((ph) => ph.playerId === p.id)
  );

  const totalPot = getTotalPotValue(currentHand);

  const playersNeedingInput = remainingPlayers.filter((p) => {
    const required = getRequiredCardsForPlayer(p.id);
    const entered = playerHands[p.id]?.filter(Boolean).length || 0;
    return entered < required;
  });
  const needsInput = playersNeedingInput.length > 0;

  const handleCardSelect = (cardCode: string) => {
    if (!currentInputPlayer) return;

    const maxCards = requiredCardsForCurrent;
    if (maxCards <= 0) return;

    const newCards = [...selectedCards];
    while (newCards.length < maxCards) newCards.push("");

    newCards[activeSlot] = cardCode;
    setSelectedCards(newCards);

    if (activeSlot < maxCards - 1) setActiveSlot(activeSlot + 1);
  };

  const handleConfirmHand = () => {
    const required = requiredCardsForCurrent;
    const filled = selectedCards.filter((c) => c !== "");

    if (currentInputPlayer && (required === 0 || filled.length === required)) {
      setPlayerHands({
        ...playerHands,
        [currentInputPlayer]: filled,
      });
      setSelectedCards([]);
      setCurrentInputPlayer(null);
      setActiveSlot(0);
    }
  };

  const handleStartInput = (playerId: string) => {
    setCurrentInputPlayer(playerId);
    const existing = playerHands[playerId];
    setSelectedCards(existing && existing.length > 0 ? existing : []);
    setActiveSlot(0);
  };

  const handleEvaluate = async () => {
    try {
      if (!isStud && currentHand.board.length !== 5) {
        alert("Please deal all 5 community cards (runout) before evaluating.");
        return;
      }

      const fullPlayerHands: Record<string, string[]> = {};

      for (const p of remainingPlayers) {
        const pid = p.id;
        const required = getRequiredCardsForPlayer(pid);
        const entered = playerHands[pid]?.filter(Boolean).length || 0;

        if (entered < required) {
          alert("Please enter all required hole cards before evaluating.");
          return;
        }

        const handState = currentHand.playerHands.find(
          (ph) => ph.playerId === pid
        );

        const faceUp =
          handState?.cards
            .filter((c) => c.faceUp && c.code)
            .map((c) => c.code) || [];

        const knownDown =
          handState?.cards
            .filter((c) => !c.faceUp && c.code)
            .map((c) => c.code) || [];

        const inputDown = playerHands[pid] || [];

        const combined = isStud
          ? [...knownDown, ...inputDown, ...faceUp]
          : inputDown;

        if (isStud && combined.length !== 5) {
          alert(
            "Stud hands must have exactly 5 cards at showdown. Please check input/reveals."
          );
          return;
        }
        if (!isStud && combined.length !== 2) {
          alert("Hold'em hands must have exactly 2 hole cards entered.");
          return;
        }

        fullPlayerHands[pid] = combined;
      }

      const board = isStud ? [] : currentHand.board;

      const { calculatePots } = await import("@/lib/pot-calculator");

      const totalCommitted = currentHand.totalCommitted ?? {};

      const playersInThisHand = players.filter((p) =>
        currentHand.playerHands.some((ph) => ph.playerId === p.id)
      );

      const commitments = playersInThisHand.map((p) => ({
        playerId: p.id,
        amount: totalCommitted[p.id] || 0,
        isFolded: p.status === "folded",
      }));

      const { pots, refunds } = calculatePots(commitments);

      if (process.env.NODE_ENV !== "production") {
        const sum = (obj: Record<string, number>) =>
          Object.values(obj).reduce((a, b) => a + b, 0);

        const committedTotal = sum(totalCommitted);
        const potsTotal = pots.reduce((s, p) => s + p.amount, 0);
        const refundsTotal = sum(refunds);

        if (potsTotal + refundsTotal !== committedTotal) {
          console.warn("[POTS INVARIANT FAIL]", {
            committedTotal,
            potsTotal,
            refundsTotal,
            diff: committedTotal - (potsTotal + refundsTotal),
          });
        }
      }

      const potResults: EvaluationResult["potResults"] = [];

      if (pots.length === 0 && Object.keys(refunds).length > 0) {
        console.warn("[SHOWDOWN] No contested pots; applying refunds only.", {
          refunds,
        });
        setEvaluationResult({ potResults: [], allHands: {}, refunds });
        return;
      } else if (pots.length === 0 && Object.keys(refunds).length === 0) {
        alert(
          "No pots or refunds to distribute. Hand might be empty or misconfigured."
        );
        return;
      }

      for (const pot of pots) {
        const eligibleHands: Record<string, string[]> = {};

        for (const playerId of pot.eligiblePlayerIds) {
          if (fullPlayerHands[playerId]) {
            eligibleHands[playerId] = fullPlayerHands[playerId];
          }
        }

        if (Object.keys(eligibleHands).length === 0) continue;

        if (Object.keys(eligibleHands).length === 1) {
          const [playerId] = Object.keys(eligibleHands);
          potResults.push({
            potId: pot.id,
            potAmount: pot.amount,
            winners: [{ playerId, handDescription: "Won uncontested" }],
            eligiblePlayerIds: pot.eligiblePlayerIds,
          });
          continue;
        }

        const { winners } = evaluateShowdown(eligibleHands, board, {
          requireFiveCardBoard: !isStud,
        });

        if (!winners.length) {
          alert(
            `Error evaluating pot ${pot.id}. Please check the entered cards.`
          );
          return;
        }

        potResults.push({
          potId: pot.id,
          potAmount: pot.amount,
          winners,
          eligiblePlayerIds: pot.eligiblePlayerIds,
        });
      }

      const { allHandsByPlayerId } = evaluateShowdown(fullPlayerHands, board, {
        requireFiveCardBoard: !isStud,
      });

      const allHands: EvaluationResult["allHands"] = {};
      for (const [pid, info] of Object.entries(allHandsByPlayerId)) {
        allHands[pid] = {
          cards: info.cards,
          handDescription: info.handDescription,
        };
        usePokerStore.getState().revealHand(pid, info.cards);
      }

      setEvaluationResult({ potResults, allHands, refunds });
    } catch (e) {
      console.error("Handle evaluate error:", e);
      alert("An unexpected error occurred during evaluation.");
    }
  };

  const handleConfirmResults = () => {
    if (!evaluationResult) return;

    const finalShares = calculateFinalShares({
      potResults: evaluationResult.potResults,
      refunds: evaluationResult.refunds,
      players,
      dealerSeat: currentHand.dealerSeat,
    });

    const allWinners = Array.from(
      new Set(
        evaluationResult.potResults.flatMap((pr) =>
          pr.winners.map((w) => w.playerId)
        )
      )
    );

    const playersInThisHand = players.filter((p) =>
      currentHand.playerHands.some((ph) => ph.playerId === p.id)
    );
    const foldedPlayers = playersInThisHand
      .filter((p) => p.status === "folded")
      .map((p) => p.id);

    const totalPot = getTotalPotValue(currentHand);

    const summary = {
      id: Math.random().toString(36).substring(2, 15),
      handNumber: currentHand.handNumber,
      gameVariant: currentHand.gameVariant,
      dealerSeat: currentHand.dealerSeat,
      winners: allWinners.map((playerId) => ({
        playerId,
        potShare: finalShares[playerId] || 0,
        handDescription:
          evaluationResult.allHands[playerId]?.handDescription || "",
      })),
      playerHands: Object.entries(evaluationResult.allHands).map(
        ([playerId, info]) => ({
          playerId,
          cards: info.cards,
          handDescription: info.handDescription,
        })
      ),
      foldedPlayers,
      totalPot,
      potResults: evaluationResult.potResults,
      refunds: evaluationResult.refunds,
      createdAt: new Date().toISOString(),
    };

    import("@/lib/db").then(({ saveHand }) => {
      saveHand(usePokerStore.getState().id, currentHand, summary);
    });

    usePokerStore.setState((state) => ({
      ...state,
      players: applyPayoutsToPlayers(state.players, finalShares, allWinners),
      currentHand: undefined,
      handHistory: [...state.handHistory, summary],
    }));

    setPlayerHands({});
    setEvaluationResult(null);
  };

  const handleClose = (open: boolean) => {
    if (open) return;

    if (currentInputPlayer) {
      setCurrentInputPlayer(null);
      setSelectedCards([]);
    } else if (isReviewing) {
      setIsReviewing(false);
    } else {
      usePokerStore.temporal.getState().undo();
    }
    setUiState({ isShowdownDialogOpen: false });
  };

  const isHandComplete =
    selectedCards.filter((c) => c !== "").length === requiredCardsForCurrent;

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
          <DialogDescription className="sr-only">
            Results of the hand showdown and pot distribution.
          </DialogDescription>
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
                    ? "Input the missing face-down card(s) for each player to determine the winner."
                    : "Input the hole cards for each active player."}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Pot</div>
            <div className="text-4xl font-bold text-primary">{totalPot}</div>
          </div>

          {currentHand.board.length > 0 && (
            <div className="flex justify-center gap-2 p-4 bg-muted/30 rounded">
              {currentHand.board.map((card, i) => (
                <Card key={i} code={card} faceUp={true} size="medium" />
              ))}
            </div>
          )}

          {evaluationResult ? (
            <div className="space-y-6">
              <AnimatePresence>
                {Array.from(
                  new Set(
                    evaluationResult.potResults.flatMap((pr) =>
                      pr.winners.map((w) => w.playerId)
                    )
                  )
                ).map((playerId, idx) => {
                  const player = players.find((p) => p.id === playerId);
                  const handInfo = evaluationResult.allHands[playerId];
                  const winChips = uiShares?.[playerId] ?? 0;

                  return (
                    <motion.div
                      key={playerId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="p-6 rounded-xl bg-linear-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 relative overflow-hidden"
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
                          {handInfo?.handDescription || ""}
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
                            {winChips}
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

                    <div className="flex flex-col md:flex-row justify-center gap-4 mt-4 items-center">
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

                      <div className="flex gap-4 justify-center min-h-[120px] items-center">
                        {Array.from({ length: requiredCardsForCurrent }).map(
                          (_, i) => {
                            const card = selectedCards[i];
                            const isActive = i === activeSlot;

                            return (
                              <motion.div
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveSlot(i)}
                                className={`relative cursor-pointer rounded-xl transition-all ${isActive
                                  ? "ring-4 ring-primary ring-offset-2 ring-offset-background z-10"
                                  : "hover:ring-2 hover:ring-primary/50"
                                  }`}
                              >
                                {card ? (
                                  <Card
                                    code={card}
                                    faceUp={true}
                                    size="large"
                                  />
                                ) : (
                                  <div className="w-20 h-28 bg-muted/50 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {isStud ? "Hole Card" : `Card ${i + 1}`}
                                    </span>
                                  </div>
                                )}

                                {isActive && (
                                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-primary font-bold text-xs animate-bounce">
                                    EDITING
                                  </div>
                                )}
                              </motion.div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-auto bg-muted/20 rounded-xl p-2">
                    <CardKeyboard
                      onCardSelect={handleCardSelect}
                      usedCards={[
                        ...currentHand.board,
                        ...currentHand.playerHands.flatMap((ph) =>
                          ph.cards.filter((c) => !!c.code).map((c) => c.code)
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
                      disabled={requiredCardsForCurrent > 0 && !isHandComplete}
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

                  {(() => {
                    const cardSize =
                      remainingPlayers.length > 6 ? "small" : "medium";

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {remainingPlayers.map((player) => {
                          const required = getRequiredCardsForPlayer(player.id);
                          const entered =
                            playerHands[player.id]?.filter(Boolean).length || 0;
                          const isReady = entered >= required;

                          const hand = playerHands[player.id] || [];

                          return (
                            <motion.button
                              key={player.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleStartInput(player.id)}
                              className={`relative p-4 rounded-xl border-2 text-left transition-all ${isReady
                                ? "bg-green-500/10 border-green-500/50"
                                : "bg-card hover:bg-accent border-border hover:border-primary/50"
                                }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-lg truncate">
                                    {player.name}
                                  </div>
                                  <div
                                    className={`text-sm mt-1 flex items-center gap-1 ${isReady
                                      ? "text-green-600 font-medium"
                                      : "text-muted-foreground"
                                      }`}
                                  >
                                    {isReady ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        <span>Ready</span>
                                      </>
                                    ) : (
                                      <span>
                                        Tap to enter {required} card
                                        {required === 1 ? "" : "s"}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {hand.length > 0 && (
                                  <div className="flex gap-1.5 shrink-0">
                                    {hand.map((card, i) => (
                                      <Card
                                        key={i}
                                        code={card}
                                        faceUp={true}
                                        size={cardSize}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    );
                  })()}

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
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold">All Set!</h3>
                <p className="text-muted-foreground">
                  All hands are entered. Ready to see who won?
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {remainingPlayers.map((player) => {
                  const hand = playerHands[player.id] || [];
                  const cardSize =
                    remainingPlayers.length > 6 ? "small" : "medium";

                  return (
                    <div
                      key={player.id}
                      className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between gap-3"
                    >
                      <div className="font-medium truncate">{player.name}</div>
                      <div className="flex gap-1.5 shrink-0">
                        {hand.map((card, i) => (
                          <Card
                            key={i}
                            code={card}
                            faceUp={true}
                            size={cardSize}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-primary/80"
                  onClick={handleEvaluate}
                >
                  🎲 Evaluate Hands
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setIsReviewing(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review / Edit
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

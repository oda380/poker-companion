import { usePokerStore } from "@/store/usePokerStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardKeyboard } from "./CardKeyboard";
import { useState } from "react";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getStreetColor, getStreetLabel } from "@/lib/utils";

function buildSeatRing<T extends { seat: number }>(
  players: T[],
  dealerSeat: number
) {
  const sorted = [...players].sort((a, b) => a.seat - b.seat);
  const dealerIdx = sorted.findIndex((p) => p.seat === dealerSeat);
  if (dealerIdx >= 0) {
    return [...sorted.slice(dealerIdx + 1), ...sorted.slice(0, dealerIdx + 1)];
  }
  return sorted;
}

function StudCardForm() {
  const currentHand = usePokerStore((state) => state.currentHand);
  const players = usePokerStore((state) => state.players);
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  if (!currentHand) return null;

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

  const activePlayers = buildSeatRing(
    players.filter((p) => !p.isSittingOut && p.status !== "folded"),
    currentHand.dealerSeat
  );

  if (activePlayers.length === 0) return null;

  const currentPlayer = activePlayers[currentPlayerIndex];
  const playerHand = currentHand.playerHands.find(
    (h) => h.playerId === currentPlayer.id
  );

  // ✅ Ignore stud placeholder cards like { code:"", faceUp:false }
  const dealtCards = (playerHand?.cards ?? []).filter((c) => !!c.code);

  // This dialog deals face-up cards only (in 5-card stud that's 4 up cards total)
  const faceUpCount = dealtCards.filter((c) => c.faceUp).length;

  const handleCardSelect = (cardCode: string) => {
    setSelectedCard(cardCode);
  };

  const handleConfirm = () => {
    if (!selectedCard) return;

    // ✅ 1-liner guard: prevent dealing more than 4 up-cards
    if (faceUpCount >= 4) return;

    usePokerStore.setState((state) => {
      if (!state.currentHand) return state;

      const liveActivePlayers = buildSeatRing(
        state.players.filter((p) => !p.isSittingOut && p.status !== "folded"),
        state.currentHand.dealerSeat
      );
      if (liveActivePlayers.length === 0) return state;

      const livePlayer = liveActivePlayers[currentPlayerIndex];

      // All cards dealt through this dialog are face-up
      const updatedPlayerHands = state.currentHand.playerHands.map((ph) => {
        if (ph.playerId === livePlayer.id) {
          return {
            ...ph,
            cards: [...ph.cards, { code: selectedCard, faceUp: true }],
          };
        }
        return ph;
      });

      const isLastPlayer = currentPlayerIndex === liveActivePlayers.length - 1;

      if (isLastPlayer) {
        const bettingPlayers = liveActivePlayers.filter(
          (p) => p.status === "active"
        );

        if (bettingPlayers.length < 2) {
          // All-in scenario: Skip betting, go to next street
          const getNextStreet = (s: string) => {
            if (s === "street1") return "street2";
            if (s === "street2") return "street3";
            if (s === "street3") return "street4";
            if (s === "street4") return "street5";
            return "showdown";
          };

          const upcomingStreet = getNextStreet(state.currentHand.currentStreet);

          if (upcomingStreet === "showdown") {
            return {
              ...state,
              currentHand: {
                ...state.currentHand,
                playerHands: updatedPlayerHands,
                activePlayerId: "",
                currentStreet: "showdown",
                currentBet: 0,
                perPlayerCommitted: {},
              },
            };
          }

          return {
            ...state,
            currentHand: {
              ...state.currentHand,
              playerHands: updatedPlayerHands,
              activePlayerId: "WAITING_FOR_STUD_CARD",
              currentStreet: upcomingStreet as
                | "street2"
                | "street3"
                | "street4"
                | "street5"
                | "showdown",
              currentBet: 0,
              perPlayerCommitted: {},
            },
          };
        } else {
          // Normal betting round
          const dealerIndex = liveActivePlayers.findIndex(
            (p) => p.seat === state.currentHand!.dealerSeat
          );

          // Simple rotation for now, skipping all-ins
          let nextIdx = (dealerIndex + 1) % liveActivePlayers.length;
          let nextPlayer = liveActivePlayers[nextIdx];
          let attempts = 0;

          while (
            nextPlayer.status === "allIn" &&
            attempts < liveActivePlayers.length
          ) {
            nextIdx = (nextIdx + 1) % liveActivePlayers.length;
            nextPlayer = liveActivePlayers[nextIdx];
            attempts++;
          }

          return {
            ...state,
            currentHand: {
              ...state.currentHand,
              playerHands: updatedPlayerHands,
              activePlayerId: nextPlayer.id,
              currentBet: 0,
              perPlayerCommitted: {},
            },
          };
        }
      }

      // Move to next player for dealing
      return {
        ...state,
        currentHand: {
          ...state.currentHand,
          playerHands: updatedPlayerHands,
        },
      };
    });

    // Move to next player or reset for next time
    if (currentPlayerIndex < activePlayers.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setSelectedCard("");
    } else {
      setCurrentPlayerIndex(0);
      setSelectedCard("");
    }
  };

  const confirmDisabled = !selectedCard || faceUpCount >= 4;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
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
            {/* Street Indicator */}
            <div className="text-center">
              <div
                className={cn(
                  "inline-flex items-center justify-center px-4 py-1.5 rounded-full font-bold tracking-wider text-sm border uppercase",
                  getStreetColor(currentHand.currentStreet)
                )}
              >
                {getStreetLabel(currentHand.currentStreet)}
              </div>
            </div>

            {/* Player Info */}
            <div className="text-center space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                  Dealing to
                </div>
                <div className="text-4xl font-bold text-primary">
                  {currentPlayer.name}
                </div>
              </div>

              <div className="text-xs text-muted-foreground font-medium bg-muted inline-block px-3 py-1 rounded-full">
                Up Card {faceUpCount + 1} of 4
              </div>

              {faceUpCount >= 4 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  This player already has all 4 face-up cards.
                </div>
              )}
            </div>

            {/* Current player's existing cards */}
            {dealtCards.length > 0 && (
              <div className="flex justify-center gap-2 p-3 bg-muted/30 rounded-xl overflow-x-auto">
                {dealtCards.map((card, i) => (
                  <motion.div
                    key={`${card.code}-${i}`}
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
                  <span className="text-xs text-muted-foreground font-medium">
                    Select Card
                  </span>
                </div>
              )}
            </div>

            <div className="h-auto bg-muted/20 rounded-xl p-2">
              <CardKeyboard
                onCardSelect={handleCardSelect}
                usedCards={[
                  ...currentHand.playerHands
                    .flatMap((ph) => ph.cards.map((c) => c.code))
                    .filter(Boolean),
                  ...(selectedCard ? [selectedCard] : []),
                ]}
              />
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold shadow-md"
              onClick={handleConfirm}
              disabled={confirmDisabled}
            >
              Confirm Card
            </Button>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export function StudCardDialog() {
  const currentHand = usePokerStore((state) => state.currentHand);

  // Only show if waiting for Stud card dealing
  const needsStudCard = currentHand?.activePlayerId === "WAITING_FOR_STUD_CARD";
  const isStud = currentHand?.gameVariant === "fiveCardStud";

  if (!currentHand || !isStud) return null;
  if (!needsStudCard) return null;

  return <StudCardForm />;
}

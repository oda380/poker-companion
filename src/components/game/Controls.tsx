import { Button } from "@/components/ui/button";
import { usePokerStore } from "@/store/usePokerStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Numpad } from "./Numpad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";

export function Controls() {
  const currentHand = usePokerStore((state) => state.currentHand);
  const playerAction = usePokerStore((state) => state.playerAction);
  const setUiState = usePokerStore((state) => state.setUiState);
  const [betAmount, setBetAmount] = useState(0);
  const [inputMode, setInputMode] = useState<"slider" | "numpad">("slider");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Always call hooks at the top level
  const activePlayerId = currentHand?.activePlayerId;
  const activePlayer = usePokerStore((state) =>
    state.players.find((p) => p.id === activePlayerId)
  );

  if (!currentHand) return null;

  // Showdown Mode
  if (currentHand.activePlayerId === "") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border flex justify-center shadow-2xl pb-8">
        <Button
          size="lg"
          className="h-16 px-8 text-xl font-bold bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white shadow-lg animate-in fade-in slide-in-from-bottom-4"
          onClick={() => setUiState({ isShowdownDialogOpen: true })}
        >
          <Swords className="w-6 h-6 mr-2" />
          Showdown
        </Button>
      </div>
    );
  }

  const { currentBet, minRaise } = currentHand;
  const playerStack = activePlayer?.stack || 0;

  // Check if "Check" should be "Showdown"
  const isFinalStreet =
    (currentHand.gameVariant === "texasHoldem" &&
      currentHand.currentStreet === "river") ||
    (currentHand.gameVariant === "fiveCardStud" &&
      currentHand.currentStreet === "street5");

  // Determine if player is closing the action
  // Simple heuristic: If it's final street, check is allowed (currentBet == 0),
  // and we are the last active player in the rotation?
  // Actually, if currentBet is 0, and we check, we are just passing.
  // But if everyone else has checked, then it's showdown.
  // We can check if all other active players have committed 0 this round?
  // Yes, if currentBet is 0, everyone has committed 0 (relative to this round's start,
  // but perPlayerCommitted tracks total for the street).
  // So if currentBet is 0, everyone has checked so far.
  // If I am the last one, then my check ends the round.

  // How to know if I am the last one?
  // Get all active players sorted by seat.
  // Find dealer.
  // The order is (dealer+1)...(dealer).
  // So the last player is the dealer (or closest active to dealer's right).

  const activePlayers = usePokerStore
    .getState()
    .players.filter((p) => !p.isSittingOut && p.status === "active")
    .sort((a, b) => a.seat - b.seat);

  const dealerSeat = currentHand.dealerSeat;

  // Find the player who acts last (closest to dealer's seat, going backwards from dealer)
  // Actually, simpler: Rotate the array so dealer is last.
  // But we need to handle the case where dealer is folded.
  // The standard rotation starts at dealer+1.
  // So the last person to act is the one immediately before dealer+1 in the cycle.
  // Which is... the dealer (or whoever is at that position).

  // Let's rotate activePlayers so the first person to act is at index 0.
  // First person to act is the first active player after dealerSeat.
  const firstActorIndex = activePlayers.findIndex((p) => p.seat > dealerSeat);
  // If no one after dealer, then index 0 (wrap around).
  const rotationIndex = firstActorIndex === -1 ? 0 : firstActorIndex;

  // Rotated array: [FirstActor, ..., LastActor]
  const rotatedPlayers = [
    ...activePlayers.slice(rotationIndex),
    ...activePlayers.slice(0, rotationIndex),
  ];

  const lastActor = rotatedPlayers[rotatedPlayers.length - 1];
  const isLastToAct = lastActor?.id === activePlayerId;

  const showShowdownButton = isFinalStreet && currentBet === 0 && isLastToAct;

  const handleBet = (amount: number) => {
    // Determine if it's a bet or raise based on currentBet
    const type = currentBet === 0 ? "bet" : "raise";
    playerAction(type, amount);
    setSheetOpen(false); // Close sheet after action
    setBetAmount(0); // Reset amount
  };

  const handleCall = () => {
    playerAction("call");
    setSheetOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border grid grid-cols-3 gap-3 shadow-2xl pb-8">
      <Button
        variant="secondary"
        size="lg"
        className="h-16 text-xl font-bold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
        onClick={() => playerAction("fold")}
      >
        Fold
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className={cn(
          "h-16 text-xl font-bold border-0 shadow-lg active:scale-95 transition-transform text-white",
          showShowdownButton
            ? "bg-gradient-to-br from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 shadow-amber-500/30"
            : "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30"
        )}
        onClick={() => {
          const activeId = currentHand.activePlayerId || "";
          const playerCommitted = currentHand.perPlayerCommitted[activeId] || 0;
          const amountToCall = currentBet - playerCommitted;

          if (amountToCall > 0) {
            toast.error("Action Required", {
              description: `You cannot Check. You must Call ${currentBet}, Raise, or Fold.`,
              duration: 3000,
            });
            return;
          }
          playerAction("check");
        }}
      >
        {showShowdownButton ? (
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Showdown
          </div>
        ) : (
          "Check"
        )}
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="h-16 text-xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform text-white dark:text-white"
          >
            {currentBet > 0 ? "Call / Raise" : "Bet"}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[85vh] overflow-y-auto sm:max-w-lg sm:mx-auto sm:rounded-t-xl"
        >
          <div className="flex flex-col gap-4 p-2">
            <div className="text-center text-2xl font-bold">Bet Amount</div>

            {currentBet > 0 &&
              (() => {
                const activeId = currentHand.activePlayerId || "";
                const playerCommitted =
                  currentHand.perPlayerCommitted[activeId] || 0;
                const amountToCall = currentBet - playerCommitted;
                const actualCallAmount = Math.min(amountToCall, playerStack);
                const isAllIn =
                  actualCallAmount < amountToCall ||
                  actualCallAmount === playerStack;

                return (
                  <div className="flex gap-2">
                    <Button className="flex-1 h-12" onClick={handleCall}>
                      {isAllIn
                        ? `Call All-In (${actualCallAmount})`
                        : `Call ${currentBet}`}
                    </Button>
                  </div>
                );
              })()}

            <Tabs
              value={inputMode}
              onValueChange={(v) => setInputMode(v as "slider" | "numpad")}
              className="flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="slider">Slider</TabsTrigger>
                <TabsTrigger value="numpad">Numpad</TabsTrigger>
              </TabsList>

              <div className="flex flex-col justify-center gap-4 py-4">
                <div className="text-6xl font-bold text-center tabular-nums tracking-tighter">
                  {betAmount}
                </div>

                <TabsContent value="slider" className="space-y-8 mt-0">
                  <Slider
                    min={minRaise}
                    max={playerStack}
                    step={1}
                    value={[betAmount]}
                    onValueChange={([v]) => setBetAmount(v)}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setBetAmount(minRaise)}
                    >
                      Min
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBetAmount(currentBet * 2)}
                    >
                      2x
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBetAmount(currentBet * 3)}
                    >
                      3x
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBetAmount(playerStack)}
                    >
                      All-In
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="numpad" className="mt-0">
                  <Numpad value={betAmount} onChange={setBetAmount} />
                </TabsContent>
              </div>
            </Tabs>

            <Button
              size="lg"
              className="h-16 text-xl w-full"
              onClick={() => handleBet(betAmount)}
              disabled={betAmount === 0}
            >
              Confirm Bet {betAmount}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

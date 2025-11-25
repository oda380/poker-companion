import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function InitialDealDialog() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const players = usePokerStore((state) => state.players);

    if (!currentHand) return null;

    // Show dialog when activePlayerId is "WAITING_FOR_DEAL_CONFIRM"
    const needsConfirm = currentHand.activePlayerId === "WAITING_FOR_DEAL_CONFIRM";

    if (needsConfirm) {
        console.log("InitialDealDialog: Rendering because activePlayerId is WAITING_FOR_DEAL_CONFIRM");
    }

    const activePlayers = players.filter(p => !p.isSittingOut && p.status === "active");
    const isHoldem = currentHand.gameVariant === "texasHoldem";
    const isStud = currentHand.gameVariant === "fiveCardStud";

    const handleConfirm = () => {
        usePokerStore.setState((state) => {
            if (!state.currentHand) return state;

            // Find first player to act
            const dealerIndex = activePlayers.findIndex(p => p.seat === state.currentHand!.dealerSeat);
            let firstToAct: string;

            if (isHoldem) {
                if (activePlayers.length === 2) {
                    // Heads-up: Dealer (SB) acts first Preflop
                    firstToAct = activePlayers[dealerIndex].id;
                } else {
                    // 3+ Players: UTG (left of BB) acts first
                    const utg = (dealerIndex + 3) % activePlayers.length;
                    firstToAct = activePlayers[utg].id;
                }
            } else {
                // Stud: left of dealer
                const firstIndex = (dealerIndex + 1) % activePlayers.length;
                firstToAct = activePlayers[firstIndex].id;
            }

            return {
                ...state,
                currentHand: {
                    ...state.currentHand,
                    activePlayerId: firstToAct
                }
            };
        });
    };

    return (
        <Dialog open={needsConfirm} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <DialogTitle className="text-2xl">Cards Dealt</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        {isHoldem && (
                            <>
                                <strong>2 hole cards</strong> have been dealt face-down to each player.
                            </>
                        )}
                        {isStud && (
                            <>
                                <strong>1 hole card</strong> (face-down) and <strong>1 door card</strong> (face-up) have been dealt to each player.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-sm font-semibold mb-2">Players in hand:</div>
                        <div className="flex flex-wrap gap-2">
                            {activePlayers.map(player => (
                                <div key={player.id} className="px-3 py-1 bg-background rounded-full text-sm font-medium border">
                                    {player.name}
                                    {currentHand.dealerSeat === player.seat && (
                                        <span className="ml-1 text-amber-500">D</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full h-14 text-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                        onClick={handleConfirm}
                    >
                        Start Betting Round
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

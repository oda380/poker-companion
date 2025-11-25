import { Button } from "@/components/ui/button";
import { usePokerStore } from "@/store/usePokerStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Numpad } from "./Numpad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function Controls() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const playerAction = usePokerStore((state) => state.playerAction);
    const [betAmount, setBetAmount] = useState(0);
    const [inputMode, setInputMode] = useState<"slider" | "numpad">("slider");
    const [sheetOpen, setSheetOpen] = useState(false);

    if (!currentHand) return null;

    const { currentBet, minRaise } = currentHand;
    // Logic to determine valid actions based on current state would go here
    // For MVP, we show all relevant buttons

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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/98 to-transparent backdrop-blur-lg border-t border-white/10 grid grid-cols-3 gap-3 shadow-2xl">
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
                className="h-16 text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                onClick={() => {
                    const activeId = currentHand.activePlayerId || "";
                    const playerCommitted = currentHand.perPlayerCommitted[activeId] || 0;
                    const amountToCall = currentBet - playerCommitted;

                    if (amountToCall > 0) {
                        toast.error("Action Required", {
                            description: `You cannot Check. You must Call ${amountToCall}, Raise, or Fold.`,
                            duration: 3000,
                        });
                        return;
                    }
                    playerAction("check");
                }}
            >
                Check
            </Button>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button size="lg" className="h-16 text-xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                        {currentBet > 0 ? "Call / Raise" : "Bet"}
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[60vh]">
                    <div className="h-full flex flex-col gap-4 p-2">
                        <div className="text-center text-2xl font-bold">Bet Amount</div>

                        {currentBet > 0 && (
                            <div className="flex gap-2">
                                <Button className="flex-1 h-12" onClick={handleCall}>Call {currentBet}</Button>
                            </div>
                        )}

                        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)} className="flex-1 flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="slider">Slider</TabsTrigger>
                                <TabsTrigger value="numpad">Numpad</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 flex flex-col justify-center gap-4 py-4">
                                <div className="text-6xl font-bold text-center tabular-nums tracking-tighter">
                                    {betAmount}
                                </div>

                                <TabsContent value="slider" className="space-y-8 mt-0">
                                    <Slider
                                        min={minRaise}
                                        max={1000} // Should be active player stack
                                        step={1}
                                        value={[betAmount]}
                                        onValueChange={([v]) => setBetAmount(v)}
                                    />
                                    <div className="grid grid-cols-4 gap-2">
                                        <Button variant="outline" onClick={() => setBetAmount(minRaise)}>Min</Button>
                                        <Button variant="outline" onClick={() => setBetAmount(currentBet * 2)}>2x</Button>
                                        <Button variant="outline" onClick={() => setBetAmount(currentBet * 3)}>3x</Button>
                                        <Button variant="outline" onClick={() => setBetAmount(1000)}>All-In</Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="numpad" className="mt-0 h-full">
                                    <Numpad
                                        value={betAmount}
                                        onChange={setBetAmount}
                                        onConfirm={() => handleBet(betAmount)}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>

                        <Button size="lg" className="h-16 text-xl w-full" onClick={() => handleBet(betAmount)} disabled={betAmount === 0}>
                            Confirm Bet {betAmount}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

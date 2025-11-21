import { Button } from "@/components/ui/button";
import { usePokerStore } from "@/store/usePokerStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Numpad } from "./Numpad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t grid grid-cols-3 gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <Button
                variant="secondary"
                size="lg"
                className="h-16 text-xl font-bold bg-red-100 hover:bg-red-200 text-red-900 border-red-200"
                onClick={() => playerAction("fold")}
            >
                Fold
            </Button>

            <Button
                variant="outline"
                size="lg"
                className="h-16 text-xl font-bold"
                onClick={() => playerAction("check")}
            >
                Check
            </Button>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button size="lg" className="h-16 text-xl font-bold bg-green-600 hover:bg-green-700">
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

import { usePokerStore } from "@/store/usePokerStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function HandHistory() {
    const handHistory = usePokerStore((state) => state.handHistory);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <History className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Hand History</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                    {handHistory.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No hands played yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {handHistory.slice().reverse().map((hand) => (
                                <div key={hand.id} className="border rounded-lg p-4 bg-card">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold">Hand #{hand.handNumber}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(hand.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-sm mb-2">
                                        Variant: {hand.gameVariant === "texasHoldem" ? "Texas Hold'em" : "5-Card Stud"}
                                    </div>
                                    <div className="text-lg font-bold text-primary mb-2">
                                        Pot: {hand.totalPot}
                                    </div>
                                    <div className="space-y-1">
                                        {hand.winners.map((winner, idx) => (
                                            <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                                                <span className="font-bold">Winner:</span> Player {winner.playerId.slice(0, 4)}...
                                                <br />
                                                <span className="text-muted-foreground">{winner.handDescription}</span>
                                                <br />
                                                <span className="text-green-600 font-bold">+{winner.potShare}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

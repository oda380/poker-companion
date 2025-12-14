import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePokerStore } from "@/store/usePokerStore";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface RebuyDialogProps {
    playerId: string;
    playerName: string;
}

export function RebuyDialog({ playerId, playerName }: RebuyDialogProps) {
    const [amount, setAmount] = useState(1000); // Default amount
    const [open, setOpen] = useState(false);
    const rebuyPlayer = usePokerStore((state) => state.rebuyPlayer);
    const bigBlind = usePokerStore((state) => state.config.bigBlind) || 2;

    const handleRebuy = () => {
        rebuyPlayer(playerId, Number(amount));
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 animate-pulse shadow-lg shadow-red-500/20"
                >
                    <RefreshCw className="w-4 h-4" />
                    Re-buy
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Re-buy for {playerName}</DialogTitle>
                    <DialogDescription>
                        Enter amount to add to stack.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="text-lg"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setAmount(bigBlind * 100)}>
                            100 BB ({bigBlind * 100})
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setAmount(1000)}>
                            1000
                        </Button>
                    </div>
                    <Button onClick={handleRebuy} className="w-full mt-4">
                        Confirm Re-buy
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

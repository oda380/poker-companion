import { usePokerStore } from "@/store/usePokerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface DealerSelectionDialogProps {
    onSelectDealer: (seat: number) => boolean;
}

export function DealerSelectionDialog({ onSelectDealer }: DealerSelectionDialogProps) {
    const players = usePokerStore((state) => state.players);
    const handHistory = usePokerStore((state) => state.handHistory);
    const currentHand = usePokerStore((state) => state.currentHand);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

    // Only show for first hand and before hand starts
    const isFirstHand = handHistory.length === 0 && !currentHand;

    // Reset selection when dialog opens (isFirstHand becomes true)
    useEffect(() => {
        if (isFirstHand) {
            console.log("DealerSelectionDialog: Resetting selectedSeat");
            setSelectedSeat(null);
        }
    }, [isFirstHand]);

    const handleConfirm = () => {
        if (selectedSeat !== null) {
            try {
                console.log("Attempting to start hand with dealer seat:", selectedSeat);
                const success = onSelectDealer(selectedSeat);
                if (!success) {
                    console.error("Failed to start hand (returned false)");
                    alert("Failed to start the hand. Please try again or check console for errors.");
                }
            } catch (e) {
                console.error("Error in handleConfirm:", e);
                alert("An unexpected error occurred.");
            }
        }
    };

    return (
        <Dialog open={isFirstHand} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Initial Dealer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Choose who will be the dealer for the first hand. The dealer button will rotate clockwise after each hand.
                    </p>

                    <div className="space-y-2">
                        {players.map((player) => (
                            <Button
                                key={player.id}
                                variant={selectedSeat === player.seat ? "default" : "outline"}
                                className="w-full h-14 text-lg justify-start"
                                onClick={() => {
                                    console.log("Selected seat:", player.seat);
                                    setSelectedSeat(player.seat);
                                }}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span>{player.name}</span>
                                    <span className="text-sm text-muted-foreground">Seat {player.seat}</span>
                                </div>
                            </Button>
                        ))}
                    </div>

                    <Button
                        size="lg"
                        className="w-full"
                        onClick={handleConfirm}
                        disabled={selectedSeat === null}
                    >
                        Confirm Dealer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

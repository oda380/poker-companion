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
    const [isReady, setIsReady] = useState(false);

    // Only show for first hand and before hand starts
    const isFirstHand = handHistory.length === 0 && !currentHand;

    // Reset selection when dialog opens (isFirstHand becomes true)
    useEffect(() => {
        if (isFirstHand) {
            console.log("DealerSelectionDialog: Resetting selectedSeat");
            setSelectedSeat(null);
            setIsReady(false);

            // Force layout recalculation on mobile to fix touch offset
            // We use the hidden input hack here because it's the only reliable way to fix iOS viewport issues
            // when the layout changes (e.g. changing player count)
            const hiddenInput = document.createElement('input');
            hiddenInput.style.position = 'absolute';
            hiddenInput.style.opacity = '0';
            hiddenInput.style.pointerEvents = 'none';
            hiddenInput.style.left = '-9999px';
            document.body.appendChild(hiddenInput);

            setTimeout(() => {
                // 1. Force reflow
                const _ = document.body.offsetHeight;

                // 2. Trigger input focus (forces viewport recalc)
                hiddenInput.focus();

                setTimeout(() => {
                    hiddenInput.blur();
                    if (document.body.contains(hiddenInput)) {
                        document.body.removeChild(hiddenInput);
                    }

                    // 3. Force resize event as backup
                    window.dispatchEvent(new Event('resize'));

                    // Wait a bit more before showing content
                    setTimeout(() => {
                        setIsReady(true);
                    }, 100);
                }, 100);
            }, 150);
        } else {
            setIsReady(false);
        }
    }, [isFirstHand, players.length]); // Add players.length as dependency

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
        <Dialog key={`dealer-${players.length}-${players[0]?.id || 'none'}`} open={isFirstHand} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                {isReady && (
                    <>
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

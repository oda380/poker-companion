import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CardKeyboardProps {
    onCardSelect: (cardCode: string) => void;
    usedCards?: string[]; // Cards already in play
}

export function CardKeyboard({ onCardSelect, usedCards = [] }: CardKeyboardProps) {
    const suits = ["s", "h", "d", "c"]; // spades, hearts, diamonds, clubs
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

    const [selectedRank, setSelectedRank] = useState<string | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const handleRankClick = (rank: string) => {
        setSelectedRank(rank);
        setDuplicateWarning(null);
    };

    const handleSuitClick = (suit: string) => {
        if (!selectedRank) return;

        const cardCode = selectedRank + suit;

        if (usedCards.includes(cardCode)) {
            setDuplicateWarning(`${cardCode} is already in play!`);
            setTimeout(() => setDuplicateWarning(null), 2000);
            return;
        }

        setDuplicateWarning(null);
        onCardSelect(cardCode);
        setSelectedRank(null); // Reset for next selection
    };

    const suitSymbols: Record<string, string> = {
        h: "♥",
        d: "♦",
        c: "♣",
        s: "♠",
    };

    const suitColors: Record<string, string> = {
        h: "text-red-600",
        d: "text-red-600",
        c: "text-black",
        s: "text-black",
    };

    return (
        <div className="space-y-2">
            {duplicateWarning && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{duplicateWarning}</AlertDescription>
                </Alert>
            )}

            <div className="flex gap-3">
                {/* Left column: Ranks */}
                <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1 text-center">
                        Select Rank
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                        {ranks.map((rank) => (
                            <Button
                                key={rank}
                                variant={selectedRank === rank ? "default" : "outline"}
                                size="sm"
                                className="h-9 text-sm font-bold"
                                onClick={() => handleRankClick(rank)}
                            >
                                {rank}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Right column: Suits */}
                <div className="w-20">
                    <div className="text-xs font-medium text-muted-foreground mb-1 text-center">
                        Suit
                    </div>
                    <div className="space-y-1">
                        {suits.map((suit) => {
                            const cardCode = selectedRank ? selectedRank + suit : "";
                            const isUsed = cardCode ? usedCards.includes(cardCode) : false;

                            return (
                                <Button
                                    key={suit}
                                    variant="outline"
                                    size="lg"
                                    className={`w-full h-12 text-3xl ${suitColors[suit]} ${!selectedRank ? 'opacity-30' : ''
                                        } ${isUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => handleSuitClick(suit)}
                                    disabled={!selectedRank || isUsed}
                                >
                                    {suitSymbols[suit]}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CardKeyboardProps {
    onCardSelect: (cardCode: string) => void;
    usedCards?: string[]; // Cards already in play
}

export function CardKeyboard({ onCardSelect, usedCards = [] }: CardKeyboardProps) {
    const suits = ["h", "d", "c", "s"]; // hearts, diamonds, clubs, spades
    const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const handleCardClick = (rank: string, suit: string) => {
        const cardCode = rank + suit;

        if (usedCards.includes(cardCode)) {
            setDuplicateWarning(`${cardCode} is already in play!`);
            setTimeout(() => setDuplicateWarning(null), 2000);
            return;
        }

        setDuplicateWarning(null);
        onCardSelect(cardCode);
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
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{duplicateWarning}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-4 gap-1">
                {suits.map((suit) => (
                    <div key={suit} className="space-y-1">
                        <div className={`text-center text-2xl ${suitColors[suit]}`}>
                            {suitSymbols[suit]}
                        </div>
                        {ranks.map((rank) => {
                            const cardCode = rank + suit;
                            const isUsed = usedCards.includes(cardCode);
                            return (
                                <Button
                                    key={cardCode}
                                    variant={isUsed ? "secondary" : "outline"}
                                    size="sm"
                                    className={`w-full h-8 text-xs font-bold ${suitColors[suit]} ${isUsed ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    onClick={() => handleCardClick(rank, suit)}
                                    disabled={isUsed}
                                >
                                    {rank}
                                </Button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

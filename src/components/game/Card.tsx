import { cn } from "@/lib/utils";

interface CardProps {
    code: string; // e.g., "As", "Kh", "7d"
    faceUp: boolean;
    size?: "small" | "medium" | "large";
    className?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
    s: "♠",
    h: "♥",
    d: "♦",
    c: "♣",
};

const SUIT_COLORS: Record<string, string> = {
    s: "text-gray-900",
    h: "text-red-600",
    d: "text-red-600",
    c: "text-gray-900",
};

const RANK_DISPLAY: Record<string, string> = {
    A: "A",
    K: "K",
    Q: "Q",
    J: "J",
    T: "10",
    "9": "9",
    "8": "8",
    "7": "7",
    "6": "6",
    "5": "5",
    "4": "4",
    "3": "3",
    "2": "2",
};

const SIZE_CLASSES = {
    small: "w-10 h-14 text-xs",
    medium: "w-14 h-20 text-base",
    large: "w-20 h-28 text-xl",
};

export function Card({ code, faceUp, size = "small", className }: CardProps) {
    // Handle empty code (placeholder) or face-down cards
    if (!faceUp || !code) {
        return (
            <div
                className={cn(
                    "rounded-lg border-2 border-gray-700 bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 shadow-lg relative overflow-hidden",
                    SIZE_CLASSES[size],
                    className
                )}
            >
                {/* Card back pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/10 text-4xl">♠</div>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            </div>
        );
    }

    const rank = code[0];
    const suit = code[1];
    const suitSymbol = SUIT_SYMBOLS[suit] || suit;
    const suitColor = SUIT_COLORS[suit] || "text-gray-900";
    const rankDisplay = RANK_DISPLAY[rank] || rank;

    return (
        <div
            className={cn(
                "bg-white rounded-lg shadow-lg border-2 border-gray-300 relative select-none transition-transform hover:scale-105",
                SIZE_CLASSES[size],
                className
            )}
        >
            {/* Top-left corner */}
            <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
                <div className={cn("font-bold", suitColor)}>{rankDisplay}</div>
                <div className={cn("text-lg", suitColor)}>{suitSymbol}</div>
            </div>

            {/* Center suit symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn("text-4xl opacity-20", suitColor)}>{suitSymbol}</div>
            </div>

            {/* Bottom-right corner (rotated) */}
            <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180">
                <div className={cn("font-bold", suitColor)}>{rankDisplay}</div>
                <div className={cn("text-lg", suitColor)}>{suitSymbol}</div>
            </div>
        </div>
    );
}

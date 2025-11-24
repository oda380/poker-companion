import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    const rank = code?.[0];
    const suit = code?.[1];
    const suitSymbol = SUIT_SYMBOLS[suit] || suit;
    const suitColor = SUIT_COLORS[suit] || "text-gray-900";
    const rankDisplay = RANK_DISPLAY[rank] || rank;

    return (
        <div className={cn("relative perspective-1000", SIZE_CLASSES[size], className)}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: faceUp ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Back Face (Visible at 0deg) */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden rounded-lg border-2 border-gray-700 bg-gradient-to-br from-blue-900 via-blue-950 to-black shadow-lg overflow-hidden",
                    )}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(0deg)" }}
                >
                    {/* Card back pattern - Geometric */}
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                            backgroundSize: "6px 6px"
                        }}
                    />

                    {/* Center Logo/Symbol */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-400/30 rotate-45 flex items-center justify-center">
                            <div className="w-5 h-5 bg-blue-500/20" />
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Front Face (Visible at 180deg) */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden bg-white rounded-lg shadow-lg border border-gray-200 select-none overflow-hidden",
                    )}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    {code && (
                        <>
                            {/* Paper Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIiAvPgo8L3N2Zz4=')" }}
                            />

                            {/* Subtle Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 pointer-events-none" />

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
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

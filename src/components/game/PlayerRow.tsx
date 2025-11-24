import { Player, PlayerHandState } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PlayerRowProps {
    player: Player;
    handState?: PlayerHandState;
    isActive: boolean;
    isDealer: boolean;
}

export function PlayerRow({ player, handState, isActive, isDealer }: PlayerRowProps) {
    return (
        <motion.div
            layout
            className={cn(
                "p-4 border-b flex justify-between items-center transition-colors relative",
                isActive && "bg-primary/5",
                player.status === "folded" && "opacity-50 grayscale"
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                />
            )}

            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                        isActive ? "bg-primary" : "bg-muted-foreground/50"
                    )}>
                        {player.seat}
                    </div>
                    {isDealer && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-black rounded-full border text-[10px] flex items-center justify-center font-bold shadow-sm">
                            D
                        </div>
                    )}
                </div>

                <div>
                    <div className="font-bold text-lg leading-none">{player.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">Stack: {player.stack}</div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Cards Display */}
                {handState && (
                    <div className="flex -space-x-2 mr-2">
                        {handState.cards.map((card, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-8 h-11 rounded border shadow-sm flex items-center justify-center text-xs font-bold bg-white text-black select-none",
                                    (!card.faceUp || !card.code) && "bg-blue-900 text-transparent border-blue-800" // Card back for face-down or placeholder
                                )}
                            >
                                {card.faceUp && card.code ? card.code : ""}
                            </div>
                        ))}
                    </div>
                )}

                {player.status === "folded" && <Badge variant="secondary">Fold</Badge>}
                {player.status === "allIn" && <Badge variant="destructive">All-In</Badge>}
            </div>
        </motion.div>
    );
}

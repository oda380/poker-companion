import { Player, PlayerHandState } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card } from "./Card";

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
                "p-5 border-b flex justify-between items-center transition-all duration-300 relative rounded-lg mx-2 my-1",
                isActive && "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20",
                player.status === "folded" && "opacity-40 grayscale"
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-lg"
                />
            )}

            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-all",
                        isActive
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-700 ring-4 ring-emerald-500/30"
                            : "bg-gradient-to-br from-gray-600 to-gray-800"
                    )}>
                        {player.seat}
                    </div>
                    {isDealer && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-background shadow-lg flex items-center justify-center">
                            <div className="text-white text-xs font-bold">D</div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="font-bold text-lg leading-none">{player.name}</div>
                    <div className="text-sm text-muted-foreground mt-1.5 font-semibold">
                        <span className="text-emerald-500">$</span>{player.stack}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Cards Display */}
                {handState && handState.cards.length > 0 && (
                    <div className="flex -space-x-3 mr-2">
                        {handState.cards.map((card, i) => (
                            <Card
                                key={i}
                                code={card.code}
                                faceUp={card.faceUp}
                                size="small"
                                className="transition-transform hover:translate-y-[-4px] hover:z-10"
                            />
                        ))}
                    </div>
                )}

                {player.status === "folded" && <Badge variant="secondary" className="bg-gray-700 text-gray-200">Fold</Badge>}
                {player.status === "allIn" && <Badge variant="destructive" className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">All-In</Badge>}
            </div>
        </motion.div>
    );
}

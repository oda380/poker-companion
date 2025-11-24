import { Player, PlayerHandState } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card } from "./Card";
import { ChipStack } from "./Chip";

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
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-b from-white to-gray-200 border border-gray-300 shadow-[0_2px_4px_rgba(0,0,0,0.3)] flex items-center justify-center z-10">
                            <div className="text-black text-xs font-black tracking-wider">D</div>
                            {/* Bevel effect */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 to-transparent pointer-events-none" />
                        </div>
                    )}
                </div>

                <div>
                    <div className="font-bold text-lg leading-none mb-1 text-white">{player.name}</div>
                    <ChipStack amount={player.stack} />
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

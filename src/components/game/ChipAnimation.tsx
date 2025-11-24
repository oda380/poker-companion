import { useEffect, useState, useRef } from "react";
import { usePokerStore } from "@/store/usePokerStore";
import { Chip } from "./Chip";
import { motion, AnimatePresence } from "framer-motion";

interface FlyingChip {
    id: string;
    amount: number;
    start: { x: number; y: number };
    end: { x: number; y: number };
}

export function ChipAnimation() {
    const currentHand = usePokerStore((state) => state.currentHand);
    const [flyingChips, setFlyingChips] = useState<FlyingChip[]>([]);
    const lastProcessedActionIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!currentHand) return;

        const actions = currentHand.actions;
        if (actions.length === 0) return;

        const lastAction = actions[actions.length - 1];

        // Skip if already processed
        if (lastAction.id === lastProcessedActionIdRef.current) return;
        lastProcessedActionIdRef.current = lastAction.id;

        // Only animate betting actions
        if (
            lastAction.category === "betting" &&
            ["bet", "call", "raise", "allIn"].includes(lastAction.bettingType || "") &&
            lastAction.amount && lastAction.amount > 0
        ) {
            const playerId = lastAction.playerId;
            const playerEl = document.getElementById(`player-row-${playerId}`);
            const potEl = document.getElementById("pot-display");

            if (playerEl && potEl) {
                const playerRect = playerEl.getBoundingClientRect();
                const potRect = potEl.getBoundingClientRect();

                // Calculate center points
                const start = {
                    x: playerRect.left + playerRect.width / 2,
                    y: playerRect.top + playerRect.height / 2,
                };
                const end = {
                    x: potRect.left + potRect.width / 2,
                    y: potRect.top + potRect.height / 2,
                };

                const chipId = crypto.randomUUID();
                setFlyingChips((prev) => [
                    ...prev,
                    {
                        id: chipId,
                        amount: lastAction.amount || 0,
                        start,
                        end,
                    },
                ]);

                // Remove chip after animation
                setTimeout(() => {
                    setFlyingChips((prev) => prev.filter((c) => c.id !== chipId));
                }, 1000);
            }
        }
    }, [currentHand]);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {flyingChips.map((chip) => (
                    <motion.div
                        key={chip.id}
                        initial={{
                            x: chip.start.x,
                            y: chip.start.y,
                            scale: 0.5,
                            opacity: 0
                        }}
                        animate={{
                            x: chip.end.x,
                            y: chip.end.y,
                            scale: 1,
                            opacity: 1,
                            rotate: 360
                        }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{
                            duration: 0.6,
                            ease: "backOut" // "Toss" effect
                        }}
                        className="absolute top-0 left-0"
                    >
                        {/* Use a simplified visual for the flying chip */}
                        <Chip amount={chip.amount} className="w-8 h-8 shadow-2xl" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

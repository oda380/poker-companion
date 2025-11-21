import { Pot } from "../types";

interface PlayerCommitment {
    playerId: string;
    amount: number;
    isFolded: boolean;
}

export function calculatePots(commitments: PlayerCommitment[]): Pot[] {
    const pots: Pot[] = [];

    // Filter out players with 0 commitment if they are folded? 
    // Actually, even folded players contributed to the pot.
    // We need to know who is eligible for which pot.
    // Folded players are NOT eligible for any pot they contributed to (they forfeited it).
    // But their money stays in the pot.

    // 1. Sort unique contribution levels
    const levels = Array.from(new Set(commitments.map(c => c.amount)))
        .filter(amount => amount > 0)
        .sort((a, b) => a - b);

    if (levels.length === 0) return [];

    let previousLevel = 0;

    for (const level of levels) {
        const potAmount = commitments.reduce((sum, player) => {
            const contribution = Math.max(0, Math.min(player.amount, level) - previousLevel);
            return sum + contribution;
        }, 0);

        if (potAmount > 0) {
            // Who is eligible?
            // Players who have committed at least this level AND are not folded.
            const eligiblePlayerIds = commitments
                .filter(p => p.amount >= level && !p.isFolded)
                .map(p => p.playerId);

            // If only one player is eligible (everyone else folded or all-in for less), 
            // and there are no other active players... wait.
            // Side pot logic:
            // If everyone else is all-in for less, this player effectively wins this portion immediately?
            // Or it's returned?
            // Standard rule: If a player bets and no one calls (everyone else is all-in for less), 
            // the excess is returned.
            // BUT, here we are calculating pots based on committed amounts.
            // If a player committed 500, and everyone else max committed 100.
            // Level 100: Main pot.
            // Level 500: Side pot.
            // The side pot (100 to 500) only has 1 eligible player.
            // That player gets that money back immediately (unless there are other active players who just haven't acted yet? 
            // No, this function assumes the betting round is over or we are recalculating based on current state).

            // For display purposes, we might show it as a pot, but logically it's a refund if only 1 eligible.
            // However, the prompt says "Any excess ... is returned/refunded immediately before showdown."
            // We will return it as a Pot for now, and the game logic can handle the refund if eligible.length === 1.

            pots.push({
                id: `pot-${level}`,
                amount: potAmount,
                eligiblePlayerIds,
            });
        }

        previousLevel = level;
    }

    return pots;
}

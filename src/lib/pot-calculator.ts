export interface PlayerCommitment {
  playerId: string;
  amount: number;
  isFolded: boolean;
}

export interface Pot {
  id: string;
  amount: number;
  eligiblePlayerIds: string[];
}

/**
 * Calculate pots from player commitments, handling side pots and refunds.
 *
 * @param commitments - Array of player commitments (total for the hand)
 * @returns Object containing pots array and refunds map
 */
export function calculatePots(commitments: PlayerCommitment[]): {
  pots: Pot[];
  refunds: Record<string, number>;
} {
  const pots: Pot[] = [];
  const refunds: Record<string, number> = {};

  const levels = Array.from(new Set(commitments.map((c) => c.amount)))
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b);

  if (levels.length === 0) return { pots: [], refunds: {} };

  let previousLevel = 0;

  for (const level of levels) {
    const sliceAmount = commitments.reduce((sum, player) => {
      const contribution = Math.max(
        0,
        Math.min(player.amount, level) - previousLevel
      );
      return sum + contribution;
    }, 0);

    if (sliceAmount <= 0) {
      previousLevel = level;
      continue;
    }

    // Players who contributed to THIS slice (with your levels approach, this is amount >= level)
    const contributors = commitments
      .filter((p) => p.amount >= level)
      .sort((a, b) => a.playerId.localeCompare(b.playerId));

    // Eligible = contributors who haven't folded
    const eligiblePlayerIds = contributors
      .filter((p) => !p.isFolded)
      .map((p) => p.playerId);

    // 0 eligible => refund deterministically to contributors
    if (eligiblePlayerIds.length === 0) {
      const n = contributors.length;
      if (n === 0) {
        previousLevel = level;
        continue;
      }

      const base = Math.floor(sliceAmount / n);
      let rem = sliceAmount % n;

      for (const c of contributors) {
        const extra = rem > 0 ? 1 : 0;
        rem = Math.max(0, rem - 1);
        refunds[c.playerId] = (refunds[c.playerId] || 0) + base + extra;
      }

      previousLevel = level;
      continue;
    }

    // ✅ Option B
    if (eligiblePlayerIds.length === 1) {
      const only = eligiblePlayerIds[0];

      // True refund only if ONLY that player contributed to this slice (uncalled overbet)
      if (contributors.length === 1) {
        refunds[only] = (refunds[only] || 0) + sliceAmount;
      } else {
        // Uncontested side pot (others contributed but folded) => award as a pot (counts as win)
        pots.push({
          id: `pot-${level}-${previousLevel}`,
          amount: sliceAmount,
          eligiblePlayerIds, // [only]
        });
      }

      previousLevel = level;
      continue;
    }

    // Normal contested pot
    pots.push({
      id: `pot-${level}-${previousLevel}`,
      amount: sliceAmount,
      eligiblePlayerIds,
    });

    previousLevel = level;
  }

  return { pots, refunds };
}

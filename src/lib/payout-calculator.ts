import type { Player } from "@/types";

/**
 * Pure function to apply payouts to players.
 * Updates stacks based on shares and increments win counts for winners.
 *
 * @param players - List of current players
 * @param finalShares - Map of playerId to chip amount won/refunded
 * @param allWinners - Set or Array of playerIds who won at least one pot (excludes refund-only)
 * @returns New list of players with updated stacks and win counts
 */
export function applyPayoutsToPlayers(
  players: Player[],
  finalShares: Record<string, number>,
  allWinners: Set<string> | string[]
): Player[] {
  const winnerSet =
    allWinners instanceof Set ? allWinners : new Set(allWinners);

  return players.map((p) => {
    const share = finalShares[p.id] || 0;

    // Optimization: if no share, return original object reference
    if (share <= 0) return p;

    return {
      ...p,
      stack: p.stack + share,
      wins: winnerSet.has(p.id) ? (p.wins || 0) + 1 : p.wins,
    };
  });
}

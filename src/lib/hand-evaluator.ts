import { Hand } from "pokersolver";
import type { Hand as PokerSolverHand } from "pokersolver";

export interface HandResult {
  value: number;
  handName: string;
  descr: string;
}

export interface WinnerResult {
  playerId: string;
  handDescription: string;
}

export interface PlayerHandInfo {
  cards: string[];
  value: number;
  handName: string;
  handDescription: string;
  isWinner: boolean;
}

type PlayerCardsById = Record<string, string[]>;

type PokerSolverHandLike = {
  rank: number;
  name: string;
  descr: string;
};

function isPokerSolverHandLike(x: unknown): x is PokerSolverHandLike {
  return (
    typeof x === "object" &&
    x !== null &&
    "rank" in x &&
    "name" in x &&
    "descr" in x &&
    typeof (x as { rank: unknown }).rank === "number" &&
    typeof (x as { name: unknown }).name === "string" &&
    typeof (x as { descr: unknown }).descr === "string"
  );
}

function toHandLike(x: unknown): PokerSolverHandLike {
  if (!isPokerSolverHandLike(x)) {
    throw new Error("Unexpected pokersolver hand shape");
  }
  return x;
}

function handKey(hand: PokerSolverHandLike): string {
  return `${hand.rank}|${hand.name}|${hand.descr}`;
}

export function evaluateHand(cards: string[]): HandResult {
  try {
    const raw: unknown = Hand.solve(cards);
    const hand = toHandLike(raw);
    return { value: hand.rank, handName: hand.name, descr: hand.descr };
  } catch (e) {
    console.error("Error evaluating hand:", cards, e);
    return { value: 0, handName: "Unknown", descr: "Error" };
  }
}

/**
 * Evaluate a full showdown:
 * - Hold'em: priv = 2 hole cards, boardCards = 5
 * - Stud: priv = all 5 cards, boardCards = []
 *
 * Returns BOTH winners and per-player hand descriptions (including losers).
 */
export function evaluateShowdown(
  playerCardsById: PlayerCardsById,
  boardCards: string[] = [],
  opts?: { requireFiveCardBoard?: boolean }
): {
  winners: WinnerResult[];
  allHandsByPlayerId: Record<string, PlayerHandInfo>;
} {
  try {
    const requireFive = opts?.requireFiveCardBoard ?? true;

    // If boardCards is present (non-empty), require exactly 5 when requireFive is true. (Hold'em)
    // If boardCards is empty, allow it. (Stud)
    if (requireFive && boardCards.length > 0 && boardCards.length !== 5) {
      throw new Error(
        `Board must be 5 cards for showdown (got ${boardCards.length})`
      );
    }

    const entries = Object.entries(playerCardsById);
    if (entries.length === 0) return { winners: [], allHandsByPlayerId: {} };
    const solved = entries.map(([playerId, priv]) => {
      const allCards = [...priv, ...boardCards];
      if (allCards.length < 5) {
        throw new Error(
          `Player ${playerId} has insufficient cards: ${allCards.length}`
        );
      }

      const rawHand = Hand.solve(allCards) as PokerSolverHand;
      const hand = toHandLike(rawHand);
      const key = handKey(hand);

      return { playerId, cards: allCards, rawHand, hand, key };
    });

    const hands: PokerSolverHand[] = solved.map((s) => s.rawHand);
    const winnersHands = Hand.winners(hands);
    const winnerKeys = new Set(winnersHands.map((h) => handKey(toHandLike(h))));

    const winners: WinnerResult[] = solved
      .filter((s) => winnerKeys.has(s.key))
      .map((s) => ({ playerId: s.playerId, handDescription: s.hand.descr }));

    const allHandsByPlayerId: Record<string, PlayerHandInfo> = {};
    for (const s of solved) {
      const isWinner = winnerKeys.has(s.key);
      allHandsByPlayerId[s.playerId] = {
        cards: s.cards,
        value: s.hand.rank,
        handName: s.hand.name,
        handDescription: s.hand.descr,
        isWinner,
      };
    }

    return { winners, allHandsByPlayerId };
  } catch (e) {
    console.error("Error in evaluateShowdown:", e);
    return { winners: [], allHandsByPlayerId: {} };
  }
}

/**
 * Backwards-compatible API:
 * - Returns winners only (same behavior as before).
 */
export function evaluateWinners(
  playerCardsById: PlayerCardsById,
  boardCards: string[] = [],
  opts?: { requireFiveCardBoard?: boolean }
): WinnerResult[] {
  return evaluateShowdown(playerCardsById, boardCards, opts).winners;
}

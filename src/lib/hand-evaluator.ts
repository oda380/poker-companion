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
  bestHandCards?: string[];
}

type PlayerCardsById = Record<string, string[]>;

type SolverCard = {
  rank: number;
  value: string;
  suit: string;
  wildValue?: string;
};

// What we actually rely on from pokersolver instances.
type PokerSolverHandLike = {
  rank: number;
  name: string;
  descr: string;
  cards?: SolverCard[];
};

type ComparableHand = PokerSolverHand & {
  compare: (other: PokerSolverHand) => number;
};

function isPokerSolverHandLike(x: unknown): x is PokerSolverHandLike {
  if (typeof x !== "object" || x === null) return false;

  const obj = x as Record<string, unknown>;
  return (
    typeof obj.rank === "number" &&
    typeof obj.name === "string" &&
    typeof obj.descr === "string"
  );
}

function toHandLike(x: unknown): PokerSolverHandLike {
  if (!isPokerSolverHandLike(x)) {
    throw new Error("Unexpected pokersolver hand shape");
  }
  return x;
}

function hasCompare(hand: PokerSolverHand): hand is ComparableHand {
  const maybe = hand as unknown as { compare?: unknown };
  return typeof maybe.compare === "function";
}

function best5FromHandLike(hand: PokerSolverHandLike): string[] | undefined {
  return hand.cards?.map((c) => `${c.value}${c.suit}`);
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

    // Hold'em: if boardCards provided, require exactly 5 when requireFive is true.
    // Stud: boardCards should be empty (allowed).
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
      const handLike = toHandLike(rawHand);

      return { playerId, cards: allCards, rawHand, handLike };
    });

    const hands = solved.map((s) => s.rawHand);
    let winnersHands = Hand.winners(hands) as PokerSolverHand[];

    /**
     * ✅ Robust kicker tie-break
     * If pokersolver groups winners too broadly (e.g. "Pair, 8s" for both),
     * we re-check with .compare(), which includes kickers.
     */
    if (winnersHands.length > 1) {
      const comparable = winnersHands.every(hasCompare);

      if (comparable) {
        let best = winnersHands[0] as ComparableHand;

        for (let i = 1; i < winnersHands.length; i++) {
          const h = winnersHands[i] as ComparableHand;
          if (h.compare(best) > 0) best = h;
        }

        winnersHands = winnersHands.filter(
          (h) => (h as ComparableHand).compare(best) === 0
        );
      } else {
        // If typings/runtime ever differ, don't explode—just keep pokersolver result.
        console.warn(
          "[evaluateShowdown] Some Hand instances lack compare(); skipping kicker tie-break."
        );
      }
    }

    // Reference equality is safest for mapping back to playerIds
    const winningHandObjects = new Set(winnersHands);

    const winners: WinnerResult[] = solved
      .filter((s) => winningHandObjects.has(s.rawHand))
      .map((s) => ({
        playerId: s.playerId,
        handDescription: s.handLike.descr,
      }));

    const allHandsByPlayerId: Record<string, PlayerHandInfo> = {};
    for (const s of solved) {
      const isWinner = winningHandObjects.has(s.rawHand);

      allHandsByPlayerId[s.playerId] = {
        cards: s.cards,
        value: s.handLike.rank,
        handName: s.handLike.name,
        handDescription: s.handLike.descr,
        isWinner,
        bestHandCards: best5FromHandLike(s.handLike),
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

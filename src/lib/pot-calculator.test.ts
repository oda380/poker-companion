// src/lib/__tests__/pot-calculator.test.ts
import { describe, it, expect } from "vitest";
import { calculatePots, type PlayerCommitment } from "@/lib/pot-calculator";

// --- Helpers (mirror ShowdownDialog) ---
type PlayerSeat = { id: string; seat: number };

function buildSeatRing(playersInHand: PlayerSeat[], dealerSeat: number) {
  const sorted = [...playersInHand].sort((a, b) => a.seat - b.seat);
  const dealerIdx = sorted.findIndex((p) => p.seat === dealerSeat);
  if (dealerIdx >= 0) {
    return [...sorted.slice(dealerIdx + 1), ...sorted.slice(0, dealerIdx + 1)];
  }
  return sorted;
}

function applyRefundsToShares(
  shares: Record<string, number>,
  refunds: Record<string, number>
) {
  const next = { ...shares };
  for (const [playerId, amt] of Object.entries(refunds)) {
    next[playerId] = (next[playerId] || 0) + amt;
  }
  return next;
}

function calculateWinnerSharesFromPotResults(args: {
  potResults: Array<{
    potAmount: number;
    winners: Array<{ playerId: string }>;
    eligiblePlayerIds: string[];
  }>;
  players: PlayerSeat[];
  dealerSeat: number;
}) {
  const { potResults, players, dealerSeat } = args;

  const shares: Record<string, number> = {};

  for (const potResult of potResults) {
    const eligiblePlayers = players.filter((p) =>
      potResult.eligiblePlayerIds.includes(p.id)
    );

    const ring = buildSeatRing(
      eligiblePlayers.map((p) => ({ id: p.id, seat: p.seat })),
      dealerSeat
    );

    const pos = new Map<string, number>();
    ring.forEach((p, idx) => pos.set(p.id, idx));

    const winnersSorted = [...potResult.winners].sort(
      (a, b) =>
        (pos.get(a.playerId) ?? Number.MAX_SAFE_INTEGER) -
        (pos.get(b.playerId) ?? Number.MAX_SAFE_INTEGER)
    );

    const n = Math.max(1, winnersSorted.length);
    const base = Math.floor(potResult.potAmount / n);
    const rem = potResult.potAmount % n;

    winnersSorted.forEach((w, i) => {
      const potShare = base + (i < rem ? 1 : 0);
      shares[w.playerId] = (shares[w.playerId] || 0) + potShare;
    });
  }

  return shares;
}

function sortIds(ids: string[]) {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function expectPotLike(
  actual: { amount: number; eligiblePlayerIds: string[] },
  expected: { amount: number; eligible: string[] }
) {
  expect(actual.amount).toBe(expected.amount);
  expect(sortIds(actual.eligiblePlayerIds)).toEqual(sortIds(expected.eligible));
}

// --- Test cases ---
type Case = {
  name: string;
  dealerSeat: number;
  players: PlayerSeat[];
  commitments: PlayerCommitment[];
  expected: {
    pots: Array<{ amount: number; eligible: string[] }>;
    refunds: Record<string, number>;
    // optional share tests
    potWinners?: Array<string[]>; // winners per pot index (tie => multiple)
    expectedShares?: Record<string, number>;
  };
};

const CASES: Case[] = [
  {
    name: "1) Simple single pot (3-way), no side pots",
    dealerSeat: 1,
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
    ],
    commitments: [
      { playerId: "A", amount: 100, isFolded: false },
      { playerId: "B", amount: 100, isFolded: false },
      { playerId: "C", amount: 100, isFolded: false },
    ],
    expected: {
      pots: [{ amount: 300, eligible: ["A", "B", "C"] }],
      refunds: {},
      potWinners: [["A"]],
      expectedShares: { A: 300 },
    },
  },

  {
    name: "2) Classic side pot: A all-in small, B/C deeper",
    dealerSeat: 2,
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
    ],
    commitments: [
      { playerId: "A", amount: 50, isFolded: false },
      { playerId: "B", amount: 200, isFolded: false },
      { playerId: "C", amount: 200, isFolded: false },
    ],
    expected: {
      pots: [
        { amount: 150, eligible: ["A", "B", "C"] },
        { amount: 300, eligible: ["B", "C"] },
      ],
      refunds: {},
      potWinners: [["A"], ["C"]],
      expectedShares: { A: 150, C: 300 },
    },
  },

  {
    name: "3) Uncalled overbet refund (only one contributor in top slice)",
    dealerSeat: 3,
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
    ],
    commitments: [
      { playerId: "A", amount: 100, isFolded: false },
      { playerId: "B", amount: 300, isFolded: false },
      { playerId: "C", amount: 100, isFolded: true },
    ],
    expected: {
      pots: [{ amount: 300, eligible: ["A", "B"] }],
      refunds: { B: 200 },
      potWinners: [["A"]],
      expectedShares: { A: 300, B: 200 },
    },
  },

  {
    name: "4) Option B: Uncontested slices (others contributed but folded) => pot (counts as win)",
    dealerSeat: 1,
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
    ],
    commitments: [
      { playerId: "A", amount: 200, isFolded: false },
      { playerId: "B", amount: 200, isFolded: true },
      { playerId: "C", amount: 50, isFolded: true },
    ],
    expected: {
      pots: [
        { amount: 150, eligible: ["A"] },
        { amount: 300, eligible: ["A"] },
      ],
      refunds: {},
      potWinners: [["A"], ["A"]],
      expectedShares: { A: 450 },
    },
  },

  {
    name: "5) Refunds-only: single participant hand => all refunded",
    dealerSeat: 1,
    players: [{ id: "A", seat: 1 }],
    commitments: [{ playerId: "A", amount: 100, isFolded: false }],
    expected: {
      pots: [],
      refunds: { A: 100 },
      expectedShares: { A: 100 },
    },
  },

  {
    name: "6) Tie split + uncalled 1-chip refund (A:51, D:50) => A ends with 51, D 50",
    dealerSeat: 2, // ring: C, D, A, B (between D and A, D is earlier)
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
      { id: "D", seat: 4 },
    ],
    commitments: [
      { playerId: "A", amount: 51, isFolded: false },
      { playerId: "D", amount: 50, isFolded: false },
      { playerId: "B", amount: 0, isFolded: false },
      { playerId: "C", amount: 0, isFolded: false },
    ],
    expected: {
      pots: [{ amount: 100, eligible: ["A", "D"] }],
      refunds: { A: 1 },
      potWinners: [["A", "D"]], // tie on the 100-chip pot
      expectedShares: { A: 51, D: 50 },
    },
  },

  {
    name: "7) 0 eligible guard: everyone folded => deterministic pro-rata refunds",
    dealerSeat: 1,
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
    ],
    commitments: [
      { playerId: "A", amount: 100, isFolded: true },
      { playerId: "B", amount: 100, isFolded: true },
      { playerId: "C", amount: 50, isFolded: true },
    ],
    expected: {
      pots: [],
      refunds: { A: 100, B: 100, C: 50 },
      expectedShares: { A: 100, B: 100, C: 50 },
    },
  },

  {
    name: "8) Complex: 2 pots + top-slice refund; multiple winners across pots",
    dealerSeat: 4,
    players: [
      { id: "A", seat: 1 },
      { id: "B", seat: 2 },
      { id: "C", seat: 3 },
      { id: "D", seat: 4 },
    ],
    commitments: [
      { playerId: "A", amount: 120, isFolded: false },
      { playerId: "B", amount: 250, isFolded: false },
      { playerId: "C", amount: 250, isFolded: false },
      { playerId: "D", amount: 400, isFolded: false },
    ],
    expected: {
      pots: [
        { amount: 480, eligible: ["A", "B", "C", "D"] },
        { amount: 390, eligible: ["B", "C", "D"] },
      ],
      refunds: { D: 150 },
      // pot1 winners: A & C (split 480 => 240/240)
      // pot2 winners: B,C,D (split 390 => 130 each)
      potWinners: [
        ["A", "C"],
        ["B", "C", "D"],
      ],
      expectedShares: { A: 240, B: 130, C: 370, D: 280 },
    },
  },
];

describe("pot-calculator (calculatePots)", () => {
  for (const tc of CASES) {
    it(tc.name, () => {
      const { pots, refunds } = calculatePots(tc.commitments);

      expect(pots).toHaveLength(tc.expected.pots.length);

      // Match pots by amount+eligible set (order-insensitive)
      const remaining = [...pots];
      for (const expectedPot of tc.expected.pots) {
        const idx = remaining.findIndex(
          (p) =>
            p.amount === expectedPot.amount &&
            sortIds(p.eligiblePlayerIds).join(",") ===
              sortIds(expectedPot.eligible).join(",")
        );
        expect(idx).toBeGreaterThanOrEqual(0);
        remaining.splice(idx, 1);
      }

      expect(refunds).toEqual(tc.expected.refunds);
    });
  }
});

describe("payout share math (seat-ring remainder + refunds)", () => {
  for (const tc of CASES) {
    it(tc.name, () => {
      const { pots, refunds } = calculatePots(tc.commitments);

      if (!tc.expected.expectedShares) {
        // no share expectation for this case
        expect(true).toBe(true);
        return;
      }

      // Build potResults from actual pots + test-provided winners (if any).
      // If no potWinners specified, treat as refunds-only distribution.
      const potWinners = tc.expected.potWinners ?? [];
      expect(potWinners.length).toBe(pots.length);

      const potResults = pots.map((pot, i) => ({
        potAmount: pot.amount,
        eligiblePlayerIds: pot.eligiblePlayerIds,
        winners: (potWinners[i] ?? []).map((playerId) => ({ playerId })),
      }));

      const baseShares = calculateWinnerSharesFromPotResults({
        potResults,
        players: tc.players,
        dealerSeat: tc.dealerSeat,
      });

      const finalShares = applyRefundsToShares(baseShares, refunds);

      expect(finalShares).toEqual(tc.expected.expectedShares);
    });
  }
});

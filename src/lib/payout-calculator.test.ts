import { describe, it, expect } from "vitest";
import { applyPayoutsToPlayers } from "@/lib/payout-calculator";
import type { Player } from "@/types";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: overrides.id ?? "P",
    name: overrides.name ?? "Player",
    seat: overrides.seat ?? 1,
    stack: overrides.stack ?? 0,
    isSittingOut: overrides.isSittingOut ?? false,
    status: overrides.status ?? "active", // assumes your PlayerStatus includes "active"
    wins: overrides.wins ?? 0,
  };
}

describe("payout-calculator (applyPayoutsToPlayers)", () => {
  it("adds shares to stacks and increments wins for winners only", () => {
    const players: Player[] = [
      makePlayer({ id: "A", seat: 1, stack: 100, wins: 2 }),
      makePlayer({ id: "B", seat: 2, stack: 100, wins: 0 }),
      makePlayer({ id: "C", seat: 3, stack: 100, wins: 5 }),
    ];

    const finalShares: Record<string, number> = { A: 30, B: 10, C: 0 };
    const allWinners = new Set<string>(["A"]); // B got chips but is not considered a "winner" (e.g., refund-only)

    const next = applyPayoutsToPlayers(players, finalShares, allWinners);

    expect(next.map((p) => p.stack)).toEqual([130, 110, 100]);
    expect(next.map((p) => p.wins)).toEqual([3, 0, 5]);

    // unchanged => same reference (optimization)
    expect(next[2]).toBe(players[2]);

    // changed => new objects
    expect(next[0]).not.toBe(players[0]);
    expect(next[1]).not.toBe(players[1]);
  });

  it("returns same player object references when shares are missing/zero/negative", () => {
    const players: Player[] = [
      makePlayer({ id: "A", seat: 1, stack: 50, wins: 1 }),
      makePlayer({ id: "B", seat: 2, stack: 75, wins: 9 }),
    ];

    const next1 = applyPayoutsToPlayers(players, {}, ["A"]);
    expect(next1).not.toBe(players); // array is new (map)
    expect(next1[0]).toBe(players[0]);
    expect(next1[1]).toBe(players[1]);

    const next2 = applyPayoutsToPlayers(players, { A: 0, B: 0 }, ["A"]);
    expect(next2[0]).toBe(players[0]);
    expect(next2[1]).toBe(players[1]);

    const next3 = applyPayoutsToPlayers(players, { A: -5, B: 0 }, ["A"]);
    expect(next3[0]).toBe(players[0]);
    expect(next3[1]).toBe(players[1]);
  });

  it("accepts allWinners as Array or Set (same output)", () => {
    const players: Player[] = [
      makePlayer({ id: "A", seat: 1, stack: 10, wins: 0 }),
    ];
    const finalShares = { A: 5 };

    const nextFromArray = applyPayoutsToPlayers(players, finalShares, ["A"]);
    const nextFromSet = applyPayoutsToPlayers(
      players,
      finalShares,
      new Set(["A"])
    );

    expect(nextFromArray[0].stack).toBe(15);
    expect(nextFromArray[0].wins).toBe(1);

    expect(nextFromSet[0].stack).toBe(15);
    expect(nextFromSet[0].wins).toBe(1);
  });

  it("refund-only chips should not count as a win (Option A behavior)", () => {
    const players: Player[] = [
      makePlayer({ id: "A", seat: 1, stack: 100, wins: 0 }),
      makePlayer({ id: "B", seat: 2, stack: 100, wins: 0 }),
    ];

    // A gets chips, but not counted as winner
    const finalShares = { A: 20, B: 0 };
    const allWinners = new Set<string>(); // empty

    const next = applyPayoutsToPlayers(players, finalShares, allWinners);

    expect(next[0].stack).toBe(120);
    expect(next[0].wins).toBe(0);
  });
});

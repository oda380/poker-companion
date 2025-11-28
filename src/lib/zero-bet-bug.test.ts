
import { describe, it, expect } from "vitest";
import { calculatePots } from "./pot-calculator";

describe("Zero-Bet Showdown Bug Reproduction", () => {
    it("should return empty pots and refunds when no money is committed", () => {
        const commitments = [
            { playerId: "p1", amount: 0, isFolded: false },
            { playerId: "p2", amount: 0, isFolded: false },
        ];

        const result = calculatePots(commitments);

        // This is what causes the bug:
        expect(result.pots).toHaveLength(0);
        expect(Object.keys(result.refunds)).toHaveLength(0);
    });

    it("should handle ante-only scenario correctly (Stud usually has ante)", () => {
        const commitments = [
            { playerId: "p1", amount: 10, isFolded: false }, // Ante 10
            { playerId: "p2", amount: 10, isFolded: false }, // Ante 10
        ];

        const result = calculatePots(commitments);

        expect(result.pots).toHaveLength(1);
        expect(result.pots[0].amount).toBe(20);
    });
});

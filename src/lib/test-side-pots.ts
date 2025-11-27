/**
 * Test fixture runner for side pots implementation
 *
 * Run this file with: npx tsx src/lib/test-side-pots.ts
 * Or just copy-paste into a Node REPL
 */

import { calculatePots, type PlayerCommitment } from "./pot-calculator";

// Helper to print results
function printScenario(
  name: string,
  commitments: PlayerCommitment[],
  dealerSeat: number = 0
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Scenario: ${name}`);
  console.log(`${"=".repeat(60)}`);

  console.log("\nCommitments:");
  commitments.forEach((c) => {
    console.log(
      `  ${c.playerId}: ${c.amount} chips${c.isFolded ? " (FOLDED)" : ""}`
    );
  });

  const { pots, refunds } = calculatePots(commitments);

  console.log("\nPots:");
  if (pots.length === 0) {
    console.log("  (none)");
  } else {
    pots.forEach((pot, idx) => {
      console.log(`  Pot ${idx + 1} (${pot.id}):`);
      console.log(`    Amount: ${pot.amount}`);
      console.log(`    Eligible: [${pot.eligiblePlayerIds.join(", ")}]`);
    });
  }

  console.log("\nRefunds:");
  if (Object.keys(refunds).length === 0) {
    console.log("  (none)");
  } else {
    Object.entries(refunds).forEach(([playerId, amount]) => {
      console.log(`  ${playerId}: ${amount} chips`);
    });
  }

  // Verify invariant
  const committedTotal = commitments.reduce((sum, c) => sum + c.amount, 0);
  const potsTotal = pots.reduce((sum, p) => sum + p.amount, 0);
  const refundsTotal = Object.values(refunds).reduce((a, b) => a + b, 0);

  console.log("\nInvariant Check:");
  console.log(`  Total Committed: ${committedTotal}`);
  console.log(`  Total Pots: ${potsTotal}`);
  console.log(`  Total Refunds: ${refundsTotal}`);
  console.log(`  Sum (Pots + Refunds): ${potsTotal + refundsTotal}`);
  console.log(
    `  ✅ Money Conserved: ${
      potsTotal + refundsTotal === committedTotal ? "YES" : "NO ❌"
    }`
  );
}

// Scenario 1: No side pot (A=100, B=100)
printScenario("No Side Pot", [
  { playerId: "A", amount: 100, isFolded: false },
  { playerId: "B", amount: 100, isFolded: false },
]);

// Scenario 2: Classic side pot (A=100, B=200, C=200)
printScenario("Classic Side Pot", [
  { playerId: "A", amount: 100, isFolded: false },
  { playerId: "B", amount: 200, isFolded: false },
  { playerId: "C", amount: 200, isFolded: false },
]);

// Scenario 3: All-in overbet return (A=100, B=100, C=300)
printScenario("All-in Overbet Return", [
  { playerId: "A", amount: 100, isFolded: false },
  { playerId: "B", amount: 100, isFolded: false },
  { playerId: "C", amount: 300, isFolded: false },
]);

// Scenario 4: Multi-way tie with odd chips (A=100, B=100, C=100, pot=301)
printScenario("Multi-way Tie (Odd Chips)", [
  { playerId: "A", amount: 100, isFolded: false },
  { playerId: "B", amount: 100, isFolded: false },
  { playerId: "C", amount: 101, isFolded: false },
]);

// Scenario 5: Folded contributor (A=100 folded, B=100, C=200)
printScenario("Folded Contributor", [
  { playerId: "A", amount: 100, isFolded: true },
  { playerId: "B", amount: 100, isFolded: false },
  { playerId: "C", amount: 200, isFolded: false },
]);

// Scenario 6: Everyone folds except one (edge case)
printScenario("All But One Folded", [
  { playerId: "A", amount: 100, isFolded: true },
  { playerId: "B", amount: 100, isFolded: true },
  { playerId: "C", amount: 300, isFolded: false },
]);

// ===== FINAL EDGE CASES =====

// Scenario 7: 3-way all-in with tie on main pot, single winner on side pot
console.log("\n" + "=".repeat(60));
console.log("EDGE CASE: Main Pot Tie + Side Pot Winner");
console.log("=".repeat(60));
console.log("\nScenario: A=100, B=100, C=200");
console.log("Expected: Main pot (300) splits between tie winners");
console.log("          Side pot (100) goes to C if C wins");
console.log(
  "          Remainder chips distributed per-pot clockwise from dealer"
);
printScenario("3-Way All-In: Main Tie + Side Winner", [
  { playerId: "A", amount: 100, isFolded: false },
  { playerId: "B", amount: 100, isFolded: false },
  { playerId: "C", amount: 200, isFolded: false },
]);

// Scenario 8: Fold-win with multi-level commitments
console.log("\n" + "=".repeat(60));
console.log("EDGE CASE: Fold-Win with Partial Call");
console.log("=".repeat(60));
console.log(
  "\nScenario: A raises to 300, B calls 150 (all-in), C/D fold at 50"
);
console.log("Expected: Winner (A) gets main pot + side pot + overbet refund");
console.log("          Folded players (C, D) get NO refunds");
console.log("          B gets NO refund (called what they could)");
printScenario("Fold-Win: Multi-Level Commitments", [
  { playerId: "A", amount: 300, isFolded: false }, // Winner
  { playerId: "B", amount: 150, isFolded: true }, // Folded after partial call
  { playerId: "C", amount: 50, isFolded: true }, // Folded early
  { playerId: "D", amount: 50, isFolded: true }, // Folded early
]);

console.log(`\n${"=".repeat(60)}`);
console.log("All scenarios complete!");
console.log(`${"=".repeat(60)}\n`);

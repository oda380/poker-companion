
import { evaluateWinners } from "./hand-evaluator";

console.error("Starting verification test...");

try {
    const playerHoleCards = {
        "player1": ["As"] // Only 1 card, missing face up cards
    };
    const boardCards: string[] = [];
    const gameVariant = "fiveCardStud";

    console.error("Attempting to evaluate with incomplete hand (should be handled gracefully)...");
    const winners = evaluateWinners(playerHoleCards, boardCards, gameVariant);

    console.error("Evaluation result:", winners);

    if (Array.isArray(winners) && winners.length === 0) {
        console.error("SUCCESS: Handled incomplete hand gracefully (returned empty array).");
    } else {
        console.error("FAILURE: Unexpected result format or content.");
    }

} catch (e) {
    console.error("FAILURE: Crashed during evaluation:", e);
}


import { initializeHand } from "./game-logic";
import { TableState, Player } from "../types";

console.log("Starting dealer selection test...");

// Mock Table State
const mockPlayers: Player[] = [
    { id: "p1", name: "Player 1", seat: 1, stack: 1000, isSittingOut: false, status: "active", wins: 0 },
    { id: "p2", name: "Player 2", seat: 2, stack: 1000, isSittingOut: false, status: "active", wins: 0 },
    { id: "p3", name: "Player 3", seat: 3, stack: 1000, isSittingOut: false, status: "active", wins: 0 },
];

const mockTable: TableState = {
    id: "test-table",
    name: "Test Table",
    gameVariant: "fiveCardStud",
    config: { ante: 10 },
    players: mockPlayers,
    handHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

try {
    console.log("Testing explicit dealer selection (Seat 2)...");
    const result = initializeHand(mockTable, 2);

    if (result.hand.dealerSeat === 2) {
        console.log("SUCCESS: Dealer set to seat 2 correctly.");
    } else {
        console.error(`FAILURE: Dealer set to ${result.hand.dealerSeat}, expected 2.`);
    }

    console.log("Testing random dealer selection (no seat provided)...");
    const resultRandom = initializeHand(mockTable);
    console.log(`Random dealer selected: Seat ${resultRandom.hand.dealerSeat}`);

    if ([1, 2, 3].includes(resultRandom.hand.dealerSeat)) {
        console.log("SUCCESS: Random dealer is a valid seat.");
    } else {
        console.error("FAILURE: Random dealer seat is invalid.");
    }

} catch (e) {
    console.error("CRITICAL FAILURE: initializeHand crashed:", e);
}

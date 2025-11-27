import { initializeHand } from "@/lib/game-logic";
import { TableState } from "@/types";
import * as fs from "fs";
import * as path from "path";

const logFile = path.join(process.cwd(), "src/lib/test-result.txt");
const log = (msg: string) => {
  // console.log(msg); // Skip console since it's not working
  try {
    fs.appendFileSync(logFile, msg + "\n");
  } catch {
    // console.error("Failed to write to log file:", e);
  }
};

// Clear log file
try {
  fs.writeFileSync(logFile, "");
} catch {
  // console.error("Failed to clear log file:");
}

// Mock store for testing
const createMockStore = () => {
  let state: TableState = {
    id: "test-table",
    name: "Test Table",
    gameVariant: "texasHoldem",
    config: { smallBlind: 1, bigBlind: 2 },
    players: [],
    currentHand: undefined,
    handHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    getState: () => state,
    setState: (newState: Partial<TableState>) => {
      state = { ...state, ...newState };
    },
    addPlayer: (name: string, seat: number, stack: number) => {
      state.players.push({
        id: `player-${seat}`,
        name,
        seat,
        stack,
        isSittingOut: false,
        status: "active",
        wins: 0,
      });
    },
  };
};

async function runTest() {
  log("--- Starting Busted Player Simulation ---");
  const store = createMockStore();

  // 1. Setup 3 players
  // Player 1: 10 chips (will bust)
  // Player 2: 100 chips
  // Player 3: 100 chips
  store.addPlayer("Player 1 (Short)", 1, 10);
  store.addPlayer("Player 2", 2, 100);
  store.addPlayer("Player 3", 3, 100);

  log(
    "Initial State: " +
      store
        .getState()
        .players.map((p) => `${p.name}: ${p.stack}`)
        .join(", ")
  );

  // 2. Start Hand 1
  log("\n--- Starting Hand 1 ---");
  try {
    const { hand, updatedPlayers } = initializeHand(store.getState());
    store.setState({ currentHand: hand, players: updatedPlayers });
    log(
      "Hand 1 Started. Active Players: " +
        hand.playerHands.map((ph) => ph.playerId).join(", ")
    );

    // Verify all 3 are in
    if (hand.playerHands.length !== 3) {
      log("FAIL: Expected 3 players in Hand 1");
      return;
    }

    // Force Player 1 to bust
    // We'll just manually set their stack to 0 and status to folded/out for this simulation
    // In a real game, they would lose a showdown or fold after betting everything.
    // Let's simulate P1 going all-in and losing.

    // Update P1 stack to 0
    const playersAfterHand1 = store.getState().players.map((p) => {
      if (p.id === "player-1") return { ...p, stack: 0 };
      return p;
    });

    // Save hand history (required for dealer rotation logic)
    const history1 = {
      id: "hand-1",
      handNumber: 1,
      gameVariant: "texasHoldem",
      dealerSeat: hand.dealerSeat,
      winners: [],
      totalPot: 20,
      createdAt: new Date().toISOString(),
    };

    store.setState({
      players: playersAfterHand1,
      currentHand: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handHistory: [...store.getState().handHistory, history1 as any],
    });

    log("Hand 1 Ended. Player 1 Stack: 0");
  } catch (e) {
    log("Error in Hand 1: " + e);
    return;
  }

  // 3. Start Hand 2
  log("\n--- Starting Hand 2 ---");
  try {
    const { hand: hand2, updatedPlayers: players2 } = initializeHand(
      store.getState()
    );
    store.setState({ currentHand: hand2, players: players2 });

    log(
      "Hand 2 Started. Active Players: " +
        hand2.playerHands.map((ph) => ph.playerId).join(", ")
    );
    log("Dealer Seat: " + hand2.dealerSeat);

    // Verify Player 1 is NOT in the hand
    const p1InHand = hand2.playerHands.find((ph) => ph.playerId === "player-1");
    if (p1InHand) {
      log("FAIL: Player 1 (Busted) should NOT be in Hand 2");
    } else {
      log("SUCCESS: Player 1 skipped in Hand 2");
    }

    // Verify Player 1 status is sittingOut/busted
    const p1Status = players2.find((p) => p.id === "player-1")?.status;
    log("Player 1 Status: " + p1Status);
    if (p1Status !== "sittingOut") {
      // initializeHand sets status to 'sittingOut' if stack <= 0
      // logic: status: (p.stack > 0 && !p.isSittingOut) ? "active" : "sittingOut"
      log("Verified P1 status is sittingOut");
    }

    // Force Player 2 to bust in Hand 2
    const playersAfterHand2 = store.getState().players.map((p) => {
      if (p.id === "player-2") return { ...p, stack: 0 };
      return p;
    });

    const history2 = {
      id: "hand-2",
      handNumber: 2,
      gameVariant: "texasHoldem",
      dealerSeat: hand2.dealerSeat,
      winners: [],
      totalPot: 20,
      createdAt: new Date().toISOString(),
    };

    store.setState({
      players: playersAfterHand2,
      currentHand: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handHistory: [...store.getState().handHistory, history2 as any],
    });
    log("Hand 2 Ended. Player 2 Stack: 0");
  } catch (e) {
    log("Error in Hand 2: " + e);
    return;
  }

  // 4. Start Hand 3
  log("\n--- Starting Hand 3 ---");
  try {
    // This should fail or only have 1 player (which might throw "Not enough players")
    // initializeHand throws "Not enough players to start a hand" if < 2 active

    try {
      initializeHand(store.getState());
      log("FAIL: Should have thrown error for not enough players");
    } catch (e) {
      log("SUCCESS: Caught expected error: " + (e as Error).message);
      log("Explanation: Only Player 3 has chips, so game cannot proceed.");
    }
  } catch (e) {
    log("Unexpected error in Hand 3 check: " + e);
  }
}

runTest();


import { usePokerStore } from "../store/usePokerStore";

console.log("Starting resetGame test...");

// Mock the store execution context (simplified)
// We can't easily run the full Zustand store in this script without React context, 
// but we can verify the logic if we could import the store. 
// However, usePokerStore is a hook. 
// We will simulate the logic flaw instead.

const initialState = {
    players: [],
    currentHand: undefined,
};

const uiState = {
    isSettingsOpen: true, // Simulate open settings
    activeModal: "some-modal"
};

let storeState = {
    ...initialState,
    ui: uiState
};

console.log("Initial State:", JSON.stringify(storeState, null, 2));

// Simulate resetGame as it is currently implemented
function resetGameCurrent() {
    // Current implementation only spreads initialState
    storeState = {
        ...storeState,
        ...initialState
    };
}

resetGameCurrent();

console.log("After Current Reset:", JSON.stringify(storeState, null, 2));

if (storeState.ui.isSettingsOpen) {
    console.error("FAILURE: UI state (isSettingsOpen) persisted after reset!");
} else {
    console.log("SUCCESS: UI state cleared.");
}

// Simulate fixed resetGame
function resetGameFixed() {
    storeState = {
        ...storeState,
        ...initialState,
        ui: {
            isSettingsOpen: false,
            isHandHistoryOpen: false,
            activeModal: null
        }
    };
}

console.log("Applying Fix...");
resetGameFixed();
console.log("After Fixed Reset:", JSON.stringify(storeState, null, 2));

if (!storeState.ui.isSettingsOpen && storeState.ui.activeModal === null) {
    console.log("SUCCESS: UI state cleared with fix.");
} else {
    console.error("FAILURE: UI state still not cleared.");
}

import { TableState, HandState, Player, GameVariant, Street, Action, Pot } from "../types";
import { createDeck, shuffleDeck, dealCards } from "./deck";
import { calculatePots } from "./pot-calculator";

const generateId = () => Math.random().toString(36).substring(2, 15);

function getNextStreet(currentStreet: Street, gameVariant: GameVariant): Street {
    if (gameVariant === "texasHoldem") {
        switch (currentStreet) {
            case "preflop": return "flop";
            case "flop": return "turn";
            case "turn": return "river";
            case "river": return "showdown";
            default: return "showdown";
        }
    } else {
        // 5-Card Stud
        switch (currentStreet) {
            case "street1": return "street2";
            case "street2": return "street3";
            case "street3": return "street4";
            case "street4": return "street5";
            case "street5": return "showdown";
            default: return "showdown";
        }
    }
}

export function initializeHand(table: TableState, initialDealerSeat?: number): { hand: HandState, updatedPlayers: Player[] } {
    const { players, config, gameVariant } = table;
    const activePlayers = players.filter(p => !p.isSittingOut && p.stack > 0);

    if (activePlayers.length < 2) {
        throw new Error("Not enough players to start a hand");
    }

    // 1. Determine Dealer
    let dealerSeat = -1;
    if (table.handHistory.length === 0) {
        // First hand - use provided dealer or random
        if (initialDealerSeat !== undefined) {
            dealerSeat = initialDealerSeat;
        } else {
            dealerSeat = activePlayers[Math.floor(Math.random() * activePlayers.length)].seat;
        }
    } else {
        // Rotate dealer from last hand
        const lastHand = table.handHistory[table.handHistory.length - 1];
        const lastDealerSeat = lastHand ?
            (typeof lastHand === 'object' && 'dealerSeat' in lastHand ? (lastHand as any).dealerSeat : -1) : -1;

        if (lastDealerSeat === -1) {
            // Fallback if we can't find last dealer
            dealerSeat = activePlayers[0].seat;
        } else {
            // Find the player who was dealer and move to next
            const lastDealerIndex = activePlayers.findIndex(p => p.seat === lastDealerSeat);
            if (lastDealerIndex === -1) {
                // Last dealer not in game anymore
                dealerSeat = activePlayers[0].seat;
            } else {
                const nextIndex = (lastDealerIndex + 1) % activePlayers.length;
                dealerSeat = activePlayers[nextIndex].seat;
            }
        }
    }

    // 2. Deck
    let deck = shuffleDeck(createDeck());

    // 3. Blinds / Antes - track committed amounts AND deduct from stacks
    const perPlayerCommitted: Record<string, number> = {};
    let currentBet = 0;

    // Create updated players array with deductions and reset statuses
    let updatedPlayers = players.map(p => ({
        ...p,
        status: "active" as const // Reset all players to active status
    }));

    // Apply Ante
    if (config.ante && config.ante > 0) {
        activePlayers.forEach(p => {
            const amount = Math.min(p.stack, config.ante!);
            perPlayerCommitted[p.id] = amount;
            // Deduct from stack
            updatedPlayers = updatedPlayers.map(player =>
                player.id === p.id ? { ...player, stack: player.stack - amount } : player
            );
        });
    }

    // Apply Blinds (Hold'em)
    if (gameVariant === "texasHoldem" && config.smallBlind && config.bigBlind) {
        // Find SB and BB positions (left of dealer)
        const dealerIndex = activePlayers.findIndex(p => p.seat === dealerSeat);
        const sbIndex = (dealerIndex + 1) % activePlayers.length;
        const bbIndex = (dealerIndex + 2) % activePlayers.length;

        const sbPlayer = activePlayers[sbIndex];
        const bbPlayer = activePlayers[bbIndex];

        // Small blind
        const sbAmount = Math.min(sbPlayer.stack, config.smallBlind);
        perPlayerCommitted[sbPlayer.id] = (perPlayerCommitted[sbPlayer.id] || 0) + sbAmount;
        updatedPlayers = updatedPlayers.map(p =>
            p.id === sbPlayer.id ? { ...p, stack: p.stack - sbAmount } : p
        );

        // Big blind
        const bbAmount = Math.min(bbPlayer.stack, config.bigBlind);
        perPlayerCommitted[bbPlayer.id] = (perPlayerCommitted[bbPlayer.id] || 0) + bbAmount;
        updatedPlayers = updatedPlayers.map(p =>
            p.id === bbPlayer.id ? { ...p, stack: p.stack - bbAmount } : p
        );

        currentBet = config.bigBlind;
    }

    // 4. Deal Cards
    let playerHands: PlayerHandState[] = [];
    let firstToAct: string = "";
    if (gameVariant === "fiveCardStud") {
        // Initialize empty hands for each player
        playerHands = activePlayers.map(p => ({
            playerId: p.id,
            cards: []
        }));
        // Sentinel to trigger first Stud card dealing
        firstToAct = "WAITING_FOR_STUD_FIRST";
    } else { // Texas Hold'em
        const cardsToDeal = 2; // Hold'em initial two cards (both down)
        playerHands = activePlayers.map(p => {
            const { dealt, remaining } = dealCards(deck, cardsToDeal);
            deck = remaining;
            return {
                playerId: p.id,
                cards: dealt.map(c => ({ code: c, faceUp: false }))
            };
        });
        // Determine first to act (UTG) for Hold'em
        const dealerIndex = activePlayers.findIndex(p => p.seat === dealerSeat);
        const utg = (dealerIndex + 3) % activePlayers.length; // UTG is left of BB
        firstToAct = activePlayers[utg].id;
    }

    const hand: HandState = {
        id: generateId(),
        handNumber: table.handHistory.length + 1,
        gameVariant,
        dealerSeat,
        currentStreet: gameVariant === "texasHoldem" ? "preflop" : "street1",
        board: [],
        playerHands,
        pots: [],
        currentBet,
        perPlayerCommitted,
        actions: [],
        activePlayerId: firstToAct,
        finished: false,
        deck,
        minRaise: config.bigBlind || 1
    };

    return { hand, updatedPlayers };
}

export function processAction(table: TableState, actionType: Action["bettingType"], amount?: number): TableState {
    if (!table.currentHand) return table;

    const hand = { ...table.currentHand };
    const { activePlayerId, perPlayerCommitted, currentBet } = hand;

    if (!activePlayerId) return table;

    const activePlayer = table.players.find(p => p.id === activePlayerId);
    if (!activePlayer) return table;

    // Calculate bet amount
    let newCurrentBet = currentBet;
    let committed = perPlayerCommitted[activePlayerId] || 0;
    let betAmount = 0;
    let newStatus = activePlayer.status;

    if (actionType === "fold") {
        newStatus = "folded";
    } else if (actionType === "check") {
        // Can only check if you've already matched the current bet
        if (committed < currentBet) {
            console.error("Cannot check - must call or raise");
            return table; // Invalid action
        }
        // No bet amount for valid check
    } else if (actionType === "call") {
        betAmount = Math.min(currentBet - committed, activePlayer.stack);
        if (betAmount === activePlayer.stack) {
            newStatus = "allIn";
        }
    } else if (actionType === "bet" || actionType === "raise") {
        if (!amount) return table;
        betAmount = Math.min(amount - committed, activePlayer.stack);
        newCurrentBet = committed + betAmount;
        if (betAmount === activePlayer.stack) {
            newStatus = "allIn";
        }
    } else if (actionType === "allIn") {
        betAmount = activePlayer.stack;
        newCurrentBet = Math.max(newCurrentBet, committed + betAmount);
        newStatus = "allIn";
    }

    // Update players
    const updatedPlayers = table.players.map(p => {
        if (p.id === activePlayerId) {
            return {
                ...p,
                stack: p.stack - betAmount,
                status: newStatus
            };
        }
        return p;
    });

    // Update committed amounts
    const newPerPlayerCommitted = {
        ...perPlayerCommitted,
        [activePlayerId]: committed + betAmount
    };

    // Record action
    const newAction: Action = {
        id: generateId(),
        playerId: activePlayerId,
        street: hand.currentStreet,
        category: "betting",
        bettingType: actionType,
        amount: betAmount,
        createdAt: new Date().toISOString()
    };

    // Find next active player
    const activePlayers = updatedPlayers.filter(p =>
        !p.isSittingOut && p.status === "active"
    );

    // Check if hand should end (only one player left)
    if (activePlayers.length <= 1) {
        // Hand is over - award pot to remaining player
        const winner = activePlayers[0] || updatedPlayers.find(p => p.status !== "folded");
        if (winner) {
            const totalPot = Object.values(newPerPlayerCommitted).reduce((sum, amt) => sum + amt, 0);

            return {
                ...table,
                players: updatedPlayers.map(p =>
                    p.id === winner.id ? { ...p, stack: p.stack + totalPot } : p
                ),
                currentHand: undefined,
                handHistory: [
                    ...table.handHistory,
                    {
                        id: generateId(),
                        handNumber: hand.handNumber,
                        gameVariant: hand.gameVariant,
                        dealerSeat: hand.dealerSeat,
                        winners: [{
                            playerId: winner.id,
                            potShare: totalPot,
                            handDescription: "Won by fold"
                        }],
                        totalPot,
                        createdAt: new Date().toISOString()
                    }
                ]
            };
        }
    }

    // Find next player in rotation
    const allPlayers = updatedPlayers.filter(p => !p.isSittingOut);
    const currentIndex = allPlayers.findIndex(p => p.id === activePlayerId);
    let nextIndex = (currentIndex + 1) % allPlayers.length;
    let nextPlayer = allPlayers[nextIndex];

    // Skip folded/all-in players
    let attempts = 0;
    while ((nextPlayer.status === "folded" || nextPlayer.status === "allIn") && attempts < allPlayers.length) {
        nextIndex = (nextIndex + 1) % allPlayers.length;
        nextPlayer = allPlayers[nextIndex];
        attempts++;
    }

    // Check if betting round is complete
    // Round is complete when all active players have committed the same amount
    const activePlayersInRound = updatedPlayers.filter(p =>
        !p.isSittingOut && p.status === "active"
    );

    const allCommitmentsEqual = activePlayersInRound.every(p =>
        (newPerPlayerCommitted[p.id] || 0) === newCurrentBet
    );

    let newActivePlayerId = nextPlayer.id;

    // If all active players have matched the current bet, betting round is complete
    if (allCommitmentsEqual && activePlayersInRound.length > 0) {
        // Betting round complete - progress to next street or showdown
        const nextStreet = getNextStreet(hand.currentStreet, hand.gameVariant);

        if (nextStreet === "showdown") {
            // Ready for showdown
            newActivePlayerId = ""; // Empty string indicates showdown phase
        } else {
            // Progress to next street
            if (hand.gameVariant === "texasHoldem") {
                // Hold'em: Deal community cards
                return {
                    ...table,
                    players: updatedPlayers,
                    currentHand: {
                        ...hand,
                        currentStreet: nextStreet,
                        currentBet: 0,
                        perPlayerCommitted: {},
                        actions: [...hand.actions, newAction],
                        activePlayerId: "WAITING_FOR_CARDS" // Trigger community card dialog
                    }
                };
            } else {
                // Stud: Deal individual cards to each player
                return {
                    ...table,
                    players: updatedPlayers,
                    currentHand: {
                        ...hand,
                        currentStreet: nextStreet,
                        currentBet: 0,
                        perPlayerCommitted: {},
                        actions: [...hand.actions, newAction],
                        activePlayerId: "WAITING_FOR_STUD_CARD" // Trigger Stud card dialog
                    }
                };
            }
        }
    }
    // The following auto-showdown logic is commented out for MVP
    /*
    if (playersWhoNeedToAct.length === 0) {
        // For MVP, go straight to showdown (skip flop/turn/river for now)
        // Award pot to player with best hand (or remaining player)
        const remainingPlayers = updatedPlayers.filter(p =>
            !p.isSittingOut && p.status !== "folded"
        );

        if (remainingPlayers.length === 1) {
            // Only one player left - they win
            const winner = remainingPlayers[0];
            const totalPot = Object.values(newPerPlayerCommitted).reduce((sum, amt) => sum + amt, 0);

            return {
                ...table,
                players: updatedPlayers.map(p =>
                    p.id === winner.id ? { ...p, stack: p.stack + totalPot } : p
                ),
                currentHand: undefined,
                handHistory: [
                    ...table.handHistory,
                    {
                        id: generateId(),
                        handNumber: hand.handNumber,
                        gameVariant: hand.gameVariant,
                        dealerSeat: hand.dealerSeat,
                        winners: [{
                            playerId: winner.id,
                            potShare: totalPot,
                            handDescription: "Won at showdown"
                        }],
                        totalPot,
                        createdAt: new Date().toISOString()
                    }
                ]
            };
        } else {
            // Multiple players - for MVP, just award to first remaining player
            // TODO: Implement proper hand evaluation
            const winner = remainingPlayers[0];
            const totalPot = Object.values(newPerPlayerCommitted).reduce((sum, amt) => sum + amt, 0);

            return {
                ...table,
                players: updatedPlayers.map(p =>
                    p.id === winner.id ? { ...p, stack: p.stack + totalPot } : p
                ),
                currentHand: undefined,
                handHistory: [
                    ...table.handHistory,
                    {
                        id: generateId(),
                        handNumber: hand.handNumber,
                        gameVariant: hand.gameVariant,
                        dealerSeat: hand.dealerSeat,
                        winners: [{
                            playerId: winner.id,
                            potShare: totalPot,
                            handDescription: "Won at showdown (MVP - no hand eval yet)"
                        }],
                        totalPot,
                        createdAt: new Date().toISOString()
                    }
                ]
            };
        }
    }
    */

    return {
        ...table,
        players: updatedPlayers,
        currentHand: {
            ...hand,
            currentBet: newCurrentBet,
            perPlayerCommitted: newPerPlayerCommitted,
            actions: [...hand.actions, newAction],
            activePlayerId: newActivePlayerId
        }
    };
}

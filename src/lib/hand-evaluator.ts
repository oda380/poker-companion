import { Hand } from "pokersolver";

export interface HandResult {
    value: number;
    handName: string;
    descr: string;
}

export function evaluateHand(cards: string[]): HandResult {
    try {
        // pokersolver expects cards like "As", "Td", "2c" which matches our format
        const hand = Hand.solve(cards);

        return {
            value: hand.rank,
            handName: hand.name,
            descr: hand.descr
        };
    } catch (e) {
        console.error("Error evaluating hand:", cards, e);
        return {
            value: 0,
            handName: "Unknown",
            descr: "Error"
        };
    }
}

export interface WinnerResult {
    playerId: string;
    handDescription: string;
}

export function evaluateWinners(
    playerHoleCards: Record<string, string[]>, // playerId -> [card1, card2]
    boardCards: string[],
    gameVariant: string
): WinnerResult[] {
    // For Texas Hold'em, combine each player's 2 hole cards with 5 board cards
    // pokersolver will find the best 5-card hand from the 7 cards

    const playerHands = Object.entries(playerHoleCards).map(([playerId, holeCards]) => {
        const allCards = [...holeCards, ...boardCards];
        const hand = Hand.solve(allCards);
        return {
            playerId,
            hand,
            handDescription: hand.descr
        };
    });

    // Use pokersolver's built-in winner determination
    const hands = playerHands.map(p => p.hand);
    const winners = Hand.winners(hands);

    // Map back to player IDs
    const winnerResults: WinnerResult[] = [];
    for (const winningHand of winners) {
        const playerHand = playerHands.find(p => p.hand === winningHand);
        if (playerHand) {
            winnerResults.push({
                playerId: playerHand.playerId,
                handDescription: playerHand.handDescription
            });
        }
    }

    return winnerResults;
}

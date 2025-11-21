export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs

export function createDeck(): string[] {
    const deck: string[] = [];
    for (const s of SUITS) {
        for (const r of RANKS) {
            deck.push(r + s);
        }
    }
    return deck;
}

export function shuffleDeck(deck: string[]): string[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

export function dealCards(deck: string[], count: number): { dealt: string[], remaining: string[] } {
    if (deck.length < count) {
        throw new Error("Not enough cards in deck");
    }
    const dealt = deck.slice(0, count);
    const remaining = deck.slice(count);
    return { dealt, remaining };
}

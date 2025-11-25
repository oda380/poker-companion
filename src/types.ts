export type GameVariant = "texasHoldem" | "fiveCardStud";

export type PlayerStatus = "active" | "folded" | "allIn" | "sittingOut";

export interface Player {
    id: string;
    name: string;
    seat: number;
    stack: number;
    isSittingOut: boolean;
    status: PlayerStatus;
    wins: number;
}

export interface TableConfig {
    smallBlind?: number; // Hold'em
    bigBlind?: number;   // Hold'em
    ante?: number;       // Both
    bringIn?: number;    // Stud (optional)
}

export interface Pot {
    id: string;
    amount: number;
    eligiblePlayerIds: string[];
}

export interface PlayerCard {
    code: string;    // "As", "Td"
    faceUp: boolean; // true = visible, false = downcard
}

export interface PlayerHandState {
    playerId: string;
    cards: PlayerCard[]; // 2 for Hold'em (tracking), 5 for Stud
}

export type Street =
    | "preflop" | "flop" | "turn" | "river" // Hold'em
    | "street1" | "street2" | "street3" | "street4" | "street5" // Stud
    | "showdown";

export type ActionCategory = "betting" | "admin";

export type BettingActionType = "fold" | "check" | "call" | "bet" | "raise" | "allIn";

export interface Action {
    id: string;
    playerId: string;
    street: Street;
    category: ActionCategory;
    // For betting actions:
    bettingType?: BettingActionType;
    amount?: number;
    // For admin/deal actions (especially Stud):
    metadata?: {
        cardDealtTo?: string; // playerId
        cardCode?: string;
        isFaceUp?: boolean;
    };
    createdAt: string;
}

export interface HandState {
    id: string;
    handNumber: number;
    gameVariant: GameVariant;
    dealerSeat: number;
    currentStreet: Street;
    board: string[]; // used in Hold'em, empty in Stud
    playerHands: PlayerHandState[];
    pots: Pot[];
    currentBet: number;
    perPlayerCommitted: Record<string, number>;
    actions: Action[];
    activePlayerId?: string;
    finished: boolean;
    deck: string[];
    minRaise: number;
}

export interface HandSummary {
    id: string;
    handNumber: number;
    gameVariant: GameVariant;
    dealerSeat: number;
    winners: { playerId: string; potShare: number; handDescription: string }[];
    playerHands?: { playerId: string; cards: string[]; handDescription: string }[];
    totalPot: number;
    createdAt: string;
}

export interface TableState {
    id: string;
    name: string;
    gameVariant: GameVariant;
    config: TableConfig;
    players: Player[];
    currentHand?: HandState;
    handHistory: HandSummary[];
    createdAt: string;
    updatedAt: string;
}

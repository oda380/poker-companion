import {
  TableState,
  HandState,
  Player,
  GameVariant,
  Street,
  Action,
  PlayerHandState,
  Pot,
} from "../types";
import { calculatePots } from "./pot-calculator";
import { createDeck, shuffleDeck, dealCards } from "./deck";
import { GAME_VARIANTS } from "./constants";

const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Helpers ---

/**
 * True pot value to display / use for payouts.
 * If totalCommitted exists, it's the single source of truth.
 */
export const getTotalPotValue = (hand: HandState): number => {
  if (hand.totalCommitted) {
    return Object.values(hand.totalCommitted).reduce(
      (sum, amt) => sum + amt,
      0
    );
  }
  // legacy fallback (should be unused once totalCommitted is fully adopted)
  const potsTotal = hand.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const currentStreetTotal = Object.values(hand.perPlayerCommitted).reduce(
    (sum, amt) => sum + amt,
    0
  );
  return potsTotal + currentStreetTotal;
};

/**
 * Still "in the hand" means not sitting out and not folded.
 * Includes "allIn".
 */
const isPlayerInHand = (p: Player): boolean => {
  return !p.isSittingOut && p.status !== "folded" && p.status !== "sittingOut";
};

const getEligibleForPot = (players: Player[]): Player[] => {
  return players.filter((p) => isPlayerInHand(p));
};

function getNextStreet(
  currentStreet: Street,
  gameVariant: GameVariant
): Street {
  if (gameVariant === GAME_VARIANTS.TEXAS_HOLDEM.id) {
    switch (currentStreet) {
      case "preflop":
        return "flop";
      case "flop":
        return "turn";
      case "turn":
        return "river";
      case "river":
        return "showdown";
      default:
        return "showdown";
    }
  } else {
    switch (currentStreet) {
      case "street1":
        return "street2";
      case "street2":
        return "street3";
      case "street3":
        return "street4";
      case "street4":
        return "street5";
      case "street5":
        return "showdown";
      default:
        return "showdown";
    }
  }
}

// --- Main Logic ---

export function initializeHand(
  table: TableState,
  initialDealerSeat?: number
): { hand: HandState; updatedPlayers: Player[] } {
  const { players, config, gameVariant } = table;

  const activePlayers = players
    .filter((p) => p.stack >= 1 && !p.isSittingOut)
    .sort((a, b) => a.seat - b.seat);

  if (activePlayers.length < 2) {
    throw new Error("Not enough players to start a hand");
  }

  // Dealer seat
  let dealerSeat = -1;
  if (table.handHistory.length === 0) {
    dealerSeat =
      initialDealerSeat !== undefined
        ? initialDealerSeat
        : activePlayers[Math.floor(Math.random() * activePlayers.length)].seat;
  } else {
    const lastHand = table.handHistory[table.handHistory.length - 1];
    const lastDealerSeat = lastHand ? lastHand.dealerSeat : -1;

    if (lastDealerSeat === -1) {
      dealerSeat = activePlayers[0].seat;
    } else {
      dealerSeat =
        activePlayers.find((p) => p.seat > lastDealerSeat)?.seat ??
        activePlayers[0].seat;
    }
  }

  let deck = shuffleDeck(createDeck());

  const perPlayerCommitted: Record<string, number> = {};
  const totalCommitted: Record<string, number> = {}; // ✅ hand-wide commitments
  let currentBet = 0;

  let updatedPlayers: Player[] = players.map((p) => ({
    ...p,
    status: p.stack > 0 && !p.isSittingOut ? "active" : "sittingOut",
  }));

  // Ante (dead money)
  let startingPotAmount = 0;
  if (config.ante && config.ante > 0) {
    activePlayers.forEach((p) => {
      const amount = Math.min(p.stack, config.ante!);
      startingPotAmount += amount;
      totalCommitted[p.id] = (totalCommitted[p.id] || 0) + amount;

      updatedPlayers = updatedPlayers.map((player) => {
        if (player.id !== p.id) return player;
        const newStack = player.stack - amount;
        return {
          ...player,
          stack: newStack,
          status: newStack === 0 ? "allIn" : player.status,
        };
      });
    });
  }

  // Keep starter pot for legacy UI; showdown uses totalCommitted anyway.
  const pots: Pot[] =
    startingPotAmount > 0
      ? [
          {
            id: generateId(),
            amount: startingPotAmount,
            eligiblePlayerIds: activePlayers.map((p) => p.id),
          },
        ]
      : [];

  if (gameVariant === GAME_VARIANTS.FIVE_CARD_STUD.id) {
    currentBet = 0;
  }

  // Blinds (Hold'em only)
  if (
    gameVariant === GAME_VARIANTS.TEXAS_HOLDEM.id &&
    config.smallBlind &&
    config.bigBlind
  ) {
    const dealerIndex = activePlayers.findIndex((p) => p.seat === dealerSeat);
    const sbIndex =
      activePlayers.length === 2
        ? dealerIndex
        : (dealerIndex + 1) % activePlayers.length;
    const bbIndex = (sbIndex + 1) % activePlayers.length;

    const sbPlayer = activePlayers[sbIndex];
    const bbPlayer = activePlayers[bbIndex];

    // SB
    const sbUpdatedPlayer = updatedPlayers.find((p) => p.id === sbPlayer.id)!;
    const sbAmount = Math.min(sbUpdatedPlayer.stack, config.smallBlind);
    perPlayerCommitted[sbPlayer.id] =
      (perPlayerCommitted[sbPlayer.id] || 0) + sbAmount;
    totalCommitted[sbPlayer.id] = (totalCommitted[sbPlayer.id] || 0) + sbAmount;

    updatedPlayers = updatedPlayers.map((p) =>
      p.id === sbPlayer.id
        ? {
            ...p,
            stack: p.stack - sbAmount,
            status: p.stack - sbAmount === 0 ? "allIn" : p.status,
          }
        : p
    );

    // BB
    const bbUpdatedPlayer = updatedPlayers.find((p) => p.id === bbPlayer.id)!;
    const bbAmount = Math.min(bbUpdatedPlayer.stack, config.bigBlind);
    perPlayerCommitted[bbPlayer.id] =
      (perPlayerCommitted[bbPlayer.id] || 0) + bbAmount;
    totalCommitted[bbPlayer.id] = (totalCommitted[bbPlayer.id] || 0) + bbAmount;

    updatedPlayers = updatedPlayers.map((p) =>
      p.id === bbPlayer.id
        ? {
            ...p,
            stack: p.stack - bbAmount,
            status: p.stack - bbAmount === 0 ? "allIn" : p.status,
          }
        : p
    );

    currentBet = config.bigBlind;
  }

  // Deal
  let playerHands: PlayerHandState[] = [];
  const firstToAct = "WAITING_FOR_DEAL_CONFIRM";

  if (gameVariant === GAME_VARIANTS.FIVE_CARD_STUD.id) {
    playerHands = activePlayers.map((p) => ({
      playerId: p.id,
      cards: [{ code: "", faceUp: false }],
    }));
  } else {
    const cardsToDeal = 2;
    playerHands = activePlayers.map((p) => {
      const { dealt, remaining } = dealCards(deck, cardsToDeal);
      deck = remaining;
      return {
        playerId: p.id,
        cards: dealt.map((c) => ({ code: c, faceUp: false })),
      };
    });
  }

  const hand: HandState = {
    id: generateId(),
    handNumber: table.handHistory.length + 1,
    gameVariant,
    dealerSeat,
    currentStreet:
      gameVariant === GAME_VARIANTS.TEXAS_HOLDEM.id ? "preflop" : "street1",
    board: [],
    playerHands,
    pots,
    currentBet,
    perPlayerCommitted,
    totalCommitted, // ✅
    actions: [],
    activePlayerId: firstToAct,
    finished: false,
    deck,
    minRaise: config.bigBlind || 1,
  };

  return { hand, updatedPlayers };
}

export function processAction(
  table: TableState,
  actionType: Action["bettingType"],
  amountToTotal?: number
): TableState {
  if (!table.currentHand) return table;

  const hand = { ...table.currentHand };
  const { activePlayerId, perPlayerCommitted, currentBet } = hand;

  if (!activePlayerId) return table;

  const activePlayer = table.players.find((p) => p.id === activePlayerId);
  if (!activePlayer) return table;

  let newCurrentBet = currentBet;
  const committed = perPlayerCommitted[activePlayerId] || 0;
  let betAmount = 0;
  let newStatus = activePlayer.status;

  if (actionType === "fold") {
    newStatus = "folded";
  } else if (actionType === "check") {
    if (committed < currentBet) return table;
  } else if (actionType === "call") {
    betAmount = Math.min(currentBet - committed, activePlayer.stack);
    if (betAmount === activePlayer.stack) newStatus = "allIn";
  } else if (actionType === "bet" || actionType === "raise") {
    if (!amountToTotal) return table;

    // Must increase your own commitment
    if (amountToTotal <= committed) return table;

    // Never allow lowering the table bet
    if (amountToTotal <= currentBet) return table;

    betAmount = Math.min(amountToTotal - committed, activePlayer.stack);
    const targetTotal = committed + betAmount;
    newCurrentBet = Math.max(currentBet, targetTotal);

    if (betAmount === activePlayer.stack) newStatus = "allIn";
  } else if (actionType === "allIn") {
    betAmount = activePlayer.stack;
    newCurrentBet = Math.max(newCurrentBet, committed + betAmount);
    newStatus = "allIn";
  }

  const getEligibleForPot = (players: Player[]): Player[] => {
    return players.filter(isPlayerInHand);
  };

  const updatedPlayers = table.players.map((p) => {
    if (p.id !== activePlayerId) return p;
    return { ...p, stack: p.stack - betAmount, status: newStatus };
  });

  // Update committed amounts (both street and hand-wide)
  const newPerPlayerCommitted = {
    ...perPlayerCommitted,
    [activePlayerId]: committed + betAmount,
  };

  const baseTotalCommitted = hand.totalCommitted ?? {};
  const newTotalCommitted = {
    ...baseTotalCommitted,
    [activePlayerId]: (baseTotalCommitted[activePlayerId] || 0) + betAmount,
  };

  const newAction: Action = {
    id: generateId(),
    playerId: activePlayerId,
    street: hand.currentStreet,
    category: "betting",
    bettingType: actionType,
    amount: betAmount,
    createdAt: new Date().toISOString(),
  };

  // --- Fold win (single remaining) ---
  const playersInHand = updatedPlayers.filter((p) => isPlayerInHand(p));
  if (playersInHand.length <= 1) {
    const winner = playersInHand[0];
    if (winner) {
      // IMPORTANT: use UPDATED players for fold status
      const playersInThisHand = updatedPlayers.filter((p) =>
        hand.playerHands.some((ph) => ph.playerId === p.id)
      );

      const commitments = playersInThisHand.map((p) => ({
        playerId: p.id,
        amount: newTotalCommitted[p.id] || 0,
        isFolded: p.status === "folded",
      }));

      const { pots, refunds } = calculatePots(commitments);

      const shares: Record<string, number> = {};

      // Winner takes all pots where eligible (will usually be all of them in fold-win)
      for (const pot of pots) {
        if (pot.eligiblePlayerIds.includes(winner.id)) {
          shares[winner.id] = (shares[winner.id] || 0) + pot.amount;
        }
      }

      // Refunds (uncalled bet / all-in overbet / guardrails)
      for (const [playerId, refundAmount] of Object.entries(
        refunds as Record<string, number>
      )) {
        shares[playerId] = (shares[playerId] || 0) + refundAmount;
      }

      const sum = (obj: Record<string, number>) =>
        Object.values(obj).reduce((a, b) => a + b, 0);

      const committedTotal = sum(
        playersInThisHand.reduce<Record<string, number>>((acc, p) => {
          acc[p.id] = newTotalCommitted[p.id] || 0;
          return acc;
        }, {})
      );

      // ✅ Dev-only invariant
      if (process.env.NODE_ENV !== "production") {
        const sharesTotal = sum(shares);
        if (sharesTotal !== committedTotal) {
          console.warn("[FOLD-WIN SHARES INVARIANT FAIL]", {
            committedTotal,
            sharesTotal,
            diff: committedTotal - sharesTotal,
            shares,
          });
        }
      }

      return {
        ...table,
        players: updatedPlayers.map((p) => {
          const share = shares[p.id] || 0;
          return share > 0
            ? {
                ...p,
                stack: p.stack + share,
                wins: p.id === winner.id ? (p.wins || 0) + 1 : p.wins,
              }
            : p;
        }),
        currentHand: undefined,
        handHistory: [
          ...table.handHistory,
          {
            id: generateId(),
            handNumber: hand.handNumber,
            gameVariant: hand.gameVariant,
            dealerSeat: hand.dealerSeat,
            winners: [
              {
                playerId: winner.id,
                potShare: shares[winner.id] || 0, // ✅ do NOT use committedTotal
                handDescription: "Won by fold",
              },
            ],
            totalPot: committedTotal, // ✅ the true total money in the hand
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
  }

  // --- Next player selection ---
  const allPlayersSorted = updatedPlayers.sort((a, b) => a.seat - b.seat);

  const currentIndex = allPlayersSorted.findIndex(
    (p) => p.id === activePlayerId
  );

  let nextIndex = (currentIndex + 1) % allPlayersSorted.length;
  let nextPlayer = allPlayersSorted[nextIndex];
  let attempts = 0;

  // Find next player who is actually in the hand
  while (!isPlayerInHand(nextPlayer) && attempts < allPlayersSorted.length) {
    nextIndex = (nextIndex + 1) % allPlayersSorted.length;
    nextPlayer = allPlayersSorted[nextIndex];
    attempts++;
  }

  const activePlayersInRound = updatedPlayers.filter(
    (p) => !p.isSittingOut && p.status === "active"
  );

  const allCommitmentsEqual = activePlayersInRound.every(
    (p) => (newPerPlayerCommitted[p.id] || 0) === newCurrentBet
  );

  const actionsThisStreet = [...hand.actions, newAction].filter(
    (a) => a.street === hand.currentStreet
  );
  const actedPlayerIds = new Set(actionsThisStreet.map((a) => a.playerId));
  const allHaveActed = activePlayersInRound.every((p) =>
    actedPlayerIds.has(p.id)
  );

  let roundComplete =
    activePlayersInRound.length === 0 || (allCommitmentsEqual && allHaveActed);

  if (!roundComplete && attempts >= allPlayersSorted.length) {
    console.warn("Stuck in player loop - forcing round completion");
    roundComplete = true;
  }

  const newActivePlayerId = nextPlayer.id;

  // --- Street end / showdown transition ---
  if (roundComplete) {
    const nextStreet = getNextStreet(hand.currentStreet, hand.gameVariant);

    // Legacy pots tracking (fine to keep); showdown uses totalCommitted anyway
    const roundPot = Object.values(newPerPlayerCommitted).reduce(
      (sum, amt) => sum + amt,
      0
    );
    const eligiblePlayersForPot = getEligibleForPot(updatedPlayers);

    let newPots = [...hand.pots];
    if (newPots.length === 0) {
      newPots = [
        {
          id: generateId(),
          amount: roundPot,
          eligiblePlayerIds: eligiblePlayersForPot.map((p) => p.id),
        },
      ];
    } else {
      newPots[0] = { ...newPots[0], amount: newPots[0].amount + roundPot };
    }

    if (nextStreet === "showdown") {
      return {
        ...table,
        players: updatedPlayers,
        currentHand: {
          ...hand,
          currentStreet: "showdown",
          actions: [...hand.actions, newAction],
          pots: newPots,
          perPlayerCommitted: {}, // ✅ prevent double-counting / stale street money
          currentBet: 0,
          activePlayerId: "", // ✅ showdown trigger for UI
          totalCommitted: newTotalCommitted, // ✅ keep hand-wide commitments
        },
      };
    }

    const waitingState =
      hand.gameVariant === GAME_VARIANTS.TEXAS_HOLDEM.id
        ? "WAITING_FOR_CARDS"
        : "WAITING_FOR_STUD_CARD";

    return {
      ...table,
      players: updatedPlayers,
      currentHand: {
        ...hand,
        currentStreet: nextStreet,
        actions: [...hand.actions, newAction],
        perPlayerCommitted: {}, // ✅ new street
        pots: newPots,
        currentBet: 0,
        activePlayerId: waitingState,
        totalCommitted: newTotalCommitted, // ✅ carry forward
      },
    };
  }

  // --- Normal continuation (same street) ---
  return {
    ...table,
    players: updatedPlayers,
    currentHand: {
      ...hand,
      currentBet: newCurrentBet,
      perPlayerCommitted: newPerPlayerCommitted,
      actions: [...hand.actions, newAction],
      activePlayerId: newActivePlayerId,
      totalCommitted: newTotalCommitted, // ✅ carry forward
    },
  };
}

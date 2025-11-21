Poker Companion – Project Overview (Web App MVP v1.3)
1. High-Level Summary
Poker Companion is a browser-based assistant for live poker games, starting with:
Texas Hold’em


5-Card Stud


The app runs on one device at the table (dealer’s phone / tablet / laptop) and helps:
Set up a table (game type, players, blinds/antes, stacks)


Track actions, pots, and side pots during hands


Handle positions (dealer/SB/BB or ante/bring-in) and streets


Record showdown hands and determine the winner


Provide clear, beginner-friendly visibility into the game state


Initial scope: single-table, single-device, local-only MVP (no accounts, no backend).
 Core principle: minimize dealer friction and keep up with real-world pace for both Hold’em and Stud.

2. Primary Goals
Dealer Assistant with Minimal Friction


Common actions recordable in 1–2 taps.


Robust Undo so mis-taps are harmless.


Avoid layout shifts and keyboard popups during play.


Game State Clarity


Instantly answer:


Who is the dealer / SB / BB (Hold’em) or who posted ante/bring-in (Stud)?


Whose action is it?


What are the current pot and side pots?


Who is active, folded, or all-in?


In Stud, who has which face-up vs face-down cards?


Accurate Showdown & Pot Resolution


Support both Texas Hold’em and 5-Card Stud:


Correct hand evaluation (using library)


Correct pot/side-pot distribution


Clear winner display with hand descriptions.


Beginner-Friendliness (Later Phases)


Optional helper mode:


Show hand types (“Top Pair”, “Flush Draw”).


Simple, human-readable suggestions.



3. Non-Goals (MVP)
No real-money play, gambling, or online matchmaking.


No multi-table tournament support.


No multi-device real-time sync in v1.


No authentication (email, OAuth, wallets).


No GTO solver or full AI.


No camera-based card recognition in v1.



4. Target Users & Usage Model
Target Users
Home game hosts / office game organizers.


“Table captains” managing casual poker nights.


People who know the rules, but want help with:


Pot/side-pot math


Order of action


Tracking showdowns and history


Usage Model
One device acts as Dealer Assistant at a physical table.


Game uses real cards and chips; app mirrors the real state.


All game data is stored locally in the browser; each device is isolated.



5. Core Features – MVP Scope
5.1 Game & Table Setup
Create a Table with:
Table name


Game variant:


Texas Hold’em


5-Card Stud


Betting structure:


Hold’em:


Small Blind


Big Blind


Optional Ante


Stud:


Ante


Optional Bring-in (or simplified: ante + normal betting for MVP)


Default starting stack size


Register Players:
Name


Seat number


Starting stack


Status flags: “sitting out” etc.


The variant selects the dealing flow, streets, and layout.

5.2 Fast In-Game Input (Anti–Dealer Fatigue)
The app must keep up with live pace. UX is optimized around fast, thumb-friendly controls.
A. Quick Action Buttons
For the current active player:
Large primary buttons:


Fold


Check


Call


Bet


Raise


All-in


Bet sizing:
One-tap presets:


Min-Raise


1/2 Pot


3/4 Pot


Pot


All-in


Custom amount:


Entered via custom numeric keypad (see below), not the native keyboard.


B. Card Keyboard (Cards, not Dropdowns)
A custom Card Keyboard is used for card input:
Implemented as a bottom Sheet/Drawer (shadcn Sheet or Drawer).


Layout:


Left column: ranks 2 3 4 5 6 7 8 9 T J Q K A


Right column: suits ♠ ♥ ♦ ♣


Flow:


Tap rank → tap suit → card code is registered (As, Td, etc.).


Used for:


Hold’em:


Board cards (Flop/Turn/River)


Hole cards at showdown (if not tracked per deal)


Stud:


Cards dealt to each player street by street


Mark face-up vs face-down per card


Face-down distinction (Stud):
Down cards are visually:


Darkened or backed-out (standard “card back” style).


Clearly different from up cards, so dealer knows which are private.


Cards display (Stud):
Per player row:


Cards are slightly overlapped (Solitaire-style stack) to save space.


Enough of each card is visible to read its rank/suit.


With up to 8 players, this avoids trying to show 40 large cards.


C. Custom Numeric Keypad
To avoid mobile keyboard chaos:
Bet/raise amounts use an in-app numeric keypad in the same bottom drawer.


Layout:


Digits 0–9


Clear / Backspace


“OK” / “Apply” button


Benefits:


No native keyboard popping up.


No layout shifts.


Keep pot and action buttons always visible.


D. Active Player Highlight
Active player is visually obvious:


Strong glowing ring / border around that player’s row.


Optional subtle pulse animation via Framer Motion.


Dealer / SB / BB / Bring-in indicated with small badges/icons.



5.3 Hand & Action Management (with Undo)
Variant-Aware Street Flow
Texas Hold’em:
Streets:


Preflop → Flop → Turn → River → Showdown


Board is global for all players.


Betting order is seat-based, starting near the button / blinds depending on street.


5-Card Stud:
No community board.


Players receive:


Starting: 1 down + 1 up (configurable if desired)


Followed by up cards on subsequent streets (total 5 cards).


Streets: conceptually:


Street1, Street2, Street3, Street4, Street5 (or traditional “third street” etc. later).


Dealing per street:


On each new card street, cards are dealt only to active (non-folded, non-all-in) players.


Folded players do not receive future cards.


Betting order in MVP:


Initially seat-based for simplicity.


Future enhancement: start from player with best visible hand (Stud standard).


Status Tracking
Per player:
status:


active


folded


allIn


Per street:


Amount committed to the pot(s).


Whether they are eligible for future pots.


Undo / Correction (Using zundo)
Undo is critical for trust. Implementation uses zundo (temporal middleware for Zustand):
Store created with:

 import { create } from "zustand";
import { temporal } from "zundo";

const usePokerStore = create(
  temporal(
    (set, get) => ({
      // ... core game state + actions
    }),
    {
      limit: 50, // keep last 50 states
      partialize: (state) => {
        // Exclude transient UI-only fields from history (e.g. modals)
        const { ui, ...logicState } = state;
        return logicState;
      },
    }
  )
);


UI “Undo” button calls:

 usePokerStore.temporal.getState().undo();


This reverts:


The last betting action, card deal, or manual correction.


UI state (open dialogs, current drawer) is not rolled back, to keep UX stable.



5.4 Pots, Side Pots & Showdown Resolution
Side Pot Algorithm (Core Logic)
Side pots are required whenever players are all-in for different amounts.
High-level algorithm (per hand):
Gather each non-folded player’s total committed amount.


Extract unique contribution levels, sorted ascending.


Example contributions: Alice 100, Bob 200, Charlie 200 → levels: [100, 200].


For each level, build pots:


Main pot:


Cap at the smallest level (e.g. 100).


For each non-folded player:


Contribute min(committed, level) minus any amount already allocated to previous pots.


Eligible players: everyone who committed at least that level.


Side pot(s):


For each next level L:


Cap at (L - previousLevel) extra per contributing player.


Only players who committed more than previousLevel participate.


Eligible players: those players only.


Any excess beyond the highest relevant level for a player (e.g. overbet that no one can call) is returned/refunded immediately before showdown.


This algorithm is shared between Hold’em and Stud.
Showdown Logic (Variant-Aware)
Texas Hold’em:
At showdown:


Board: exactly 5 community cards.


Per player: 2 hole cards.


For each eligible player:


Evaluate best 5-card hand from 7 cards (2 + 5).


For each pot (main + side pots):


Find highest-valued hand among eligible players.


Handle ties (split that pot evenly or per chip rules).


Distribute pot amounts to winners.


5-Card Stud:
At showdown:


Each remaining player has exactly 5 cards (combination of face-up and down).


For each eligible player:


Evaluate best 5-card hand from those 5 cards.


For each pot (main + side pots):


Same winner selection / split logic as above.


Implementation Note:
 Use an existing poker evaluator library (e.g. poker-evaluator-ts, pokersolver, etc.) to avoid custom ranking logic and kicker bugs. The app just passes card sets (e.g. ["As","Kd","7c","..." ]) and compares the resulting scores.
After confirmation:
Pots distributed.


Stacks updated.


Hand summary appended to Hand History.


New hand initialized with advanced dealer/button (Hold’em) or next dealer logic (Stud).



5.5 Hand History (Near-MVP)
Per-table Hand History view:
Each entry:


Hand number


Game variant


Winners: player(s) + pot share


Final total pot size


A short, human-readable description (e.g. “Alice won main pot with Flush vs Bob’s Trips”)


Accessible from:
A tab or button on the Table screen (e.g. Tabs or a Sheet on the side).


Use cases:
Resolve disputes (“Did I really fold the best hand?”).


Reinforce perceived value of the app for the whole table.



5.6 Local Persistence
All data is local-only in MVP:
Zustand + persist for localStorage.


State includes a version number:


Future schema changes can migrate old state cleanly.


Each device:


Has its own tables, hands, and history.


Is unaffected by other users.



6. Tech Stack (MVP)
Frontend-only web app.
Framework: Next.js (App Router) + TypeScript


Styling: Tailwind CSS with custom poker theme


Dark “felt” background


High-contrast player highlights and action buttons


Components: shadcn/ui


Buttons, Inputs, Dialogs, Sheets, Tabs, Sliders, Tooltips


Custom Card Keyboard and Numpad built using these primitives


Animations: Framer Motion


Page transitions (Home ↔ Table)


Active player highlight pulse


Card appearance and pot “bump” on updates


State Management:


Zustand + persist


zundo (temporal) for Undo/Redo history (limited, logic-only)


Poker Logic:


Third-party hand evaluation library


Custom state machine for:


Hold’em streets & betting


Stud street-by-street dealing (active players only)


Pot & side-pot construction


Hosting: Vercel


Simple deployment and preview URLs



7. Data & State Model (Refined)
Key conceptual TS types (simplified):
export type GameVariant = "texasHoldem" | "fiveCardStud";

export type PlayerStatus = "active" | "folded" | "allIn";

export interface Player {
  id: string;
  name: string;
  seat: number;
  stack: number;
  isSittingOut: boolean;
  status: PlayerStatus;
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
}

export interface HandSummary {
  id: string;
  handNumber: number;
  gameVariant: GameVariant;
  winners: { playerId: string; potShare: number; handDescription: string }[];
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

Undo/Redo is applied over logical state (TableState + top-level game state), excluding UI-only fields (open modals, etc.) via partialize.

8. Future Roadmap (Post-MVP)
After MVP stabilization:
Beginner Helper Mode


Current hand labels and basic advice.


Richer History & Stats


Detailed replays.


Per-player stats (hands played, VPIP-like metrics).


Improved Stud Betting Order


Determine betting order based on best visible hand.


Camera-Based Experiments


Optional: card recognition at showdown.


Multi-Device Mode


Host/join via code.


Cloud Sync & Accounts


Cross-device history, premium features.

# Tournament Feature - Implementation Plan (Final)

## Tournament Mode Invariants

> **These rules must hold at all times in tournament mode:**
>
> 1. All **seated players** (present in `table.players` AND in `tournament.entrants`) MUST have `lifecycleStatus` set ("in" or "out")
> 2. All players with `lifecycleStatus === "in"` are dealt in and post blinds/antes
> 3. Eliminations only occur in `finalizeHand()` after payouts
> 4. Blinds only advance at hand boundaries, never mid-hand
> 5. Sitting out is **disallowed** in tournament mode (v1 decision)
> 6. Placements are assigned from **last place upward** as busts occur; winner assigned at end
> 7. **Post-finalizeHand invariant**: All `lifecycleStatus="in"` players have `stack > 0` and `status="active"`

---

## Overview

Add tournament mode to track multi-hand competition with player elimination, blind progression, and winner determination.

> **Critical Design Principles** (from review):
>
> - Eliminate players only at **end-of-hand** after payouts, not during action
> - Advance blinds only at **hand boundaries**, never mid-hand
> - Separate `lifecycleStatus` (in/out) from `status` (active/folded/allIn)
> - Tournament manager handles structure; game-logic handles hand flow
> - `lifecycleStatus` is **required** in tournament mode (initialize all entrants to "in")
> - Placement tie-breaks use `handStartStacks` + deterministic rules

---

## Foundation Patches (Implement These First)

These 4 changes unlock everything cleanly:

### 1. Types

- Add `"paused"` to `TournamentStatus`
- Make `lifecycleStatus` required at runtime in tournament mode (initialize everyone to `"in"`)

### 2. Hand Snapshot for Determinism

- Add `handStartStacks: Record<playerId, number>` to `HandState`
- Set in `initializeHand()` before any action
- Used for placement tie-breaks when multiple players bust same hand

### 3. Single Exit Point

- Create `finalizeHand(table, payouts)` as the **only** place that:
  - Applies payouts to stacks
  - Marks `lifecycleStatus="out"` for `stack===0` after payouts
  - Records placements (using `handStartStacks` + tie-break rules)
  - Advances blinds if `nextBlindAt` expired (hand boundary only)

### 4. Timer Simplification

- Keep `nextBlindAt` timestamp; UI just counts down from it
- No timer class yet (can add later if needed)
- Remaining = `max(0, Date.parse(nextBlindAt) - now)`
- Expired = `now >= nextBlindAt`

---

## Data Model Extensions

### New Types (`src/types.ts`)

```typescript
type TournamentStatus = "setup" | "lobby" | "running" | "paused" | "finished";
type LifecycleStatus = "in" | "out"; // Required in tournament mode

type BlindLevel = {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  duration?: number; // minutes (for auto-progression)
};

type PrizePosition = {
  position: number; // 1st, 2nd, 3rd, etc.
  percentage: number; // % of total prize pool
};

type Placement = {
  playerId: string;
  place: number; // 1st, 2nd, etc.
  bustedAtHand: number;
  chipCountAtHandStart: number; // For tie-breaks (not chipCountAtBust - that's always 0!)
  seatAtBust: number; // Final tie-break
  prize?: number;
};

type TournamentEntrant = {
  playerId: string;
  nameAtStart: string;
  seatAtStart: number;
};

interface TournamentState {
  id: string;
  name: string;
  status: TournamentStatus;

  // Structure
  blindLevels: BlindLevel[];
  blindLevelIndex: number; // current level
  prizeStructure: PrizePosition[];

  // Participants
  startingChips: number;
  buyIn: number;
  entrants: TournamentEntrant[]; // Snapshot at registration
  rebuyCount: number; // Simple counter for v1; can upgrade to Array<{ playerId; atHand; amount }>
  placements: Placement[]; // Final standings (filled as players bust)

  // Prize pool (derived, not stored)
  prizePoolOverride?: number; // Manual override if set
  // Use getEffectivePrizePool() to compute: prizePoolOverride ?? (buyIn * entrants.length + rebuyCount * buyIn)

  // Hand tracking
  handIds: string[]; // Tournament hand IDs (updated in finalizeHand)

  // Timing
  startedAt?: string;
  nextBlindAt?: string; // when timer expires (only advance at hand boundary!)

  // History (for determinism)
  blindLevelHistory: Array<{
    timestamp: string;
    levelIndex: number;
  }>;

  // Settings
  allowRebuys: boolean;
  rebuyEndLevel?: number;
}
```

### Extend Player Type

> **Critical**: `lifecycleStatus` is **required** in tournament mode

```typescript
interface Player {
  // ... existing fields
  lifecycleStatus?: LifecycleStatus; // Cash: undefined; Tournament: "in" | "out"
  // status remains for in-hand state: "active" | "folded" | "allIn" | "sittingOut"
}
```

**Runtime invariant**: If `TableState.mode === "tournament"`, all seated players MUST have `lifecycleStatus` set.

### Extend HandState

````typescript
interface HandState {
  // ... existing fields
  handStartStacks?: Record<string, number>; // Snapshot for placement tie-breaks (tournament only)
}

### Extend TableState

```typescript
interface TableState {
  // ... existing fields
  mode: "cash" | "tournament";
  tournament?: TournamentState;
}
````

---

## Core Logic Changes

### 1. Tournament Management (`src/lib/tournament-logic.ts`)

> **Responsibility**: Tournament structure and lifecycle only

**Functions to implement:**

- `initializeTournament(config)` → Create tournament state
- `startTournament(table)` → Set status to "running", record start time
- `advanceBlindLevel(table)` → Move to next level (only called at hand boundary!)
- `processHandComplete(table, context)` → **All-in-one handler**:
  - Takes: `{ bustedPlayerIds, handNumber, handStartStacks, seats }`
  - Records placements for busted players
  - Checks if tournament ended (≤1 player with lifecycleStatus="in")
  - Advances blinds if `nextBlindAt` expired
  - Returns: `{ tournamentEnded: boolean, advancedBlind: boolean }`
- `calculatePrizes(table)` → Distribute prize pool by final placements
- `getEffectivePrizePool(table)` → Derive prize pool from buyIn/entrants/rebuys

### 2. Game Logic Integration

> **Responsibility**: Hand flow only; tournament logic stays out

**Modify `src/lib/game-logic.ts`:**

- `initializeHand()`:

  - **Filter dealt players** (performance-optimized):
    ```typescript
    const entrantIds = new Set(tournament.entrants.map((e) => e.playerId));
    const dealt = table.players.filter(
      (p) => entrantIds.has(p.id) && p.lifecycleStatus === "in"
    );
    ```
  - This ensures only registered entrants who are "in" get dealt cards
  - **In tournament mode**: Ignore `isSittingOut` entirely (sitting out disallowed)
  - Snapshot stacks: `hand.handStartStacks = { [playerId]: stack }` for all dealt players
  - Use `table.tournament.blindLevels[blindLevelIndex]` for blinds if tournament mode
  - **Heads-up blind posting**: Use same HU rule as cash (dealer is SB)
  - **Do NOT eliminate during hand** — players can be all-in with stack=0

- `processAction()`:
  - **No changes needed** — allow stack=0 players to remain "allIn" until showdown
  - Continue to return updated `TableState` as usual
- **New**: `finalizeHand(table, context)` → Called after showdown/fold-win:
  ```typescript
  function finalizeHand(
    table: TableState,
    context: {
      shares: Record<playerId, amount>;
      handId: string;
      handNumber: number;
    }
  ): TableState {
    // 1. Apply payouts to stacks
    // 2. Reset per-hand state for next hand:
    //    - Set currentHand = undefined (moves to handHistory)
    //    - For lifecycleStatus="in" players with stack > 0: status="active"
    //    - Clear: perPlayerCommitted, currentBet, activePlayerId
    // 3. If tournament mode:
    //    - Identify busted players: stack===0 AND lifecycleStatus==="in"
    //    - Mark busted players: lifecycleStatus="out", status="sittingOut" (or keep "allIn")
    //    - Call tournament-logic.processHandComplete({ bustedPlayerIds, handNumber, handStartStacks, seats })
    //    - If tournamentEnded, set status="finished", compute prizes
    //    - Append handId to tournament.handIds
    // 4. Post-condition: All lifecycleStatus="in" players have stack > 0 and status="active"
    // 5. Return updated table
  }
  ```

**Tie-break rules for placements** (enforced in `processHandComplete`):

1. If multiple players bust same hand:
   - **Lower** `chipCountAtHandStart` → **worse** place (higher place number)
   - If equal chips, **higher** `seatAtBust` → **worse** place (higher place number)
2. Example: P3 (50 chips, seat 3) and P5 (50 chips, seat 5) both bust on hand #42:
   - Equal chips, so use seat: seat 5 > seat 3 → P5 gets worse place
   - P3 = place 8, P5 = place 9 (if 9 players total and both busted first)

**Placement numbering**:

- Placements are assigned from **last place upward** as busts occur
- First bust = place N (where N = total entrants)
- Last bust = place 2
- Remaining winner = place 1 (assigned when tournament ends)

### 4. Dev-Only Invariant Assertions

> **Run at end of `initializeHand()` and `finalizeHand()` in tournament mode**

```typescript
function assertTournamentInvariants(table: TableState): void {
  if (process.env.NODE_ENV === "production") return;
  if (table.mode !== "tournament" || !table.tournament) return;

  const entrantIds = new Set(table.tournament.entrants.map((e) => e.playerId));

  // Ensure no duplicate entrants
  if (table.tournament.entrants.length !== entrantIds.size) {
    throw new Error(`Invariant: duplicate entrants detected`);
  }

  const playersById = new Map(table.players.map((p) => [p.id, p] as const));

  for (const p of table.players) {
    if (!entrantIds.has(p.id)) continue; // ignore non-entrants

    if (p.lifecycleStatus !== "in" && p.lifecycleStatus !== "out") {
      throw new Error(`Invariant: entrant missing lifecycleStatus: ${p.id}`);
    }

    if (p.lifecycleStatus === "in") {
      if (p.stack <= 0) {
        throw new Error(`Invariant: "in" player with stack<=0: ${p.id}`);
      }
      if (p.status !== "active") {
        throw new Error(
          `Invariant: "in" player with status!="active": ${p.id} (${p.status})`
        );
      }
      if (p.isSittingOut) {
        throw new Error(
          `Invariant: sitting out disallowed in tournament: ${p.id}`
        );
      }
    }

    if (p.lifecycleStatus === "out") {
      if (p.stack !== 0) {
        throw new Error(
          `Invariant: "out" player has nonzero stack: ${p.id} (${p.stack})`
        );
      }
      if (p.status !== "sittingOut" && p.status !== "folded") {
        throw new Error(
          `Invariant: "out" player has wrong status: ${p.id} (${p.status})`
        );
      }
    }
  }

  // Assert current hand only includes "in" entrants
  const hand = table.currentHand;
  if (hand) {
    // Ensure handStartStacks snapshot exists
    if (!hand.handStartStacks) {
      throw new Error(`Invariant: missing handStartStacks for hand ${hand.id}`);
    }

    for (const ph of hand.playerHands) {
      if (!entrantIds.has(ph.playerId)) {
        throw new Error(`Invariant: non-entrant dealt in: ${ph.playerId}`);
      }
      const player = playersById.get(ph.playerId);
      if (!player || player.lifecycleStatus !== "in") {
        throw new Error(`Invariant: non-in player dealt in: ${ph.playerId}`);
      }
    }
  }
}
```

**Benefits**:

- Catches UI path bugs that violate invariants
- Zero production overhead (stripped in prod builds)
- Saves hours debugging subtle state corruption
- Acts as executable documentation of invariants

### 3. Blind Timer (Timestamp-Driven)

> **No class needed yet** — keep it simple

**Implementation**:

- Store `nextBlindAt: string` (ISO timestamp) in `TournamentState`
- UI derives remaining time: `max(0, Date.parse(nextBlindAt) - Date.now())`
- Expired check: `Date.now() >= Date.parse(nextBlindAt)`
- When expired, `finalizeHand()` advances blinds at hand boundary

**UI countdown**:

```typescript
function useBlindCountdown(nextBlindAt?: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!nextBlindAt) return;
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Date.parse(nextBlindAt) - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextBlindAt]);

  return remaining; // ms
}
```

_Can add a `BlindTimer` class later if needed for pause/resume complexity._

---

## UI Components

### `/app/tournament/setup`

**Tournament Setup Screen:**

- Name input
- Starting chips slider
- Blind structure editor (levels table)
- Prize structure editor
- Optional: rebuy settings, duration per level

### `/app/tournament/lobby`

**Pre-Tournament Lobby:**

- Show registered players
- Add/remove players
- "Start Tournament" button

### Tournament HUD (during play)

**Add to `/app/table/page.tsx`:**

- Current blind level indicator (SB/BB/Ante)
- Blind timer (if enabled)
- Players remaining count
- Prize pool total

### Standings Dialog

**New component: `TournamentStandings.tsx`**

- Live rankings (ordered by chip count)
- Eliminated players list
- Prize breakdown preview

### Winner Dialog

**New component: `TournamentWinnerDialog.tsx`**

- Final standings (1st, 2nd, 3rd, etc.)
- Prize distribution
- Confetti animation 🎉

---

## Database Schema

### Extend Dexie DB (`src/lib/db.ts`)

```typescript
tournaments: {
  id: string;
  name: string;
  createdAt: string;
  finishedAt?: string;
  standings: { playerId: string; position: number; prize: number }[];
  handIds: string[]; // Use same name as state (not handHistory)
  finalPrizePool: number; // Computed pool stored when tournament finishes
}
```

---

## Store Integration

### Extend Zustand Store (`src/store/usePokerStore.ts`)

**New actions:**

- `createTournament(config)` → Initialize tournament
- `startTournament()` → Begin play
- `advanceBlindLevel()` → Progress blinds
- `endTournament()` → Finalize results, save to DB

**New selectors:**

- `getTournamentStandings()` → Live chip rankings
- `getEliminatedPlayers()` → List of busted players
- `getCurrentBlinds()` → Active blind level

---

## Implementation Strategy

> **Recommended order** (smallest risk first, correctness-critical early):

### Phase 1: State Plumbing

1. Add `mode`, `lifecycleStatus`, `TournamentState` types
2. Extend DB schema for tournament persistence
3. Basic store actions: `createTournament()`, `setMode()`

### Phase 2: Elimination Bookkeeping ⚠️ **CRITICAL**

1. Modify `initializeHand()` to skip `lifecycleStatus === "out"` players
2. Implement `finalizeHand()` to mark stack=0 players as eliminated **after** payouts
3. Add `tournament-logic.recordElimination()` to track placements
4. Write tests for simultaneous eliminations (use chip count at hand start)

### Phase 3: Blind Structure (Manual)

1. Implement `tournament-logic.advanceBlindLevel()`
2. Hook into `finalizeHand()` to check if blind timer expired → advance at hand boundary
3. Add manual "Next Level" button in UI
4. Use tournament blinds in `initializeHand()`

### Phase 4: UI (HUD + Standings)

1. Tournament badge in-game (show current blinds)
2. "Next blind in..." countdown (if timer enabled)
3. Standings dialog (chip rankings, eliminated list) — **read-only, derived**
4. Setup screen + lobby

### Phase 5: Auto Timer

1. Implement `BlindTimer` class (start/pause/resume)
2. Timer expires → set `nextBlindAt` but advance **only at hand boundary**
3. Persist timer state for pause/resume

### Phase 6: Prize Distribution & Winner Screen

1. Implement `calculatePrizes()` based on placements
2. Winner announcement dialog (final standings + payouts)
3. Export tournament history (CSV/JSON)
4. Confetti 🎉

---

## Edge Cases to Handle

### Elimination Timing ⚠️

- Player goes all-in with last chips → still in hand until showdown
- **Rule**: Only mark `lifecycleStatus = "out"` in `finalizeHand()` after payouts, if `stack === 0`
- Multiple players bust same hand → tie-break:
  1. Fewer chips at `handStartStacks` = worse place
  2. If equal, seat order (lower seat = better place)

### Blind Progression ⚠️

- Timer expires mid-hand → **do NOT change blinds immediately**
- Store `nextBlindAt` and check in `finalizeHand()` → advance if expired
- Manual override: allow immediate advance (but still only at hand boundary)

### Tournament End

- Detect when only 1 player remains with `lifecycleStatus === "in"`
- Final heads-up hand: if one player busts, assign placements (1st/2nd)
- Edge: Tournament ends during all-in showdown → resolve pot first in `finalizeHand()`

### Pause/Resume

- Persist `tournament` state to DB after each hand
- Blind timer: `nextBlindAt` is a timestamp, recalculate remaining on resume
- Allow manual pause (set `status = "paused"`, ignore timer until resumed)
- **Pausing mid-hand**: Paused only affects blind timer advancement; current hand continues to completion

### Sitting Out in Tournament Mode ⚠️ **DECIDED**

- **V1 Policy**: Sitting out is **disallowed** in tournament mode
  - UI: Hide/disable "Sit Out" button when `mode === "tournament"`
  - Engine: In `initializeHand()`, if `mode === "tournament"`, ignore `isSittingOut` filter
  - All players with `lifecycleStatus === "in"` are dealt in and post blinds/antes
  - Prevents exploitation (sitting out to dodge blinds)
- **Future V2**: Could allow visual "sitting out" but still force blind/ante posting ("chip off")

### Heads-Up Blind Posting ⚠️ **Gotcha**

- In heads-up, dealer is small blind (same as cash game)
- `initializeHand()` already handles this for cash mode
- **Ensure**: Tournament mode uses same HU logic but with tournament blind levels

### "Inactive but Not Out" Players ⚠️ **Gotcha**

- In tournament mode, `lifecycleStatus === "in"` always means "dealt in"
- No concept of "in the tournament but not dealt" (v1 simplification)
- Disconnected/away players still get dealt and blinded off

### Future: Rebuys

- If enabled, allow eliminated players to re-enter before `rebuyEndLevel`
- Reset `lifecycleStatus = "in"`, add starting chips
- Track rebuys separately for history/prize pool calculation
- Add rebuy to `TournamentEntrant` snapshot

---

## Testing Checklist

- [ ] Single-table tournament (9 players → 1 winner)
- [ ] Blind progression (manual and auto)
- [ ] Player elimination tracking
- [ ] Prize distribution calculation
- [ ] Persistence (pause and resume tournament)
- [ ] Edge case: All-in multi-way on final hand

---

## UI/UX Considerations

- **Mode toggle**: Let users choose "Cash Game" vs "Tournament" on setup
- **Visual distinction**: Tournament mode should have distinct UI (e.g., gold accents)
- **Notifications**: Alert when blinds are about to increase
- **Accessibility**: Blind timer should be prominent but not distracting

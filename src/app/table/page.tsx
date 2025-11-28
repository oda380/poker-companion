"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePokerStore } from "@/store/usePokerStore";
import { Button } from "@/components/ui/button";
import { PlayerRow } from "@/components/game/PlayerRow";
import { Card } from "@/components/game/Card";
import { Controls } from "@/components/game/Controls";
import { ShowdownDialog } from "@/components/game/ShowdownDialog";
import { DealerSelectionDialog } from "@/components/game/DealerSelectionDialog";
import { CommunityCardDialog } from "@/components/game/CommunityCardDialog";
import { StudCardDialog } from "@/components/game/StudCardDialog";
import { InitialDealDialog } from "@/components/game/InitialDealDialog";
import { ChipAnimation } from "@/components/game/ChipAnimation";

import { NavBar } from "@/components/nav-bar";
import { cn, getStreetColor, getStreetLabel } from "@/lib/utils";
import { useAutoSaveGame } from "@/hooks/use-auto-save";
import { HelpBanner } from "@/components/HelpBanner";

export default function TablePage() {
  // Auto-save game state
  useAutoSaveGame();

  const router = useRouter();
  const tableId = usePokerStore((state) => state.id); // Keep this as it's used in the main div key
  const players = usePokerStore((state) => state.players);
  const currentHand = usePokerStore((state) => state.currentHand);
  const handHistory = usePokerStore((state) => state.handHistory); // Keep this as it's used for "Deal Hand" button
  const startNewHand = usePokerStore((state) => state.startNewHand);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if store is already hydrated
    if (usePokerStore.persist.hasHydrated()) {
      setTimeout(() => setIsHydrated(true), 0);
    } else {
      // If not, wait for hydration
      const unsubscribe = usePokerStore.persist.onFinishHydration(() => {
        setIsHydrated(true);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    // Only redirect if hydrated and no players
    if (isHydrated && players.length === 0) {
      router.push("/setup");
      return;
    }

    if (!isHydrated) return; // Don't do anything else until hydrated

    // Detect if running in Chrome on iOS
    const isChrome = /CriOS/.test(navigator.userAgent);

    // Reset scroll position of main content area
    // This fixes touch offset issues in Stud where the scrollable main element
    // can have cached scroll position causing touch layer desync on iOS
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTop = 0;
    }

    // For Chrome on iOS, we need more aggressive viewport resets
    if (isChrome) {
      // Force window scroll reset
      window.scrollTo(0, 0);

      // Force a layout recalculation
      setTimeout(() => {
        void document.body.offsetHeight;
        window.dispatchEvent(new Event("resize"));
      }, 50);
    }

    // Cleanup on unmount
    return () => {
      // Close any open modals in the store to prevent them from trying to restore focus/locks
      usePokerStore.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          isSettingsOpen: false,
          isHandHistoryOpen: false,
          activeModal: null,
        },
      }));

      // Force body cleanup
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-scroll-locked");
    };
  }, [players, router, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (players.length === 0) return null;

  const isDealerSelectionOpen =
    handHistory.length === 0 && !currentHand && players.length > 0;

  return (
    <div
      key={tableId}
      className="h-[100dvh] overflow-hidden bg-background flex flex-col"
    >
      <NavBar />

      {/* Game Area */}
      <main className="flex-1 overflow-y-auto pb-32 pt-16 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {/* Help Banner - Player Modification */}
        <div className="px-4 pt-4 pb-4">
          <HelpBanner
            messageId="player-modification-timing"
            condition={!currentHand || currentHand.finished}
          />
        </div>

        {/* Pot Display */}
        {/* Lower z-index when dealer selection is open to prevent rendering artifacts on mobile */}
        <div
          className={cn(
            "p-10 text-center sticky top-0",
            isDealerSelectionOpen ? "z-0" : "z-40"
          )}
        >
          <div id="pot-display" className="relative inline-block group">
            {/* Enhanced glow effect - stronger and more visible */}
            <div className="absolute inset-0 bg-gradient-radial from-amber-500/40 dark:from-amber-500/30 to-transparent blur-3xl group-hover:from-amber-500/60 dark:group-hover:from-amber-500/40 transition-all duration-500" />

            {/* Card background with border */}
            <div className="relative bg-gradient-to-br from-amber-50/90 via-white/80 to-amber-50/90 dark:from-slate-900/80 dark:via-slate-800/70 dark:to-slate-900/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/30 dark:border-amber-500/20 shadow-2xl shadow-amber-500/20 dark:shadow-amber-500/10 px-12 py-8">
              <div className="text-xs text-amber-600 dark:text-amber-500/80 uppercase tracking-[0.2em] font-bold mb-3">
                Total Pot
              </div>
              {/* We use a grid to perfectly center the number */}
              <div className="grid grid-cols-[auto] items-start justify-center text-6xl font-black bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 dark:from-amber-300 dark:via-amber-500 dark:to-amber-700 bg-clip-text text-transparent drop-shadow-2xl filter">
                <div>
                  {currentHand
                    ? currentHand.pots.reduce(
                        (sum, pot) => sum + pot.amount,
                        0
                      ) +
                      Object.values(currentHand.perPlayerCommitted).reduce(
                        (sum, amt) => sum + amt,
                        0
                      )
                    : 0}
                </div>
              </div>
            </div>
          </div>

          {currentHand && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm font-medium">
              {currentHand.gameVariant === "texasHoldem" && (
                <>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Bet: {currentHand.currentBet}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                </>
              )}
              <div
                className={cn(
                  "px-3 py-1 rounded-full border uppercase tracking-wider text-xs font-bold",
                  getStreetColor(currentHand.currentStreet)
                )}
              >
                {getStreetLabel(currentHand.currentStreet)}
              </div>
            </div>
          )}

          {/* Board Cards */}
          {currentHand && currentHand.board.length > 0 && (
            <div className="mt-8 flex justify-center gap-3 perspective-1000">
              {currentHand.board.map((card, i) => (
                <Card
                  key={i}
                  code={card}
                  faceUp={true}
                  size="medium"
                  className="shadow-2xl hover:-translate-y-2 transition-transform duration-300"
                />
              ))}
            </div>
          )}
        </div>

        {/* Players */}
        <div className="divide-y">
          {players.map((player) => {
            const handState = currentHand?.playerHands.find(
              (h) => h.playerId === player.id
            );
            return (
              <PlayerRow
                key={player.id}
                player={player}
                handState={handState}
                isActive={currentHand?.activePlayerId === player.id}
                isDealer={currentHand?.dealerSeat === player.seat}
              />
            );
          })}
        </div>

        {/* Start Hand Button (if no hand active) */}
        {!currentHand && handHistory.length > 0 && (
          <div className="p-8 flex justify-center">
            <Button
              size="lg"
              className="w-full max-w-xs h-14 text-lg"
              onClick={() => startNewHand()}
            >
              Deal Hand
            </Button>
          </div>
        )}
        {/* Stud: Auto-trigger first card dealing */}
        {currentHand &&
          currentHand.gameVariant === "fiveCardStud" &&
          currentHand.activePlayerId === "WAITING_FOR_STUD_FIRST" && (
            <div className="p-4 flex justify-center">
              <Button
                size="lg"
                className="w-full max-w-xs h-14 text-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                onClick={() => {
                  // Trigger card dealing dialog
                  usePokerStore.setState((state) => ({
                    ...state,
                    currentHand: state.currentHand
                      ? {
                          ...state.currentHand,
                          activePlayerId: "WAITING_FOR_STUD_CARD",
                        }
                      : undefined,
                  }));
                }}
              >
                Deal Initial Cards
              </Button>
            </div>
          )}
      </main>

      {/* Controls */}
      {currentHand && <Controls />}

      {/* Showdown Dialog */}
      <ShowdownDialog />

      {/* Community Card Input Dialog */}
      <CommunityCardDialog />

      {/* Stud Card Input Dialog */}
      <StudCardDialog />

      {/* Initial Deal Confirmation Dialog */}
      <InitialDealDialog />

      {/* Dealer Selection Dialog */}
      <DealerSelectionDialog onSelectDealer={(seat) => startNewHand(seat)} />

      {/* Chip Toss Animation Layer */}
      <ChipAnimation />
    </div>
  );
}

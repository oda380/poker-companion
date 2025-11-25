"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePokerStore } from "@/store/usePokerStore";
import { Button } from "@/components/ui/button";
import { PlayerRow } from "@/components/game/PlayerRow";
import { Controls } from "@/components/game/Controls";
import { HandHistory } from "@/components/game/HandHistory";
import { ShowdownDialog } from "@/components/game/ShowdownDialog";
import { DealerSelectionDialog } from "@/components/game/DealerSelectionDialog";
import { CommunityCardDialog } from "@/components/game/CommunityCardDialog";
import { StudCardDialog } from "@/components/game/StudCardDialog";
import { Settings, History, RotateCcw, Home, Users, Menu } from "lucide-react";
import { InitialDealDialog } from "@/components/game/InitialDealDialog";
import { ChipAnimation } from "@/components/game/ChipAnimation";
import { SettingsDialog } from "@/components/game/SettingsDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TablePage() {
    const router = useRouter();
    const players = usePokerStore((state) => state.players);
    const currentHand = usePokerStore((state) => state.currentHand);
    const handHistory = usePokerStore((state) => state.handHistory);
    const startNewHand = usePokerStore((state) => state.startNewHand);
    const undo = usePokerStore.temporal.getState().undo;

    useEffect(() => {
        if (players.length === 0) {
            router.push("/setup");
        }
    }, [players, router]);

    if (players.length === 0) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur border-white/10">
                            <DropdownMenuItem onClick={() => router.push("/")} className="focus:bg-primary/20">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/setup")} className="focus:bg-primary/20">
                                <Users className="w-4 h-4 mr-2" />
                                Table Setup
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => undo()} className="focus:bg-primary/20">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Undo Last Action
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        Friday Night Poker
                    </div>
                </div>
                <div className="flex gap-2">
                    <HandHistory />
                    <SettingsDialog />
                </div>
            </header>

            {/* Game Area */}
            <main className="flex-1 overflow-y-auto pb-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                {/* Pot Display */}
                <div className="p-10 text-center sticky top-0 z-0">
                    <div id="pot-display" className="relative inline-block group">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 to-transparent blur-3xl group-hover:from-amber-500/30 transition-all duration-500" />

                        <div className="relative">
                            <div className="text-xs text-amber-500/80 uppercase tracking-[0.2em] font-bold mb-3">Total Pot</div>
                            <div className="text-6xl font-black bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 bg-clip-text text-transparent drop-shadow-2xl filter">
                                <span className="text-4xl align-top opacity-60 mr-1">$</span>
                                {currentHand
                                    ? (currentHand.pots.reduce((sum, pot) => sum + pot.amount, 0) +
                                        Object.values(currentHand.perPlayerCommitted).reduce((sum, amt) => sum + amt, 0))
                                    : 0
                                }
                            </div>
                        </div>
                    </div>

                    {currentHand && (
                        <div className="mt-6 flex items-center justify-center gap-3 text-sm font-medium">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Bet: ${currentHand.currentBet}
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-600" />
                            <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wider text-xs">
                                {currentHand.currentStreet}
                            </div>
                        </div>
                    )}

                    {/* Board Cards */}
                    {currentHand && currentHand.board.length > 0 && (
                        <div className="mt-8 flex justify-center gap-3 perspective-1000">
                            {currentHand.board.map((card, i) => (
                                <div
                                    key={i}
                                    className="w-16 h-24 bg-white rounded-lg border border-gray-200 shadow-2xl flex items-center justify-center text-2xl font-bold text-black transform hover:-translate-y-2 transition-transform duration-300"
                                >
                                    {card}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Players */}
                <div className="divide-y">
                    {players.map((player) => {
                        const handState = currentHand?.playerHands.find(h => h.playerId === player.id);
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
                        <Button size="lg" className="w-full max-w-xs h-14 text-lg" onClick={() => startNewHand()}>
                            Deal Hand
                        </Button>
                    </div>
                )}
                {/* Stud: Auto-trigger first card dealing */}
                {currentHand && currentHand.gameVariant === "fiveCardStud" && currentHand.activePlayerId === "WAITING_FOR_STUD_FIRST" && (
                    <div className="p-4 flex justify-center">
                        <Button size="lg" className="w-full max-w-xs h-14 text-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800" onClick={() => {
                            // Trigger card dealing dialog
                            usePokerStore.setState(state => ({
                                ...state,
                                currentHand: state.currentHand ? {
                                    ...state.currentHand,
                                    activePlayerId: "WAITING_FOR_STUD_CARD"
                                } : undefined
                            }));
                        }}>
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

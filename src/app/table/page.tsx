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
            <header className="h-14 border-b flex items-center justify-between px-4 bg-card sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => router.push("/")}>
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/setup")}>
                                <Users className="w-4 h-4 mr-2" />
                                Table Setup
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => undo()}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Undo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="font-bold text-lg">Table 1</div>
                </div>
                <div className="flex gap-2">
                    <HandHistory />
                    <Button variant="ghost" size="icon">
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Game Area */}
            <main className="flex-1 overflow-y-auto pb-32 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
                {/* Pot Display */}
                <div className="p-8 text-center sticky top-0 z-0 bg-gradient-to-b from-slate-900/95 to-transparent backdrop-blur-sm">
                    <div className="relative inline-block">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 to-transparent blur-2xl" />

                        <div className="relative">
                            <div className="text-xs text-amber-400/80 uppercase tracking-widest font-semibold mb-2">Total Pot</div>
                            <div className="text-5xl font-black bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent drop-shadow-lg">
                                ${currentHand
                                    ? (currentHand.pots.reduce((sum, pot) => sum + pot.amount, 0) +
                                        Object.values(currentHand.perPlayerCommitted).reduce((sum, amt) => sum + amt, 0))
                                    : 0
                                }
                            </div>
                        </div>
                    </div>

                    {currentHand && (
                        <div className="text-sm text-slate-400 mt-4 font-medium">
                            Current Bet: <span className="text-emerald-400 font-bold">${currentHand.currentBet}</span> • {currentHand.currentStreet.toUpperCase()}
                        </div>
                    )}

                    {/* Board Cards */}
                    {currentHand && currentHand.board.length > 0 && (
                        <div className="mt-6 flex justify-center gap-2">
                            {currentHand.board.map((card, i) => (
                                <div
                                    key={i}
                                    className="w-16 h-22 bg-white rounded-lg border-2 border-gray-300 shadow-xl flex items-center justify-center text-2xl font-bold text-black"
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
        </div>
    );
}

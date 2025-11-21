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
            <main className="flex-1 overflow-y-auto pb-32">
                {/* Pot Display */}
                <div className="p-6 text-center bg-muted/30 sticky top-0 z-0">
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Pot</div>
                    <div className="text-4xl font-bold text-primary mt-1">
                        {currentHand
                            ? Object.values(currentHand.perPlayerCommitted).reduce((sum, amt) => sum + amt, 0)
                            : 0
                        }
                    </div>
                    {currentHand && (
                        <div className="text-sm text-muted-foreground mt-2">
                            Current Bet: {currentHand.currentBet} • {currentHand.currentStreet.toUpperCase()}
                        </div>
                    )}

                    {/* Board Cards */}
                    {currentHand && currentHand.board.length > 0 && (
                        <div className="mt-4 flex justify-center gap-2">
                            {currentHand.board.map((card, i) => (
                                <div
                                    key={i}
                                    className="w-16 h-22 bg-white rounded border-2 border-gray-300 shadow-lg flex items-center justify-center text-2xl font-bold text-black"
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
                {!currentHand && (
                    <div className="p-8 flex justify-center">
                        <Button size="lg" className="w-full max-w-xs h-14 text-lg" onClick={() => startNewHand()}>
                            Deal Hand
                        </Button>
                    </div>
                )}
                {currentHand && currentHand.gameVariant === "fiveCardStud" && currentHand.activePlayerId === "WAITING_FOR_STUD_FIRST" && (
                    <div className="p-4 flex justify-center">
                        <Button size="lg" variant="outline" onClick={() => {
                            usePokerStore.setState(state => ({
                                ...state,
                                currentHand: state.currentHand ? {
                                    ...state.currentHand,
                                    activePlayerId: "WAITING_FOR_STUD_CARD"
                                } : undefined
                            }));
                        }}>
                            Deal 1st Cards
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

            {/* Dealer Selection Dialog */}
            <DealerSelectionDialog onSelectDealer={(seat) => startNewHand(seat)} />
        </div>
    );
}

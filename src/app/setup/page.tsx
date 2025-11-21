"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePokerStore } from "@/store/usePokerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameVariant } from "@/types";
import { motion } from "framer-motion";

export default function SetupPage() {
    const router = useRouter();
    const setTableConfig = usePokerStore((state) => state.setTableConfig);
    const addPlayer = usePokerStore((state) => state.addPlayer);

    const [tableName, setTableName] = useState("Friday Night Poker");
    const [variant, setVariant] = useState<GameVariant>("texasHoldem");
    const [smallBlind, setSmallBlind] = useState(1);
    const [bigBlind, setBigBlind] = useState(2);
    const [ante, setAnte] = useState(0);
    const [startingStack, setStartingStack] = useState(1000);
    const [playerCount, setPlayerCount] = useState(4);

    const handleStart = () => {
        setTableConfig(tableName, variant, {
            smallBlind: variant === "texasHoldem" ? smallBlind : undefined,
            bigBlind: variant === "texasHoldem" ? bigBlind : undefined,
            ante: ante > 0 ? ante : undefined,
        });

        // Clear existing players first
        const existingPlayers = usePokerStore.getState().players;
        existingPlayers.forEach(p => {
            usePokerStore.getState().removePlayer(p.id);
        });

        // Add initial players
        for (let i = 1; i <= playerCount; i++) {
            addPlayer(`Player ${i}`, i, startingStack);
        }

        router.push("/table");
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Table Setup</CardTitle>
                        <CardDescription>Configure your game settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Table Name</Label>
                            <Input value={tableName} onChange={(e) => setTableName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Game Variant</Label>
                            <Tabs value={variant} onValueChange={(v) => setVariant(v as GameVariant)}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="texasHoldem">Texas Hold'em</TabsTrigger>
                                    <TabsTrigger value="fiveCardStud">5-Card Stud</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {variant === "texasHoldem" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Small Blind</Label>
                                        <Input type="number" value={smallBlind} onChange={(e) => setSmallBlind(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Big Blind</Label>
                                        <Input type="number" value={bigBlind} onChange={(e) => setBigBlind(Number(e.target.value))} />
                                    </div>
                                </>
                            )}
                            <div className="space-y-2">
                                <Label>Ante (Optional)</Label>
                                <Input type="number" value={ante} onChange={(e) => setAnte(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Starting Stack</Label>
                                <Input type="number" value={startingStack} onChange={(e) => setStartingStack(Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Initial Players: {playerCount}</Label>
                            <Input
                                type="range"
                                min={2}
                                max={9}
                                value={playerCount}
                                onChange={(e) => setPlayerCount(Number(e.target.value))}
                            />
                        </div>

                        <Button size="lg" className="w-full" onClick={handleStart}>
                            Create Table
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

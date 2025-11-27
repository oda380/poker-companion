"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePokerStore } from "@/store/usePokerStore";
import { DEFAULT_STACK, GAME_VARIANTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameVariant } from "@/types";
import { motion } from "framer-motion";

import { NavBar } from "@/components/nav-bar";

export default function SetupPage() {
  const router = useRouter();
  const setTableConfig = usePokerStore((state) => state.setTableConfig);
  const addPlayer = usePokerStore((state) => state.addPlayer);
  // Force cleanup of any lingering locks when entering setup
  useEffect(() => {
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");

    // Also ensure store UI state is clean
    usePokerStore.setState((state) => ({
      ...state,
      ui: {
        isSettingsOpen: false,
        isHandHistoryOpen: false,
        isShowdownDialogOpen: true,
        activeModal: null,
      },
    }));
  }, []);

  const [tableName, setTableName] = useState("Friday Night Poker");
  const [variant, setVariant] = useState<GameVariant>("texasHoldem");
  const [smallBlind, setSmallBlind] = useState(1);
  const [bigBlind, setBigBlind] = useState(2);
  const [ante, setAnte] = useState(0);
  const [startingStack, setStartingStack] = useState(DEFAULT_STACK);
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(9)
      .fill("")
      .map((_, i) => `Player ${i + 1}`)
  );
  const tableNameInputRef = useRef<HTMLInputElement>(null);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    // Ensure playerNames array has enough entries
    setPlayerNames((prev) => {
      const newNames = [...prev];
      for (let i = 0; i < count; i++) {
        if (!newNames[i]) newNames[i] = `Player ${i + 1}`;
      }
      return newNames;
    });
  };

  const handleStart = () => {
    // Blur any focused input to ensure keyboard closes before navigation
    tableNameInputRef.current?.blur();

    // Small delay to let keyboard close
    setTimeout(() => {
      // Reset game state completely
      usePokerStore.getState().resetGame();

      // Set new config
      setTableConfig(tableName, variant, {
        smallBlind: variant === "texasHoldem" ? smallBlind : undefined,
        bigBlind: variant === "texasHoldem" ? bigBlind : undefined,
        ante: ante > 0 ? ante : undefined,
      });

      // Add initial players with custom names
      for (let i = 0; i < playerCount; i++) {
        addPlayer(playerNames[i] || `Player ${i + 1}`, i + 1, startingStack);
      }

      router.push("/table");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden pt-20">
      <NavBar />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Table Setup</h2>
          <p className="text-muted-foreground mt-2">
            Configure your game settings below.
          </p>
        </div>

        <Card className="border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-base">Table Name</Label>
              <Input
                ref={tableNameInputRef}
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="h-12 text-lg bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
                placeholder="Enter table name..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Game Variant</Label>
              <Tabs
                defaultValue={GAME_VARIANTS.TEXAS_HOLDEM.id}
                onValueChange={(v) => setVariant(v as GameVariant)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 bg-background/50 p-1">
                  <TabsTrigger
                    value={GAME_VARIANTS.TEXAS_HOLDEM.id}
                    className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {GAME_VARIANTS.TEXAS_HOLDEM.label}
                  </TabsTrigger>
                  <TabsTrigger
                    value={GAME_VARIANTS.FIVE_CARD_STUD.id}
                    className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {GAME_VARIANTS.FIVE_CARD_STUD.label}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {variant === GAME_VARIANTS.TEXAS_HOLDEM.id && (
                <>
                  <div className="space-y-3">
                    <Label>Small Blind</Label>
                    <Input
                      type="number"
                      value={smallBlind}
                      onChange={(e) => setSmallBlind(Number(e.target.value))}
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Big Blind</Label>
                    <Input
                      type="number"
                      value={bigBlind}
                      onChange={(e) => setBigBlind(Number(e.target.value))}
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                </>
              )}
              <div className="space-y-3">
                <Label>Ante (Optional)</Label>
                <Input
                  type="number"
                  value={ante}
                  onChange={(e) => setAnte(Number(e.target.value))}
                  className="bg-background/50 border-white/10"
                />
              </div>
              <div className="space-y-3">
                <Label>Starting Stack</Label>
                <Input
                  type="number"
                  value={startingStack}
                  onChange={(e) => setStartingStack(Number(e.target.value))}
                  className="bg-background/50 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <Label className="text-base">Initial Players</Label>
                <span className="text-2xl font-bold text-primary">
                  {playerCount}
                </span>
              </div>
              <Input
                type="range"
                min={2}
                max={9}
                value={playerCount}
                onChange={(e) =>
                  handlePlayerCountChange(Number(e.target.value))
                }
                className="accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Heads Up (2)</span>
                <span>Full Ring (9)</span>
              </div>

              {/* Player Names Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Array.from({ length: playerCount }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Seat {i + 1}
                    </Label>
                    <Input
                      value={playerNames[i]}
                      onChange={(e) => {
                        const newNames = [...playerNames];
                        newNames[i] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      className="h-9 bg-background/30"
                      placeholder={`Player ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-16 text-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white disabled:opacity-50"
              onClick={handleStart}
            >
              Create Table
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

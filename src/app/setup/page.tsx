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
  const [smallBlind, setSmallBlind] = useState<number | "">(1);
  const [bigBlind, setBigBlind] = useState<number | "">(2);
  const [ante, setAnte] = useState<number | "">(0);
  const [startingStack, setStartingStack] = useState<number | "">(
    DEFAULT_STACK
  );
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

  // Removed problematic useEffect

  const handleVariantChange = (newVariant: GameVariant) => {
    setVariant(newVariant);
    // Auto-set Ante for Stud
    if (newVariant === GAME_VARIANTS.FIVE_CARD_STUD.id) {
      if (!ante || Number(ante) <= 0) {
        setAnte(10);
      }
    }
  };

  const handleStart = () => {
    // Blur any focused input to ensure keyboard closes before navigation
    tableNameInputRef.current?.blur();

    // Validation for Stud
    if (variant === GAME_VARIANTS.FIVE_CARD_STUD.id) {
      if (!ante || Number(ante) <= 0) {
        // Prevent start if Ante is invalid
        // Ideally show a toast, but for now just returning is safe as button will be disabled
        return;
      }
    }

    // Small delay to let keyboard close
    setTimeout(() => {
      // Reset game state completely
      usePokerStore.getState().resetGame();

      // Set new config
      setTableConfig(tableName, variant, {
        smallBlind:
          variant === "texasHoldem" ? Number(smallBlind) || 0 : undefined,
        bigBlind: variant === "texasHoldem" ? Number(bigBlind) || 0 : undefined,
        ante: Number(ante) > 0 ? Number(ante) : undefined,
      });

      // Add initial players with custom names
      for (let i = 0; i < playerCount; i++) {
        addPlayer(
          playerNames[i] || `Player ${i + 1}`,
          i + 1,
          Number(startingStack) || DEFAULT_STACK
        );
      }

      router.push("/table");
    }, 100);
  };

  const isStud = variant === GAME_VARIANTS.FIVE_CARD_STUD.id;
  const isStartDisabled = isStud && (!ante || Number(ante) <= 0);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden pt-20">
      <NavBar />

      {/* Ambient Background Orbs */}
      <div className="ambient-orb-emerald w-[400px] h-[400px] -top-20 -right-20" />
      <div className="ambient-orb-purple w-[350px] h-[350px] bottom-0 -left-20" />

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gradient-emerald">Table Setup</h2>
          <p className="text-muted-foreground mt-2">
            Configure your game settings below.
          </p>
        </div>

        <Card className="glass-card gradient-border">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-base font-medium">Table Name</Label>
              <Input
                ref={tableNameInputRef}
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-12 text-lg glass border-white/10 focus:border-primary/50 input-glow transition-all"
                placeholder="Enter table name..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Game Variant</Label>
              <Tabs
                defaultValue={GAME_VARIANTS.TEXAS_HOLDEM.id}
                onValueChange={(v) => handleVariantChange(v as GameVariant)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 glass p-1">
                  <TabsTrigger
                    value={GAME_VARIANTS.TEXAS_HOLDEM.id}
                    className="text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-glow-emerald-sm transition-all"
                  >
                    {GAME_VARIANTS.TEXAS_HOLDEM.label}
                  </TabsTrigger>
                  <TabsTrigger
                    value={GAME_VARIANTS.FIVE_CARD_STUD.id}
                    className="text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-glow-emerald-sm transition-all"
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
                    <Label className="font-medium">Small Blind</Label>
                    <Input
                      type="number"
                      value={smallBlind}
                      onChange={(e) =>
                        setSmallBlind(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      onFocus={(e) => e.target.select()}
                      className="glass border-white/10 input-glow"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-medium">Big Blind</Label>
                    <Input
                      type="number"
                      value={bigBlind}
                      onChange={(e) =>
                        setBigBlind(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      onFocus={(e) => e.target.select()}
                      className="glass border-white/10 input-glow"
                    />
                  </div>
                </>
              )}
              <div className="space-y-3">
                <Label className={isStud ? "text-primary font-bold" : "font-medium"}>
                  Ante {isStud ? "(Required)" : "(Optional)"}
                </Label>
                <Input
                  type="number"
                  value={ante}
                  onChange={(e) =>
                    setAnte(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onFocus={(e) => e.target.select()}
                  className={`glass border-white/10 input-glow ${isStud && (!ante || Number(ante) <= 0)
                    ? "border-red-500/50 focus:border-red-500"
                    : ""
                    }`}
                />
              </div>
              <div className="space-y-3">
                <Label className="font-medium">Starting Stack</Label>
                <Input
                  type="number"
                  value={startingStack}
                  onChange={(e) =>
                    setStartingStack(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  onFocus={(e) => e.target.select()}
                  className="glass border-white/10 input-glow"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Initial Players</Label>
                <span className="text-2xl font-bold text-gradient-emerald">
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
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Heads Up (2)</span>
                <span>Full Ring (9)</span>
              </div>

              {/* Player Names Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Array.from({ length: playerCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="space-y-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
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
                      className="h-9 glass border-white/5"
                      placeholder={`Player ${i + 1}`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-16 text-lg bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white btn-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleStart}
              disabled={isStartDisabled}
            >
              Create Table
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

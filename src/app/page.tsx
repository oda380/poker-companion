"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RulesDialog } from "@/components/game/RulesDialog";
import { AboutDialog } from "@/components/about-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_VERSION, GAME_VARIANTS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { getSavedGameMetadata, loadCurrentGame } from "@/lib/game-persistence";
import { usePokerStore } from "@/store/usePokerStore";
import { BookOpen, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const router = useRouter();
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameAge, setSavedGameAge] = useState<string>("");
  const restoreState = usePokerStore((state) => state.restoreState);

  useEffect(() => {
    // Check for saved game on mount
    getSavedGameMetadata().then((metadata) => {
      if (metadata) {
        setHasSavedGame(true);
        setSavedGameAge(
          formatDistanceToNow(metadata.timestamp, { addSuffix: true })
        );
      }
    });
  }, []);

  const handleResumeGame = async () => {
    const savedState = await loadCurrentGame();
    if (savedState) {
      restoreState(savedState);
      router.push("/table");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Orbs */}
      <div className="ambient-orb-emerald w-[500px] h-[500px] -top-32 -left-32" />
      <div className="ambient-orb-purple w-[400px] h-[400px] top-1/2 -right-20" />
      <div className="ambient-orb-amber w-[300px] h-[300px] -bottom-20 left-1/4" />

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />

      {/* Info icon, History icon, and Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full glass hover:bg-white/10 transition-all"
          onClick={() => router.push("/history")}
        >
          <History className="w-5 h-5" />
        </Button>
        <AboutDialog />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center space-y-6 mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto w-28 h-28 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl shadow-glow-emerald flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-300"
          >
            <span className="text-6xl drop-shadow-lg">♠️</span>
          </motion.div>

          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-emerald"
            >
              Poker Companion
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg text-muted-foreground max-w-sm mx-auto"
            >
              The ultimate companion for your home games.
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <Button
            size="lg"
            className="w-full text-lg h-16 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white btn-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => router.push("/setup")}
          >
            Start New Table
          </Button>

          {hasSavedGame && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full text-lg h-16 rounded-xl glass-strong hover:bg-white/15 border-emerald-500/30 hover:border-emerald-500/50 transition-all"
                onClick={handleResumeGame}
              >
                Resume Game
                <span className="ml-2 text-xs text-muted-foreground">
                  {savedGameAge}
                </span>
              </Button>
            </motion.div>
          )}

          <RulesDialog
            trigger={
              <Button
                variant="outline"
                size="lg"
                className="w-full text-lg h-16 rounded-xl glass hover:bg-white/10 border-white/10 hover:border-white/20 transition-all"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                How to Play
              </Button>
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
            Supports {GAME_VARIANTS.TEXAS_HOLDEM.label} &amp;{" "}
            {GAME_VARIANTS.FIVE_CARD_STUD.label}
          </p>
          <p className="text-[10px] text-muted-foreground/30 mt-2">
            v{APP_VERSION}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

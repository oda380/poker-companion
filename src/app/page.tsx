"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RulesDialog } from "@/components/game/RulesDialog";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

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
            className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-emerald-600 rounded-3xl shadow-2xl flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-300"
          >
            <span className="text-5xl drop-shadow-md">♠️</span>
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Poker Companion
            </h1>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto">
              The professional dealer assistant for your home games.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full text-lg h-16 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
            onClick={() => router.push("/setup")}
          >
            Start New Table
          </Button>

          <RulesDialog />

          <Button
            variant="outline"
            size="lg"
            className="w-full text-lg h-16 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all"
            disabled
          >
            Resume Session
            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Soon</span>
          </Button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
            Supports Texas Hold'em & 5-Card Stud
          </p>
        </div>
      </motion.div>
    </div>
  );
}

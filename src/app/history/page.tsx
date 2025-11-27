"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, GameSession } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  Users,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { useState, useRef } from "react";
import * as React from "react";
import { format } from "date-fns";
import { clearDatabase } from "@/lib/db";
import { exportGameData, importGameData } from "@/lib/data-export";
import { toast } from "sonner";
import { Card as CardComponent } from "@/components/game/Card";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/nav-bar";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const sessions = useLiveQuery(() =>
    db.sessions.orderBy("lastUpdated").reverse().toArray()
  );
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSession = (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
    }
  };

  const handleClearHistory = async () => {
    if (
      confirm(
        "Are you sure you want to delete all game history? This cannot be undone."
      )
    ) {
      await clearDatabase();
    }
  };

  const handleExport = async () => {
    try {
      await exportGameData();
      toast.success("Game history exported successfully");
    } catch (error) {
      toast.error("Failed to export game history");
      console.error(error);
    }
  };

  const handleImport = async (file: File) => {
    try {
      await importGameData(file);
      toast.success("Game history imported successfully");
    } catch (error) {
      toast.error("Failed to import game history");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-20">
      <NavBar />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Game History
              </h1>
              <p className="text-muted-foreground mt-1">
                Review your past poker sessions
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImport(file);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              {sessions && sessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Session List */}
          <div className="space-y-4">
            {!sessions ? (
              <div className="text-center py-10 text-muted-foreground">
                Loading history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No games played yet. Start a new table to build your history!
              </div>
            ) : (
              sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isExpanded={expandedSessionId === session.id}
                  onToggle={() => toggleSession(session.id)}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  isExpanded,
  onToggle,
}: {
  session: GameSession;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [expandedHandId, setExpandedHandId] = useState<string | null>(null);
  const hands = useLiveQuery(
    () =>
      isExpanded
        ? db.hands.where("sessionId").equals(session.id).sortBy("handNumber")
        : [],
    [isExpanded, session.id]
  );

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(`Are you sure you want to delete the session "${session.name}"?`)
    ) {
      import("@/lib/db").then(({ deleteSession }) => {
        deleteSession(session.id);
      });
    }
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-card/50 backdrop-blur-xl shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300">
      <div
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-primary">{session.name}</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider font-medium">
              {session.gameVariant === "fiveCardStud"
                ? "5 Card Stud"
                : "Texas Hold'em"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(session.startTime), "MMM d, yyyy • h:mm a")}
            </div>
            {session.finalPlayers && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {session.finalPlayers.length} Players
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10 bg-gradient-to-b from-black/10 to-black/5">
          {!hands ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading hands...
            </div>
          ) : hands.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No hands recorded for this session.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {hands.map((hand) => {
                const isHandExpanded = expandedHandId === hand.id;

                return (
                  <div key={hand.id}>
                    {/* Hand Summary - Clickable */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() =>
                        setExpandedHandId(isHandExpanded ? null : hand.id)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          #{hand.handNumber}
                        </div>
                        <div>
                          <div className="font-medium flex flex-wrap items-center gap-2">
                            <Trophy className="w-3 h-3 text-amber-500" />
                            {hand.summary.winners
                              .map((w) => {
                                const player = session.finalPlayers?.find(
                                  (p) => p.id === w.playerId
                                );
                                return player ? player.name : "Unknown";
                              })
                              .join(", ")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {hand.summary.winners[0]?.handDescription}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-mono font-bold text-emerald-400">
                          {hand.summary.totalPot}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                        >
                          {isHandExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Hand Details - Expandable */}
                    {isHandExpanded && (
                      <div className="px-4 pb-4 space-y-4 bg-transparent">
                        {/* Community Cards */}
                        {hand.fullState.board &&
                          hand.fullState.board.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Community Cards
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {hand.fullState.board.map((card, i) => (
                                  <CardComponent
                                    key={i}
                                    code={card}
                                    faceUp={true}
                                    size="small"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Player Hands */}
                        {hand.fullState.playerHands && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Player Hands
                            </p>
                            <div className="space-y-2">
                              {/* Fix: Iterate over the array directly, not Object.entries */}
                              {hand.fullState.playerHands
                                .filter(
                                  (data) =>
                                    data.cards &&
                                    data.cards.length > 0 &&
                                    !hand.summary.foldedPlayers?.includes(
                                      data.playerId
                                    )
                                )
                                .map((data) => {
                                  const player = session.finalPlayers?.find(
                                    (p) => p.id === data.playerId
                                  );
                                  const isWinner = hand.summary.winners.some(
                                    (w) => w.playerId === data.playerId
                                  );
                                  const playerHandInfo =
                                    hand.summary.playerHands?.find(
                                      (ph) => ph.playerId === data.playerId
                                    );

                                  return (
                                    <div
                                      key={data.playerId}
                                      className={cn(
                                        "p-3 rounded-lg border transition-colors",
                                        isWinner
                                          ? "bg-primary/10 border-primary/30"
                                          : "bg-white/5 border-white/10" // Improved styling: glassmorphism instead of plain background
                                      )}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium flex items-center gap-2">
                                          {player?.name || "Unknown"}
                                          {isWinner && (
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                          )}
                                        </span>
                                        {playerHandInfo && (
                                          <span className="text-xs text-muted-foreground">
                                            {playerHandInfo.handDescription}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex gap-2 flex-wrap">
                                        {data.cards.map((card, i) => (
                                          <CardComponent
                                            key={i}
                                            code={
                                              typeof card === "string"
                                                ? card
                                                : card.code
                                            }
                                            faceUp={true}
                                            size="small"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}

                              {/* Show folded players */}
                              {hand.summary.foldedPlayers?.map((playerId) => {
                                const player = session.finalPlayers?.find(
                                  (p) => p.id === playerId
                                );

                                return (
                                  <div
                                    key={playerId}
                                    className="p-3 rounded-lg border border-white/5 bg-white/5 opacity-50" // Improved styling
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-muted-foreground">
                                        {player?.name || "Unknown"}
                                      </span>
                                      <span className="text-xs text-muted-foreground italic">
                                        Folded
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

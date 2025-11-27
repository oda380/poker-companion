"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, GameSession } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  Users,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as React from "react";
import { format } from "date-fns";
import { clearDatabase } from "@/lib/db";
import { exportGameData, importGameData } from "@/lib/data-export";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const sessions = useLiveQuery(() =>
    db.sessions.orderBy("lastUpdated").reverse().toArray()
  );
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      toast.success("Export successful!", {
        description: "Your game history has been downloaded",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const count = await importGameData(file);
      toast.success("Import successful!", {
        description: `Imported ${count} game session${count !== 1 ? "s" : ""}`,
      });
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl font-bold">Game History</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {/* Import Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await handleImport(file);
                  e.target.value = ""; // Reset input
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

            {/* Clear History Button */}
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
    <Card className="overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
      <div
        className="p-6 cursor-pointer flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-primary">{session.name}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-muted-foreground uppercase tracking-wider">
              {session.gameVariant === "fiveCardStud"
                ? "5 Card Stud"
                : "Texas Hold'em"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(session.startTime), "MMM d, yyyy • h:mm a")}
            </div>
            {session.finalPlayers && (
              <div className="flex items-center gap-1">
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
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10 bg-black/20">
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
              {hands.map((hand) => (
                <div
                  key={hand.id}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
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

                      {/* Show all hands if available */}
                      {hand.summary.playerHands && (
                        <div className="mt-2 space-y-1">
                          {hand.summary.playerHands.map((ph) => {
                            const player = session.finalPlayers?.find(
                              (p) => p.id === ph.playerId
                            );
                            const isWinner = hand.summary.winners.some(
                              (w) => w.playerId === ph.playerId
                            );
                            return (
                              <div
                                key={ph.playerId}
                                className={`text-xs flex items-center gap-2 ${
                                  isWinner
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <span className="w-16 truncate">
                                  {player?.name || "Unknown"}:
                                </span>
                                <span>{ph.handDescription}</span>
                                <span className="opacity-50">
                                  [{ph.cards.join(" ")}]
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    {hand.summary.totalPot}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

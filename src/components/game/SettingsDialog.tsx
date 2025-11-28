import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePokerStore } from "@/store/usePokerStore";
import {
  APP_VERSION,
  DEFAULT_STACK,
  DEVELOPER_INFO,
  GAME_VARIANTS,
} from "@/lib/constants";
import {
  Settings,
  Trash2,
  Plus,
  Pencil,
  Check,
  Spade,
  // Github, // Removed
  Mail,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { useState, useRef } from "react";
import {
  exportGameData,
  importGameData,
  clearAllData,
} from "@/lib/data-export";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export function SettingsDialog() {
  const players = usePokerStore((state) => state.players);
  const addPlayer = usePokerStore((state) => state.addPlayer);
  const removePlayer = usePokerStore((state) => state.removePlayer);
  const config = usePokerStore((state) => state.config);
  const setTableConfig = usePokerStore((state) => state.setTableConfig);
  const tableName = usePokerStore((state) => state.name);
  const gameVariant = usePokerStore((state) => state.gameVariant);
  const currentHand = usePokerStore((state) => state.currentHand);

  // Can modify players only between hands
  const canModifyPlayers = !currentHand || currentHand.finished;

  const updatePlayerName = usePokerStore((state) => state.updatePlayerName);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerStack, setNewPlayerStack] = useState(DEFAULT_STACK);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      // Find first available seat
      const takenSeats = players.map((p) => p.seat);
      let seat = 1;
      while (takenSeats.includes(seat)) seat++;

      addPlayer(newPlayerName, seat, newPlayerStack);
      setNewPlayerName("");
    }
  };

  const startEditing = (player: { id: string; name: string }) => {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
  };

  const handleSaveRename = (playerId: string) => {
    if (editingName.trim()) {
      updatePlayerName(playerId, editingName.trim());
      setEditingPlayerId(null);
    }
  };

  const handleConfigChange = (key: keyof typeof config, value: number) => {
    setTableConfig(tableName, gameVariant, {
      ...config,
      [key]: value,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-white/10">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Table Settings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="game">Game</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-4 py-4">
              <div className="space-y-4">
                {/* Status indicator */}
                {!canModifyPlayers && (
                  <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    ⚠️ Players locked during active hand
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="space-y-2 flex-1">
                    <Label
                      className={
                        !canModifyPlayers ? "text-muted-foreground" : ""
                      }
                    >
                      New Player Name
                    </Label>
                    <Input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Player Name"
                      disabled={!canModifyPlayers}
                    />
                  </div>
                  <div className="space-y-2 w-24">
                    <Label
                      className={
                        !canModifyPlayers ? "text-muted-foreground" : ""
                      }
                    >
                      Stack
                    </Label>
                    <Input
                      type="number"
                      value={newPlayerStack}
                      onChange={(e) =>
                        setNewPlayerStack(Number(e.target.value))
                      }
                      disabled={!canModifyPlayers}
                    />
                  </div>
                  <Button
                    onClick={handleAddPlayer}
                    size="icon"
                    className="mb-0.5"
                    disabled={!canModifyPlayers}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Current Players ({players.length})</Label>
                  <div className="border rounded-lg divide-y">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm shrink-0">
                            {player.seat}
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingPlayerId === player.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) =>
                                    setEditingName(e.target.value)
                                  }
                                  className="h-8 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveRename(player.id);
                                    if (e.key === "Escape")
                                      setEditingPlayerId(null);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-500"
                                  onClick={() => handleSaveRename(player.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`flex items-center gap-2 group ${
                                  canModifyPlayers ? "cursor-pointer" : ""
                                }`}
                                onClick={() => startEditing(player)}
                              >
                                <div className="font-medium truncate">
                                  {player.name}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {player.stack}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                          onClick={() => removePlayer(player.id)}
                          disabled={!canModifyPlayers}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="game" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {gameVariant !== GAME_VARIANTS.FIVE_CARD_STUD.id && (
                  <>
                    <div className="space-y-2">
                      <Label>Small Blind</Label>
                      <Input
                        type="number"
                        value={config.smallBlind || 0}
                        onChange={(e) =>
                          handleConfigChange(
                            "smallBlind",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Big Blind</Label>
                      <Input
                        type="number"
                        value={config.bigBlind || 0}
                        onChange={(e) =>
                          handleConfigChange("bigBlind", Number(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Ante</Label>
                  <Input
                    type="number"
                    value={config.ante || 0}
                    onChange={(e) =>
                      handleConfigChange("ante", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Backup & Restore</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your game history or import from a backup file
                  </p>
                </div>

                {/* Export */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full h-12 gap-2"
                    onClick={async () => {
                      try {
                        await exportGameData();
                        toast.success("Export successful!", {
                          description: "Your game history has been downloaded",
                        });
                      } catch (error) {
                        toast.error("Export failed", {
                          description:
                            error instanceof Error
                              ? error.message
                              : "Unknown error",
                        });
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export Game History
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Download all your game sessions as a JSON file
                  </p>
                </div>

                {/* Import */}
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const count = await importGameData(file);
                        toast.success("Import successful!", {
                          description: `Imported ${count} game session${
                            count !== 1 ? "s" : ""
                          }`,
                        });
                      } catch (error) {
                        toast.error("Import failed", {
                          description:
                            error instanceof Error
                              ? error.message
                              : "Unknown error",
                        });
                      }
                      // Reset file input
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full h-12 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Import Game History
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Restore sessions from a backup file
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Danger Zone
                    </span>
                  </div>
                </div>

                {/* Clear Data */}
                {!showClearConfirm ? (
                  <div className="space-y-2">
                    <Button
                      variant="destructive"
                      className="w-full h-12 gap-2"
                      onClick={() => setShowClearConfirm(true)}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Clear All Data
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Permanently delete all game history
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-destructive">
                          Are you absolutely sure?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This will permanently delete all your game sessions.
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            await clearAllData();
                            toast.success("Data cleared", {
                              description: "All game history has been deleted",
                            });
                            setShowClearConfirm(false);
                          } catch (error) {
                            toast.error("Clear failed", {
                              description:
                                error instanceof Error
                                  ? error.message
                                  : "Unknown error",
                            });
                          }
                        }}
                      >
                        Delete Everything
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* About Tab */}

            <TabsContent value="about" className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                  <Spade className="w-8 h-8 text-primary fill-primary" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-2xl text-foreground">
                    Poker Companion
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Version {APP_VERSION}
                  </p>
                </div>

                <p className="text-muted-foreground max-w-xs mx-auto">
                  A modern, local-first poker table companion app designed for
                  home games.
                </p>

                <div className="flex gap-2 pt-4 flex-wrap justify-center">
                  <InstallButton />
                  {/* <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a
                      href={DEVELOPER_INFO.GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  </Button> */}
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={`mailto:${DEVELOPER_INFO.EMAIL}`}>
                      <Mail className="w-4 h-4" />
                      Contact
                    </a>
                  </Button>
                </div>

                <div className="pt-8 text-xs text-muted-foreground">
                  <p>
                    © {new Date().getFullYear()} {DEVELOPER_INFO.NAME}. All
                    rights reserved.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstallButton() {
  const { isInstallable, isIOS, install } = usePWAInstall();

  if (isInstallable) {
    return (
      <Button
        onClick={install}
        size="sm"
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Download className="w-4 h-4" />
        Add to Home Screen
      </Button>
    );
  }

  if (isIOS) {
    return (
      <Button
        onClick={() => {
          toast.info("Install on iOS", {
            description: (
              <div className="space-y-2">
                <p>To install this app on your iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    Tap the Share button{" "}
                    <span className="inline-block px-1 bg-muted rounded">
                      ⎋
                    </span>
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong>
                  </li>
                </ol>
              </div>
            ),
            duration: 8000,
          });
        }}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Add to Home Screen
      </Button>
    );
  }

  return null;
}

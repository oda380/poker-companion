import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePokerStore } from "@/store/usePokerStore";
import { Settings, Trash2, Plus, Pencil, Check } from "lucide-react";
import { useState } from "react";

export function SettingsDialog() {
    const players = usePokerStore((state) => state.players);
    const addPlayer = usePokerStore((state) => state.addPlayer);
    const removePlayer = usePokerStore((state) => state.removePlayer);
    const config = usePokerStore((state) => state.config);
    const setTableConfig = usePokerStore((state) => state.setTableConfig);
    const tableName = usePokerStore((state) => state.name);
    const gameVariant = usePokerStore((state) => state.gameVariant);

    const updatePlayerName = usePokerStore((state) => state.updatePlayerName);

    const [newPlayerName, setNewPlayerName] = useState("");
    const [newPlayerStack, setNewPlayerStack] = useState(1000);
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const handleAddPlayer = () => {
        if (newPlayerName.trim()) {
            // Find first available seat
            const takenSeats = players.map(p => p.seat);
            let seat = 1;
            while (takenSeats.includes(seat)) seat++;

            addPlayer(newPlayerName, seat, newPlayerStack);
            setNewPlayerName("");
        }
    };

    const startEditing = (player: { id: string, name: string }) => {
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
            [key]: value
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                    <Settings className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Table Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="players" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="players">Players</TabsTrigger>
                        <TabsTrigger value="game">Game</TabsTrigger>
                        <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>

                    <TabsContent value="players" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="flex gap-2 items-end">
                                <div className="space-y-2 flex-1">
                                    <Label>New Player Name</Label>
                                    <Input
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        placeholder="Player Name"
                                    />
                                </div>
                                <div className="space-y-2 w-24">
                                    <Label>Stack</Label>
                                    <Input
                                        type="number"
                                        value={newPlayerStack}
                                        onChange={(e) => setNewPlayerStack(Number(e.target.value))}
                                    />
                                </div>
                                <Button onClick={handleAddPlayer} size="icon" className="mb-0.5">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Current Players ({players.length})</Label>
                                <div className="border rounded-lg divide-y">
                                    {players.map((player) => (
                                        <div key={player.id} className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {player.seat}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {editingPlayerId === player.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={editingName}
                                                                onChange={(e) => setEditingName(e.target.value)}
                                                                className="h-8 text-sm"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleSaveRename(player.id);
                                                                    if (e.key === "Escape") setEditingPlayerId(null);
                                                                }}
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleSaveRename(player.id)}>
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => startEditing(player)}>
                                                            <div className="font-medium truncate">{player.name}</div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground">{player.stack}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                                                onClick={() => removePlayer(player.id)}
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
                            {gameVariant !== "fiveCardStud" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Small Blind</Label>
                                        <Input
                                            type="number"
                                            value={config.smallBlind || 0}
                                            onChange={(e) => handleConfigChange("smallBlind", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Big Blind</Label>
                                        <Input
                                            type="number"
                                            value={config.bigBlind || 0}
                                            onChange={(e) => handleConfigChange("bigBlind", Number(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-2">
                                <Label>Ante</Label>
                                <Input
                                    type="number"
                                    value={config.ante || 0}
                                    onChange={(e) => handleConfigChange("ante", Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="about" className="space-y-4 py-4">
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Developer Info</h4>
                                <p>Created by [Dev Name Placeholder]</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Contact</h4>
                                <p>support@example.com</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Copyright</h4>
                                <p>© {new Date().getFullYear()} Poker Companion. All rights reserved.</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs">Version 1.0.0</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

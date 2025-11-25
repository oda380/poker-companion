import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePokerStore } from "@/store/usePokerStore";
import { useTheme } from "next-themes";
import { Settings, Moon, Sun, Laptop, Trash2, Plus } from "lucide-react";
import { useState } from "react";

export function SettingsDialog() {
    const { theme, setTheme } = useTheme();
    const players = usePokerStore((state) => state.players);
    const addPlayer = usePokerStore((state) => state.addPlayer);
    const removePlayer = usePokerStore((state) => state.removePlayer);
    const config = usePokerStore((state) => state.config);
    const setTableConfig = usePokerStore((state) => state.setTableConfig);
    const tableName = usePokerStore((state) => state.name);
    const gameVariant = usePokerStore((state) => state.gameVariant);

    const [newPlayerName, setNewPlayerName] = useState("");
    const [newPlayerStack, setNewPlayerStack] = useState(1000);

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

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="players">Players</TabsTrigger>
                        <TabsTrigger value="game">Game</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Appearance</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={theme === "light" ? "default" : "outline"}
                                    onClick={() => setTheme("light")}
                                    className="flex flex-col h-20 gap-2"
                                >
                                    <Sun className="w-6 h-6" />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === "dark" ? "default" : "outline"}
                                    onClick={() => setTheme("dark")}
                                    className="flex flex-col h-20 gap-2"
                                >
                                    <Moon className="w-6 h-6" />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === "system" ? "default" : "outline"}
                                    onClick={() => setTheme("system")}
                                    className="flex flex-col h-20 gap-2"
                                >
                                    <Laptop className="w-6 h-6" />
                                    System
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

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
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                                                    {player.seat}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{player.name}</div>
                                                    <div className="text-xs text-muted-foreground">${player.stack}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

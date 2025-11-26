"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function AboutDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">About</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">About Poker Companion</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">What is Poker Companion?</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            A modern, local-first poker table companion app designed for home games.
                            Track players, manage blinds, and keep a detailed history of every hand—all without requiring
                            a centralized server.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">How to Use</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This app acts as your digital dealer for offline games, perfect for beginners:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mt-2">
                            <li><strong>Organize:</strong> Track turns, blinds, and dealer button automatically.</li>
                            <li><strong>Calculate:</strong> Let the app handle pot math, bets, and side pots.</li>
                            <li><strong>Resolve:</strong> Easily determine winners and distribute chips at showdown.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Key Features</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Support for Texas Hold'em and 5-Card Stud</li>
                            <li>Local data storage with IndexedDB (Dexie.js)</li>
                            <li>Detailed hand history and game session tracking</li>
                            <li>Customizable blinds, antes, and player management</li>
                            <li>Dark and light mode support</li>
                            <li>Mobile-optimized interface</li>
                        </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <h3 className="font-semibold">Developer Info</h3>
                        <p className="text-sm text-muted-foreground">Created by Kitaek Lim</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Contact</h3>
                        <p className="text-sm text-muted-foreground">ktlim380@yahoo.com</p>
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Kitaek Lim. All rights reserved.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Version 1.7.0</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

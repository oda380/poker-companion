import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface RulesDialogProps {
    trigger?: React.ReactNode;
}

export function RulesDialog({ trigger }: RulesDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full text-lg h-16 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all"
                    >
                        <BookOpen className="mr-2 h-5 w-5" />
                        How to Play
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        Game Rules
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="holdem" className="w-full h-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="holdem">Texas Hold'em</TabsTrigger>
                        <TabsTrigger value="stud">5-Card Stud</TabsTrigger>
                        <TabsTrigger value="usage">How to Use</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[50vh] pr-4">
                        <TabsContent value="holdem" className="space-y-4">
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <section>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">The Basics</h3>
                                    <p>
                                        Texas Hold'em is a community card game where each player receives two private cards (hole cards),
                                        and five community cards are dealt face-up on the "board". The goal is to make the best 5-card hand.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Game Flow</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>
                                            <strong className="text-foreground">Blinds:</strong> Two players to the left of the dealer post the Small Blind and Big Blind to start the pot.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Pre-Flop:</strong> Each player gets 2 hole cards. Betting starts with the player to the left of the Big Blind.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">The Flop:</strong> 3 community cards are dealt face-up. Another round of betting occurs.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">The Turn:</strong> A 4th community card is dealt. Betting round.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">The River:</strong> The 5th and final community card is dealt. Final betting round.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Showdown:</strong> Remaining players reveal their hands. The best 5-card combination (using any mix of hole cards and board cards) wins the pot.
                                        </li>
                                    </ul>
                                </section>
                            </div>
                        </TabsContent>

                        <TabsContent value="stud" className="space-y-4">
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <section>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">The Basics</h3>
                                    <p>
                                        5-Card Stud is a classic poker variant where players receive a mix of face-down and face-up cards.
                                        There are no community cards; your hand is entirely your own.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Game Flow</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>
                                            <strong className="text-foreground">Ante:</strong> All players post an ante to start the pot.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">The Deal (2nd Street):</strong> Each player receives 1 card face-down (hole card) and 1 card face-up (door card). The player with the lowest door card must "bring in" the betting.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">3rd Street:</strong> Each player gets another face-up card. Betting starts with the highest visible hand.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">4th Street:</strong> Another face-up card. Betting round.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">5th Street:</strong> The final face-up card is dealt. Final betting round.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Showdown:</strong> Players reveal their hole card. The best 5-card hand wins.
                                        </li>
                                    </ul>
                                </section>
                            </div>
                        </TabsContent>

                        <TabsContent value="usage" className="space-y-4">
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <section>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Poker Companion App</h3>
                                    <p>
                                        This app is designed to be a digital assistant for your physical home games. It handles the math and organization so you can focus on the fun.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">How it Helps</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>
                                            <strong className="text-foreground">Organize the Game:</strong> The app tracks whose turn it is, who the dealer is, and the current blind levels. No more "whose turn is it?" confusion.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Handle the Math:</strong> Bet sizes, pot totals, and side pots are calculated automatically. You don't need to count physical chips for every bet.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Resolve Hands:</strong> At the end of a hand (Showdown), just select the winning player(s). The app distributes the pot correctly, even for complex split pots.
                                        </li>
                                    </ul>
                                </section>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/game/Card";
import { GAME_VARIANTS } from "@/lib/constants";

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
          <DialogDescription>
            Learn the basics of Texas Hold&apos;em and 5-Card Stud, or check hand rankings.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={GAME_VARIANTS.TEXAS_HOLDEM.id}
          className="w-full h-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value={GAME_VARIANTS.TEXAS_HOLDEM.id}>
              <span className="sm:hidden">
                {GAME_VARIANTS.TEXAS_HOLDEM.shortLabel}
              </span>
              <span className="hidden sm:inline">
                {GAME_VARIANTS.TEXAS_HOLDEM.label}
              </span>
            </TabsTrigger>
            <TabsTrigger value={GAME_VARIANTS.FIVE_CARD_STUD.id}>
              <span className="sm:hidden">
                {GAME_VARIANTS.FIVE_CARD_STUD.shortLabel}
              </span>
              <span className="hidden sm:inline">
                {GAME_VARIANTS.FIVE_CARD_STUD.label}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rankings">
              <span className="sm:hidden">Rankings</span>
              <span className="hidden sm:inline">Hand Rankings</span>
            </TabsTrigger>
            <TabsTrigger value="usage">
              <span className="sm:hidden">Usage</span>
              <span className="hidden sm:inline">How to Use</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] pr-4">
            <TabsContent
              value={GAME_VARIANTS.TEXAS_HOLDEM.id}
              className="space-y-4"
            >
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    The Basics
                  </h3>
                  <p>
                    Texas Hold&apos;em is a community card game where each
                    player receives two private cards (hole cards), and five
                    community cards are dealt face-up on the &quot;board&quot;.
                    The goal is to make the best 5-card hand.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Game Flow
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">Pre-Flop:</strong>{" "}
                      Players are dealt two hole cards. Blinds are posted. First
                      betting round.
                    </li>
                    <li>
                      <strong className="text-foreground">Flop:</strong> Three
                      community cards are dealt face-up. Second betting round.
                    </li>
                    <li>
                      <strong className="text-foreground">Turn:</strong> A
                      fourth community card is dealt. Third betting round.
                    </li>
                    <li>
                      <strong className="text-foreground">River:</strong> The
                      fifth and final community card is dealt. Final betting
                      round.
                    </li>
                    <li>
                      <strong className="text-foreground">Showdown:</strong>{" "}
                      Players reveal their hole cards. The best 5-card hand
                      (using any combination of hole cards and board cards)
                      wins.
                    </li>
                  </ul>
                </section>
              </div>
            </TabsContent>

            <TabsContent
              value={GAME_VARIANTS.FIVE_CARD_STUD.id}
              className="space-y-4"
            >
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    The Basics
                  </h3>
                  <p>
                    5-Card Stud is a classic poker variant where players are
                    dealt one card face-down and one card face-up. Additional
                    cards are dealt face-up until each player has five cards.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Game Flow
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">Ante:</strong> All
                      players post an ante to start the pot.
                    </li>
                    <li>
                      <strong className="text-foreground">2nd Street:</strong>{" "}
                      Players receive one card face-down (hole card) and one
                      card face-up (door card). First betting round (usually
                      starts with the lowest door card).
                    </li>
                    <li>
                      <strong className="text-foreground">3rd Street:</strong> A
                      third card is dealt face-up. Second betting round (starts
                      with the highest hand showing).
                    </li>
                    <li>
                      <strong className="text-foreground">4th Street:</strong> A
                      fourth card is dealt face-up. Third betting round.
                    </li>
                    <li>
                      <strong className="text-foreground">5th Street:</strong> A
                      fifth card is dealt face-up. Final betting round.
                    </li>
                    <li>
                      <strong className="text-foreground">Showdown:</strong>{" "}
                      Players reveal their hole card. The best 5-card hand wins.
                    </li>
                  </ul>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="rankings" className="space-y-4">
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Poker Hand Rankings
                  </h3>
                  <p className="mb-4">Listed from highest to lowest.</p>
                  <ul className="space-y-6">
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Royal Flush
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          A, K, Q, J, 10, all the same suit.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="As" faceUp={true} size="small" />
                        <Card code="Ks" faceUp={true} size="small" />
                        <Card code="Qs" faceUp={true} size="small" />
                        <Card code="Js" faceUp={true} size="small" />
                        <Card code="Ts" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Straight Flush
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          Five cards in a sequence, all in the same suit.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="9h" faceUp={true} size="small" />
                        <Card code="8h" faceUp={true} size="small" />
                        <Card code="7h" faceUp={true} size="small" />
                        <Card code="6h" faceUp={true} size="small" />
                        <Card code="5h" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Four of a Kind
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          All four cards of the same rank.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Ah" faceUp={true} size="small" />
                        <Card code="As" faceUp={true} size="small" />
                        <Card code="Ac" faceUp={true} size="small" />
                        <Card code="Ad" faceUp={true} size="small" />
                        <Card code="5s" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Full House
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          Three of a kind with a pair.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Kh" faceUp={true} size="small" />
                        <Card code="Ks" faceUp={true} size="small" />
                        <Card code="Kc" faceUp={true} size="small" />
                        <Card code="7d" faceUp={true} size="small" />
                        <Card code="7c" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">Flush</strong>
                        <span className="text-xs text-muted-foreground">
                          Any five cards of the same suit, but not in a
                          sequence.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Ah" faceUp={true} size="small" />
                        <Card code="Jh" faceUp={true} size="small" />
                        <Card code="8h" faceUp={true} size="small" />
                        <Card code="4h" faceUp={true} size="small" />
                        <Card code="2h" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Straight
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          Five cards in a sequence, but not of the same suit.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="9s" faceUp={true} size="small" />
                        <Card code="8h" faceUp={true} size="small" />
                        <Card code="7d" faceUp={true} size="small" />
                        <Card code="6c" faceUp={true} size="small" />
                        <Card code="5s" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Three of a Kind
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          Three cards of the same rank.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Qh" faceUp={true} size="small" />
                        <Card code="Qs" faceUp={true} size="small" />
                        <Card code="Qc" faceUp={true} size="small" />
                        <Card code="9d" faceUp={true} size="small" />
                        <Card code="2s" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          Two Pair
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          Two different pairs.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Jh" faceUp={true} size="small" />
                        <Card code="Js" faceUp={true} size="small" />
                        <Card code="8d" faceUp={true} size="small" />
                        <Card code="8c" faceUp={true} size="small" />
                        <Card code="4s" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">Pair</strong>
                        <span className="text-xs text-muted-foreground">
                          Two cards of the same rank.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Ah" faceUp={true} size="small" />
                        <Card code="As" faceUp={true} size="small" />
                        <Card code="9d" faceUp={true} size="small" />
                        <Card code="5c" faceUp={true} size="small" />
                        <Card code="2s" faceUp={true} size="small" />
                      </div>
                    </li>
                    <li>
                      <div className="mb-2">
                        <strong className="text-foreground block">
                          High Card
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          When you haven&apos;t made any of the hands above, the
                          highest card plays.
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Card code="Ah" faceUp={true} size="small" />
                        <Card code="Jd" faceUp={true} size="small" />
                        <Card code="8s" faceUp={true} size="small" />
                        <Card code="5c" faceUp={true} size="small" />
                        <Card code="2h" faceUp={true} size="small" />
                      </div>
                    </li>
                  </ul>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Poker Companion App
                  </h3>
                  <p>
                    This app is designed to be a digital assistant for your
                    physical home games. It handles the math and organization so
                    you can focus on the fun.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    How it Helps
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">
                        Organize the Game:
                      </strong>{" "}
                      The app tracks whose turn it is, who the dealer is, and
                      the current blind levels. No more &quot;whose turn is
                      it?&quot; confusion.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Handle the Math:
                      </strong>{" "}
                      Bet sizes, pot totals, and side pots are calculated
                      automatically. You don&apos;t need to count physical chips
                      for every bet.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Resolve Hands:
                      </strong>{" "}
                      At the end of a hand (Showdown), just select the winning
                      player(s). The app distributes the pot correctly, even for
                      complex split pots.
                    </li>
                  </ul>
                </section>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
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

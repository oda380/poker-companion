"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-3xl">♠️</span>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Poker Companion</CardTitle>
            <CardDescription className="text-lg">
              Your professional dealer assistant for Texas Hold'em and 5-Card Stud.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full text-lg h-14"
              onClick={() => router.push("/setup")}
            >
              Start New Table
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full text-lg h-14"
              disabled
            >
              Resume Session (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

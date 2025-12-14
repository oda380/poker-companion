"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/game/SettingsDialog";
import { AboutDialog } from "@/components/about-dialog";
import { RulesDialog } from "@/components/game/RulesDialog";
import { Home, History, LogOut, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isTablePage = pathname === "/table";
  const isSetupPage = pathname === "/setup";

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    if (isTablePage) {
      setPendingPath(path);
      setShowLeaveDialog(true);
    } else {
      router.push(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingPath) {
      router.push(pendingPath);
      setShowLeaveDialog(false);
      setPendingPath(null);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={isTablePage ? "#" : "/"}
              onClick={(e) => {
                if (isTablePage) {
                  e.preventDefault();
                  handleNavigation("/");
                }
              }}
              className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="text-gradient-primary">
                Poker Companion
              </span>
            </Link>

            {/* Mobile Exit Button */}
            {isTablePage && (
              <button
                onClick={() => handleNavigation("/setup")}
                className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
              >
                Exit
              </button>
            )}

            {/* Mobile History Button */}
            <Link
              href={isTablePage ? "#" : "/history"}
              onClick={(e) => {
                if (isTablePage) {
                  e.preventDefault();
                  handleNavigation("/history");
                }
              }}
              className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-full glass text-xs font-medium hover:bg-white/10 transition-colors"
            >
              <History className="w-3 h-3" />
              History
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {isTablePage ? (
                <button
                  onClick={() => handleNavigation("/setup")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    "text-muted-foreground hover:bg-white/5 hover:text-primary"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Setup
                </button>
              ) : (
                <Link
                  href="/"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    pathname === "/" || pathname === "/setup"
                      ? "glass text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                  )}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              )}
              <Link
                href="/history"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  pathname === "/history"
                    ? "glass text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                )}
              >
                <History className="w-4 h-4" />
                History
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTablePage && <SettingsDialog />}
            {isTablePage || isSetupPage ? (
              <RulesDialog
                trigger={
                  <Button variant="ghost" size="icon" className="hover:bg-white/10">
                    <Info className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Game Rules</span>
                  </Button>
                }
              />
            ) : (
              <AboutDialog />
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Leaving the table</DialogTitle>
            <DialogDescription>
              Are you sure? Your current game state might be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)} className="glass">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

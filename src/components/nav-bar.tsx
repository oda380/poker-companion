"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/game/SettingsDialog";
import { AboutDialog } from "@/components/about-dialog";
import { Home, History, LogOut } from "lucide-react";
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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
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
              <span className="bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
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
            {!isTablePage && (
              <Link
                href="/history"
                className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-medium hover:bg-secondary/20 transition-colors"
              >
                <History className="w-3 h-3" />
                History
              </Link>
            )}

            <div className="hidden md:flex items-center gap-1">
              {isTablePage ? (
                <button
                  onClick={() => handleNavigation("/setup")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
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
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === "/" || pathname === "/setup"
                      ? "bg-white/10 text-primary"
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
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/history"
                    ? "bg-white/10 text-primary"
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
            <AboutDialog />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leaving the table</DialogTitle>
            <DialogDescription>
              Are you sure? Your current game state might be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
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

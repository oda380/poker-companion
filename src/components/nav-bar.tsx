"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/game/SettingsDialog";
import { AboutDialog } from "@/components/about-dialog";
import { Home, History, LogOut } from "lucide-react";

export function NavBar() {
  const pathname = usePathname();
  const isTablePage = pathname === "/table";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href={isTablePage ? "/setup" : "/"}
            className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Poker Companion
            </span>
          </Link>

          {/* Mobile Exit Button */}
          {isTablePage && (
            <Link
              href="/setup"
              className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
            >
              Exit
            </Link>
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
            <Link
              href={isTablePage ? "/setup" : "/"}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/" || pathname === "/setup"
                  ? "bg-white/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-primary"
              )}
            >
              {isTablePage ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <Home className="w-4 h-4" />
              )}
              {isTablePage ? "Setup" : "Home"}
            </Link>
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
  );
}

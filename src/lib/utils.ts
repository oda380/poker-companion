import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStreetColor(street: string) {
  switch (street) {
    case "preflop": return "bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400";
    case "flop": return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
    case "turn": return "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400";
    case "river": return "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400";
    case "showdown": return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
    // Stud streets
    case "street3": return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
    case "street4": return "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400";
    case "street5": return "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400";
    default: return "bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400";
  }
}

export function getStreetLabel(street: string) {
  switch (street) {
    case "preflop": return "Preflop";
    case "flop": return "Flop";
    case "turn": return "Turn";
    case "river": return "River";
    case "showdown": return "Showdown";
    case "street3": return "3rd Street";
    case "street4": return "4th Street";
    case "street5": return "5th Street";
    default: return street;
  }
}

import { cn } from "@/lib/utils";

interface ChipProps {
    amount: number;
    className?: string;
}

export function Chip({ amount, className }: ChipProps) {
    // Determine color based on amount
    let colorClass = "from-gray-100 to-gray-300 border-gray-400 text-gray-900"; // Default/White $1
    let ringColor = "border-gray-400";

    if (amount >= 1000) {
        colorClass = "from-amber-400 to-amber-600 border-amber-700 text-amber-950"; // Gold $1000
        ringColor = "border-amber-700";
    } else if (amount >= 500) {
        colorClass = "from-purple-500 to-purple-700 border-purple-800 text-white"; // Purple $500
        ringColor = "border-purple-800";
    } else if (amount >= 100) {
        colorClass = "from-slate-800 to-black border-slate-600 text-white"; // Black $100
        ringColor = "border-slate-600";
    } else if (amount >= 25) {
        colorClass = "from-emerald-500 to-emerald-700 border-emerald-800 text-white"; // Green $25
        ringColor = "border-emerald-800";
    } else if (amount >= 5) {
        colorClass = "from-red-500 to-red-700 border-red-800 text-white"; // Red $5
        ringColor = "border-red-800";
    }

    return (
        <div className={cn(
            "relative w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center border-[2px] bg-gradient-to-br select-none",
            colorClass,
            className
        )}>
            {/* Dashed ring pattern */}
            <div className={cn("absolute inset-[2px] rounded-full border border-dashed opacity-60", ringColor)} />
        </div>
    );
}

export function ChipStack({ amount, className }: { amount: number, className?: string }) {
    // Simple visual representation: 1-3 chips based on amount magnitude
    // This is just a visual indicator, not an exact count
    const count = amount === 0 ? 0 : amount < 20 ? 1 : amount < 100 ? 2 : 3;

    if (count === 0) return null;

    return (
        <div className={cn("flex items-center", className)}>
            <div className="relative w-5 h-5 mr-1">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            left: i * 2,
                            top: -i * 2,
                            zIndex: i
                        }}
                    >
                        <Chip amount={amount} />
                    </div>
                ))}
            </div>
            <span className="ml-2 font-bold text-emerald-400 text-lg">{amount}</span>
        </div>
    );
}

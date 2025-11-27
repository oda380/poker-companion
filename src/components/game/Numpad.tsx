import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface NumpadProps {
  value: number;
  onChange: (value: number) => void;
}

export function Numpad({ value, onChange }: NumpadProps) {
  const handleDigit = (digit: number) => {
    const newValue = Number(`${value}${digit}`);
    // Prevent overflow or unrealistic numbers if needed
    if (newValue < 1000000) {
      onChange(newValue);
    }
  };

  const handleBackspace = () => {
    const newValue = Math.floor(value / 10);
    onChange(newValue);
  };

  const handleClear = () => {
    onChange(0);
  };

  return (
    <div className="grid grid-cols-3 gap-2 h-full">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
        <Button
          key={digit}
          variant="outline"
          className="h-14 text-2xl font-bold"
          onClick={() => handleDigit(digit)}
        >
          {digit}
        </Button>
      ))}
      <Button
        variant="outline"
        className="h-14 text-xl font-bold text-destructive"
        onClick={handleClear}
      >
        C
      </Button>
      <Button
        variant="outline"
        className="h-14 text-2xl font-bold"
        onClick={() => handleDigit(0)}
      >
        0
      </Button>
      <Button variant="outline" className="h-14" onClick={handleBackspace}>
        <Delete className="w-6 h-6" />
      </Button>
    </div>
  );
}

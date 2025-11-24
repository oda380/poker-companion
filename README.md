# Poker Companion

A modern, premium poker table management application built with Next.js. Track hands, manage players, and run live poker games for both Texas Hold'em and 5-Card Stud variants.

## Features

### Game Variants
- **Texas Hold'em**: Full support for ring games and heads-up play with correct blind positions and action order
- **5-Card Stud**: Classic stud poker with face-up and face-down card tracking

### Premium Design
- 🎨 **Modern UI**: Dark theme with vibrant accents and smooth transitions
- 🎴 **Polished Cards**: Professional card design with suit symbols, colors, and paper textures
- 🪙 **Visual Chip Stacks**: Color-coded chips with depth effects (Red $5, Green $25, Black $100, Purple $500, Gold $1000)
- 🎯 **Dealer Button**: Realistic white puck design with beveled edges
- ✨ **Smooth Animations**: Framer Motion-powered transitions and layout animations

### Game Management
- **Player Tracking**: Manage player stacks, seats, and statuses
- **Betting Rounds**: Robust betting logic with proper round completion
- **Pot Tracking**: Accurate pot calculation and display across streets
- **Hand History**: Complete record of all hands played
- **Undo/Redo**: Powered by Zundo for temporal state management

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **State Management**: Zustand with temporal (undo/redo) support
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/oda380/poker-companion.git
cd poker-companion

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. **Setup**: Navigate to `/setup` to configure your table (game variant, blinds, players)
2. **Table**: Start playing at `/table` - the app will guide you through:
   - Dealer selection
   - Initial card dealing
   - Betting rounds
   - Community cards (Hold'em) or additional cards (Stud)
   - Showdown

### Controls
- **Fold**: Exit the current hand
- **Check**: Pass action (when no bet is required)
- **Call/Raise**: Match or increase the current bet
- **Undo**: Revert the last action (accessible via menu)

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── game/        # Game-specific components (Cards, Controls, etc.)
│   └── ui/          # Reusable UI components (shadcn/ui)
├── lib/             # Core game logic and utilities
│   ├── game-logic.ts    # Hand initialization and action processing
│   ├── deck.ts          # Card deck utilities
│   └── pot-calculator.ts # Pot calculation logic
├── store/           # Zustand state management
└── types.ts         # TypeScript type definitions
```

## Known Limitations (MVP)

- **Side Pots**: Not yet implemented - all bets go to a single main pot
- **Hand Evaluation**: Showdown currently awards pot to first remaining player (hand strength evaluation coming soon)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and not licensed for public use.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

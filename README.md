# Poker Companion (v1.7.1)

A professional-grade poker dealer assistant designed for home games. Host your own Texas Hold'em or 5-Card Stud games using a single device (tablet/laptop) as the table manager.

![Poker Companion Hero](https://placehold.co/1200x600/1e293b/ffffff?text=Poker+Companion+v1.7.1)

## 🌟 Features

### 📱 PWA & Offline First

- **Installable**: Add to Home Screen on iOS and Android for a native app experience.
- **Offline Capable**: Works fully offline with a robust "Network First" caching strategy.
- **Auto-Update**: Automatically fetches the latest version when online.

### 🎮 Game Modes

- **Texas Hold'em**: Full support for ring games and heads-up play with correct blind positions and action order.
- **5-Card Stud**: Classic stud poker support with face-up/face-down card tracking.
- **Resume Game**: Smart session recovery lets you pick up exactly where you left off, even after closing the app.
- **Visual Hand Rankings**: Built-in reference guide with visual card examples for all poker hands.

### 💎 Premium Experience

- **Production Design**: Deep slate/navy aesthetic with emerald accents and glassmorphism UI.
- **Advanced Animations**:
  - 🃏 **3D Card Flips**: Realistic CSS-based card reveal animations.
  - 🪙 **Chip Toss**: Dynamic chip animations flying from players to the pot.
  - 🟢 **Active Pulse**: Glowing indicators for the current player.
- **Dark Mode**: Fully supported with system preference detection.

### 🛠️ Dealer Tools

- **Session Persistence**: Games are automatically saved to local storage (IndexedDB).
- **History Management**:
  - **Export/Import**: Backup your game history or transfer it to another device.
  - **Mobile Layout**: Stacked headers for better readability on small screens.
- **Dynamic Settings**:
  - Add/Remove players mid-game.
  - Adjust blinds and antes on the fly.
  - Toggle themes (Light/Dark/System).
- **Undo/Redo**: Mistake-proof your game with full state rollback capabilities.

## 🚀 Use Case: "The Dealer Companion"

This app is designed to be used on a **single shared device** (like an iPad or Laptop) placed at the poker table.

- **The Dealer** (or players taking turns) inputs actions.
- **The App** handles the math, pot calculations, dealer button rotation, and blind levels.
- **No Internet Required**: Works fully offline once loaded.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS 4 + OKLCH Colors
- **State**: Zustand + Zundo (Undo/Redo)
- **Persistence**: Dexie.js (IndexedDB) + Persist Middleware
- **Animations**: Framer Motion + Canvas Confetti
- **Logic**: Custom poker engine + `poker-evaluator`

## 📦 Getting Started

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

### Deployment

This app is optimized for Vercel.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Deploy! (No environment variables required for basic usage).

## 📝 Project Structure

```
src/
├── app/              # Next.js App Router
├── components/       # React Components
│   ├── game/         # Poker-specific (Card, Chip, PlayerRow)
│   └── ui/           # Design System (Buttons, Dialogs, etc.)
├── lib/              # Core Logic
│   ├── game-logic.ts # State machine & rules engine
│   └── hand-evaluator.ts # Winner determination
├── store/            # Zustand Store (State & Persistence)
└── types.ts          # TypeScript Definitions
```

## ⚠️ Known Limitations (v1.7.1)

- **Side Pots**: Currently, all bets go to a single main pot. Side pot logic is planned for v2.
- **Multiplayer Sync**: This is a **local-only** tool. Players cannot join from their own phones to see hole cards (yet).

## 📄 License

Private / Proprietary.

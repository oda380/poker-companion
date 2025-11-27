export const APP_VERSION = "1.7.0";

export const DEFAULT_STACK = 1000;

export const GAME_VARIANTS = {
  TEXAS_HOLDEM: {
    id: "texasHoldem",
    label: "Texas Hold'em",
    shortLabel: "Hold'em",
  },
  FIVE_CARD_STUD: {
    id: "fiveCardStud",
    label: "5-Card Stud",
    shortLabel: "Stud",
  },
} as const;

export const DEVELOPER_INFO = {
  NAME: "Kitaek Lim",
  EMAIL: "ktlim380@yahoo.com",
  GITHUB_URL: "https://github.com/oda380/",
} as const;

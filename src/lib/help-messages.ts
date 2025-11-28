export type HelpMessageId = "player-modification-timing";
// Future messages:
// | "side-pots-explanation"
// | "stud-card-face-up"
// | "heads-up-blind-rules"

export interface HelpMessage {
  id: HelpMessageId;
  title: string;
  content: string;
  icon?: string;
  defaultEnabled: boolean;
}

export const HELP_MESSAGES: Record<HelpMessageId, HelpMessage> = {
  "player-modification-timing": {
    id: "player-modification-timing",
    title: "You can add/remove players now",
    content:
      "Players can only be added or removed between hands, not during active play.",
    icon: "ℹ️",
    defaultEnabled: true,
  },
};

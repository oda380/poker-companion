import { HelpMessageId, HELP_MESSAGES } from "@/lib/help-messages";
import { useHelpMessage } from "@/hooks/useHelpMessage";
import { useGlobalHelpToggle } from "@/hooks/useGlobalHelpToggle";

interface HelpBannerProps {
  messageId: HelpMessageId;
  condition?: boolean; // Extra condition (e.g., between hands)
}

export function HelpBanner({ messageId, condition = true }: HelpBannerProps) {
  const { isEnabled: globalEnabled } = useGlobalHelpToggle();
  const { isEnabled, dismiss } = useHelpMessage(messageId);
  const message = HELP_MESSAGES[messageId];

  if (!globalEnabled || !isEnabled || !condition) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 flex items-start gap-3">
      {message.icon && <span className="text-lg">{message.icon}</span>}
      <div className="flex-1 space-y-2">
        <div>
          <p className="text-sm font-medium text-emerald-900 dark:text-white">
            {message.title}
          </p>
          <p className="text-xs text-emerald-800 dark:text-slate-200 mt-1">
            {message.content}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={dismiss}
            className="px-2 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
          >
            Dismiss
          </button>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
            Re-enable in Settings → About
          </span>
        </div>
      </div>
    </div>
  );
}

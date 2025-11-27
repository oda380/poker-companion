import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Extend Window interface to include non-standard properties
interface ExtendedWindow extends Window {
  MSStream?: unknown;
}

interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const win = window as ExtendedWindow;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !win.MSStream;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(isIOSDevice);

    // Check if already installed
    const nav = window.navigator as ExtendedNavigator;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      !!nav.standalone ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isIOS: isIOS && !isInstalled,
    isInstalled,
    install,
  };
}

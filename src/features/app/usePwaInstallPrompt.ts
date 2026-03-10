import { useEffect, useState } from "react";

import type { BeforeInstallPromptEvent } from "@/types/pricing";

export function usePwaInstallPrompt() {
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    if (!isAndroid) return;

    const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches;
    if (isStandalone) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const dismissed = window.localStorage.getItem("pwa-install-hint-dismissed") === "1";
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      if (!dismissed) setShowInstallHint(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallApp() {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstallHint(false);
    }
    setDeferredInstallPrompt(null);
  }

  function handleDismissInstallHint() {
    setShowInstallHint(false);
    window.localStorage.setItem("pwa-install-hint-dismissed", "1");
  }

  return {
    deferredInstallPrompt,
    showInstallHint,
    handleInstallApp,
    handleDismissInstallHint,
  };
}

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallWindow = Window & { __atharInstall?: InstallPrompt | null };

let listening = false;
let prompting = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function storedPrompt() {
  if (typeof window === "undefined") return null;
  return (window as InstallWindow).__atharInstall ?? null;
}

function ensureInstall() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (prompting) return;
    (window as InstallWindow).__atharInstall = event as InstallPrompt;
    notify();
  });
  window.addEventListener("athar-install-ready", notify);
  window.addEventListener("appinstalled", () => {
    (window as InstallWindow).__atharInstall = null;
    notify();
  });
}

function installedAlready() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

async function openInstall(event: InstallPrompt) {
  prompting = true;
  (window as InstallWindow).__atharInstall = null;
  notify();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome === "accepted";
  } finally {
    prompting = false;
  }
}

export function InstallButton({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("nav");
  const [installed, setInstalled] = useState(false);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    ensureInstall();
    const sync = () => {
      setInstalled(installedAlready());
      setReady(storedPrompt() !== null);
    };
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  if (installed) return null;

  function install() {
    const event = storedPrompt();
    if (event) {
      setHint("");
      void openInstall(event).then((accepted) => {
        if (accepted) setInstalled(true);
      }).catch(() => {
        setHint(t("installHelp"));
      });
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("athar-install-ready", onReady);
      const next = storedPrompt();
      if (!next) {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setHint(ios ? t("installIos") : t("installHelp"));
        return;
      }
      setHint("");
      void openInstall(next).then((accepted) => {
        if (accepted) setInstalled(true);
      }).catch(() => {
        setHint(t("installHelp"));
      });
    };
    const onReady = () => finish();
    const timer = window.setTimeout(finish, 2500);
    window.addEventListener("athar-install-ready", onReady);
  }

  return (
    <div className={compact ? "install-wrap" : "grid gap-2"}>
      <button type="button" className={className || "btn btn-primary"} data-ready={ready} onClick={install}>
        {compact ? t("installShort") : t("install")}
      </button>
      {hint && !compact ? (
        <p className="text-sm font-bold" role="status">
          {hint}
        </p>
      ) : null}
      {hint && compact ? createPortal(<p className="install-hint" role="status">{hint}</p>, document.body) : null}
    </div>
  );
}

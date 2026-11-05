"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { InstallButton } from "@/components/chrome/InstallButton";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

const links = [
  { href: "/", key: "home" },
  { href: "/volunteer", key: "volunteer" },
  { href: "/teams", key: "teams" },
  { href: "/updates", key: "updates" },
  { href: "/game", key: "game" },
  { href: "/admin", key: "admin" },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"day" | "night">("day");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "night" ? "night" : "day");
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname, locale]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleTheme() {
    const next = theme === "night" ? "day" : "night";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("athar-theme", next);
    setTheme(next);
  }

  function switchLocale() {
    router.replace(pathname, { locale: locale === "ar" ? "en" : "ar" });
  }

  return (
    <header className="site-header">
      <div className="shell flex h-16 items-center justify-between gap-2 sm:h-[4.5rem] sm:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 no-underline sm:gap-3">
          <span className="grid h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-line sm:h-12 sm:w-12">
            <Image
              src="/brand/athar-logo.jpg"
              alt=""
              width={96}
              height={96}
              priority
              className="mark-crop h-full w-full"
            />
          </span>
          <span className="leading-none">
            <strong className="block text-base tracking-[0.12em] sm:text-lg sm:tracking-[0.18em]">ATHAR</strong>
            <span className="text-sm text-muted">أثر</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label={t("home")}>
          {links.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              data-active={isCurrent(pathname, item.href)}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <InstallButton compact className="btn btn-primary !px-3 !py-2 text-xs sm:!px-4 sm:text-sm" />
          <button type="button" className="icon-btn grid text-xs font-extrabold sm:hidden" onClick={switchLocale}>
            {locale === "ar" ? "EN" : "ع"}
          </button>
          <button type="button" className="btn btn-line desktop-only !px-3 !py-2" onClick={switchLocale}>
            {locale === "ar" ? t("toEnglish") : t("toArabic")}
          </button>
          <button
            type="button"
            className="icon-btn grid"
            onClick={toggleTheme}
            aria-label={theme === "night" ? t("day") : t("night")}
          >
            {theme === "night" ? "☀" : "☾"}
          </button>
          <button
            type="button"
            className="icon-btn grid lg:hidden"
            aria-expanded={open}
            aria-label={open ? t("close") : t("open")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="overflow-hidden border-t border-line lg:hidden"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="shell grid gap-2 py-4" aria-label={t("open")}>
              {links.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link flex min-h-12 items-center text-lg" data-active={isCurrent(pathname, item.href)}>
                  {t(item.key)}
                </Link>
              ))}
              <InstallButton className="btn btn-primary mt-2 w-full" />
              <button type="button" className="btn btn-line justify-self-start" onClick={switchLocale}>
                {locale === "ar" ? t("toEnglish") : t("toArabic")}
              </button>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

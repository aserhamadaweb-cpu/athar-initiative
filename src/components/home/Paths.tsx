"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function Paths() {
  const t = useTranslations("home");
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<"online" | "offline">("online");
  const points = t.raw(open === "online" ? "onlinePoints" : "offlinePoints") as string[];

  return (
    <section className="shell py-16" id="paths">
      <div className="max-w-2xl">
        <p className="kicker">{t("pathsKicker")}</p>
        <h2 className="display mt-3 text-4xl md:text-5xl">
          {t("pathsTitle")} <em>{t("pathsEm")}</em>
        </h2>
        <p className="mt-4 text-lg text-muted">{t("pathsLead")}</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <PathCard
          active={open === "online"}
          title={t("onlineTitle")}
          subtitle={t("onlineSub")}
          points={open === "online" ? points : []}
          reduce={Boolean(reduce)}
          onOpen={() => setOpen("online")}
        />
        <PathCard
          active={open === "offline"}
          title={t("offlineTitle")}
          subtitle={t("offlineSub")}
          points={open === "offline" ? points : []}
          reduce={Boolean(reduce)}
          onOpen={() => setOpen("offline")}
        />
      </div>
    </section>
  );
}

function PathCard({
  active,
  title,
  subtitle,
  points,
  reduce,
  onOpen,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  points: string[];
  reduce: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={active}
      className={`panel path-card shine lift p-6 text-start ${active ? "path-card-on" : ""}`}
    >
      <h3 className="text-2xl font-extrabold">{title}</h3>
      <p className="mt-3 text-muted">{subtitle}</p>
      <AnimatePresence initial={false}>
        {active ? (
          <motion.ul
            key={title}
            className="mt-5 grid gap-2"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-leaf" />
                <span>{point}</span>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </button>
  );
}

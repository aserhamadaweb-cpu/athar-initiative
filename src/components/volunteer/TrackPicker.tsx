"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function TrackPicker() {
  const t = useTranslations("volunteer");
  const reduce = useReducedMotion();
  const [active, setActive] = useState<"offline" | "online">("offline");
  const points = t.raw(`tracks.${active}.points`) as string[];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["offline", "online"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="track-tab"
            data-active={active === id}
            onClick={() => setActive(id)}
          >
            {t(`tracks.${id}.title`)}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={active}
          className="panel mt-5 p-6 md:p-8"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="kicker">{t(`tracks.${active}.subtitle`)}</p>
          <p className="mt-4 text-lg leading-8">{t(`tracks.${active}.intro`)}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-extrabold">{t("doTitle")}</h3>
              <ul className="mt-3 grid gap-2">
                {points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-leaf" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-extrabold">{t("whyTitle")}</h3>
              <p className="mt-3 leading-8 text-muted">{t(`tracks.${active}.why`)}</p>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

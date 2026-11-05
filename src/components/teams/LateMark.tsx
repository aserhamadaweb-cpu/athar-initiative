"use client";

import { useTranslations } from "next-intl";

export function LateMark({ count }: { count?: number }) {
  const t = useTranslations("org");
  return <span className="org-late">{count === undefined ? t("late") : t("lateCount", { count })}</span>;
}

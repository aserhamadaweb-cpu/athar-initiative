import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ImpactGame } from "@/components/game/ImpactGame";
import { isLocale } from "@/i18n/routing";

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("game");

  return (
    <>
      <header className="shell pb-4 pt-14">
        <div className="panel stage-card wash-leaf p-5 sm:p-8">
          <p className="kicker">{t("kicker")}</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{t("lead")}</p>
        </div>
      </header>
      <section className="shell py-6">
        <ImpactGame />
      </section>
    </>
  );
}

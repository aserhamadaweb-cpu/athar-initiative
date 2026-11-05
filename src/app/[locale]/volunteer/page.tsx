import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { BestMembers } from "@/components/volunteer/BestMembers";
import { TrackPicker } from "@/components/volunteer/TrackPicker";
import { isLocale } from "@/i18n/routing";
import { getSiteLinks, linkText } from "@/lib/site-links";

export default async function VolunteerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("volunteer");
  const site = await getSiteLinks();
  const forms = t.raw("forms") as { id: "organizer" | "leaders" | "offline" | "online"; title: string; note: string }[];
  const formKeys = {
    organizer: "form_organizer",
    leaders: "form_leaders",
    offline: "form_offline",
    online: "form_online",
  } as const;
  const faq = t.raw("faq") as { q: string; a: string }[];

  return (
    <>
      <header className="shell pb-6 pt-14">
        <div className="panel stage-card wash-gold p-5 sm:p-8 md:p-10">
          <p className="kicker">{t("kicker")}</p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            {t("title")} <em>{t("titleEm")}</em>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{t("lead")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a className="btn btn-primary w-full sm:w-auto" href={site.form_offline.url} target="_blank" rel="noreferrer">{t("joinNow")}</a>
            <a className="btn btn-line w-full sm:w-auto" href={site.whatsapp_channel.url} target="_blank" rel="noreferrer">{t("whatsapp")}</a>
          </div>
        </div>
      </header>

      <section className="shell py-8">
        <TrackPicker />
      </section>

      <section className="shell grid gap-4 py-6 md:grid-cols-3">
        <article className="panel shine lift p-6">
          <p className="kicker">{t("whenKicker")}</p>
          <p className="mt-4 text-3xl font-extrabold">{t("ageVolunteer")}</p>
          <p className="text-muted">{t("ageVolunteerNote")}</p>
          <p className="mt-4 text-3xl font-extrabold">{t("ageStudents")}</p>
          <p className="text-muted">{t("ageStudentsNote")}</p>
        </article>
        <article className="panel shine lift p-6">
          <h2 className="text-2xl font-extrabold">{t("stemTitle")}</h2>
          <p className="mt-3 leading-7 text-muted">{t("stemBody")}</p>
          <a className="btn btn-line mt-5" href={site.form_leaders.url} target="_blank" rel="noreferrer">{t("stemCta")}</a>
        </article>
        <article className="panel shine lift p-6">
          <h2 className="text-2xl font-extrabold">{t("branchesTitle")}</h2>
          <p className="mt-3 leading-7 text-muted">{t("branchesBody")}</p>
          <a className="btn btn-line mt-5" href={site.governorates.url} target="_blank" rel="noreferrer">{t("branchesCta")}</a>
        </article>
      </section>

      <section className="shell py-10">
        <p className="kicker">{t("formsKicker")}</p>
        <h2 className="display mt-3 text-4xl">{t("formsTitle")}</h2>
        <p className="mt-3 max-w-2xl text-muted">{t("formsLead")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {forms.map((form, index) => {
            const row = site[formKeys[form.id]];
            const note = linkText(row, locale, "note") || form.note;
            return (
              <a key={form.id} className="panel form-card shine lift block p-6 pe-14 no-underline" href={row.url} target="_blank" rel="noreferrer">
                <p className="serif text-gold-deep">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-2xl font-extrabold">{linkText(row, locale, "label")}</h3>
                <p className="mt-2 text-muted">{note}</p>
                <span className="mt-4 inline-block font-bold text-gold-deep">{t("openForm")}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="shell py-8">
        <p className="kicker">{t("membersKicker")}</p>
        <h2 className="display mt-3 text-4xl">{t("membersTitle")}</h2>
        <p className="mt-3 max-w-2xl text-muted">{t("membersLead")}</p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-muted">{t("membersLoading")}</p>}>
            <BestMembers />
          </Suspense>
        </div>
      </section>

      <section className="faq shell py-10">
        <p className="kicker">{t("faqKicker")}</p>
        <h2 className="display mt-3 text-4xl">{t("faqTitle")}</h2>
        <p className="mt-3 text-muted">{t("faqLead")}</p>
        <div className="mt-4">
          {faq.map((item) => (
            <Reveal key={item.q}>
              <details>
                <summary>{item.q}</summary>
                <p className="mt-3 leading-8 text-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewsStrip } from "@/components/content/NewsList";
import { HeroMark } from "@/components/home/HeroMark";
import { MessageForm } from "@/components/home/MessageForm";
import { Paths } from "@/components/home/Paths";
import { ReadingMap } from "@/components/home/ReadingMap";
import { Rise } from "@/components/motion/PageFade";
import { Reveal } from "@/components/motion/Reveal";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { getSiteLinks } from "@/lib/site-links";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const verbs = t.raw("verbs") as { word: string; note: string }[];
  const values = t.raw("values") as { title: string; body: string }[];
  const areas = t.raw("areas") as { title: string; body: string }[];
  const spaces = t.raw("spaces") as { title: string; body: string }[];
  const marquee = t.raw("marquee") as string[];
  const site = await getSiteLinks();

  return (
    <>
      <section className="shell grid items-center gap-6 pb-8 pt-8 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:pt-16">
        <div>
          <Rise>
            <p className="kicker">{t("kicker")}</p>
            <h1 className="display hero-title mt-4 text-5xl md:text-7xl">
              {t("title")}
              <br />
              <em>{t("titleEm")}</em>
            </h1>
          </Rise>
          <Rise delay={0.12}>
            <p className="mt-6 max-w-xl text-lg leading-8">{t("lead")}</p>
            <p className="mt-4 max-w-xl text-muted">{t("hello")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a className="btn btn-primary w-full sm:w-auto" href="#story">{t("storyCta")}</a>
              <Link className="btn btn-line w-full sm:w-auto" href="/volunteer">{t("joinCta")}</Link>
            </div>
          </Rise>
        </div>
        <Rise delay={0.18}>
          <div className="hero-stage">
            <span className="spark s1" />
            <span className="spark s2" />
            <span className="spark s3" />
            <HeroMark />
          </div>
        </Rise>
      </section>

      <ReadingMap
        label={t("kicker")}
        steps={[
          { id: "story", index: "01", label: t("storyKicker") },
          { id: "paths", index: "02", label: t("pathsKicker") },
          { id: "areas", index: "03", label: t("areasKicker") },
          { id: "join", index: "04", label: t("joinKicker") },
        ]}
      />

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...marquee, ...marquee].map((item, index) => (
            <span className="marquee-item" key={`${item}-${index}`}>
              <i />
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="shell grid gap-8 py-10 md:grid-cols-[0.9fr_1.1fr] md:py-16" id="story">
        <Reveal>
          <p className="kicker">{t("storyKicker")}</p>
          <h2 className="display ruled mt-3 text-4xl md:text-5xl">
            {t("storyTitle")} <em>{t("storyEm")}</em>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="story-copy grid gap-4 text-lg leading-8">
            <p>{t("storyP1")}</p>
            <p>{t("storyP2")}</p>
            <p className="font-extrabold">{t("storyP3")}</p>
          </div>
        </Reveal>
      </section>

      <section className="shell grid gap-4 pb-8 md:grid-cols-3">
        {verbs.map((verb, index) => (
          <Reveal
            key={verb.word}
            delay={index * 0.06}
            className={`panel verb-card shine lift p-6 ${["wash-gold", "wash-sky", "wash-leaf"][index % 3]}`}
          >
            <span className="card-ghost" aria-hidden="true">{verb.word}</span>
            <p className="display text-4xl">{verb.word}</p>
            <p className="mt-2 text-muted">{verb.note}</p>
          </Reveal>
        ))}
      </section>

      <Paths />

      <section className="shell py-8">
        <Reveal>
          <p className="kicker">{t("valuesKicker")}</p>
          <h2 className="display ruled mt-3 max-w-3xl text-4xl md:text-5xl">
            {t("valuesTitle")} <em>{t("valuesEm")}</em>
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{t("valuesLead")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {values.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.06} className={`panel shine lift p-6 ${["wash-gold", "wash-sky", "wash-leaf"][index % 3]}`}>
              <p className="serif text-gold-deep">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-2xl font-extrabold">{value.title}</h3>
              <p className="mt-3 leading-7 text-muted">{value.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell py-12" id="areas">
        <Reveal>
          <p className="kicker">{t("areasKicker")}</p>
          <h2 className="display ruled mt-3 text-4xl md:text-5xl">
            {t("areasTitle")} <em>{t("areasEm")}</em>
          </h2>
          <p className="mt-4 max-w-2xl text-muted">{t("areasLead")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {areas.map((area, index) => (
            <Reveal
              key={area.title}
              delay={index * 0.05}
              className={`panel shine lift p-6 ${["wash-gold md:col-span-4", "wash-sky md:col-span-2", "wash-leaf md:col-span-2", "wash-sky md:col-span-2", "wash-gold md:col-span-2", "wash-leaf md:col-span-6"][index] ?? "md:col-span-2"}`}
            >
              <p className="serif text-gold-deep">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-2xl font-extrabold">{area.title}</h3>
              <p className="mt-3 leading-7 text-muted">{area.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell py-8">
        <Reveal>
          <p className="kicker">{t("spacesKicker")}</p>
          <h2 className="display ruled mt-3 text-4xl md:text-5xl">
            {t("spacesTitle")} <em>{t("spacesEm")}</em>
          </h2>
          <p className="mt-4 max-w-2xl text-muted">{t("spacesLead")}</p>
        </Reveal>
        <div className="timeline mt-8">
          {spaces.map((space, index) => (
            <Reveal key={space.title} delay={index * 0.05} className="timeline-item">
              <span className="timeline-index">{index + 1}</span>
              <div className="pb-2 pt-1">
                <h3 className="text-xl font-extrabold">{space.title}</h3>
                <p className="mt-1 text-muted">{space.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell py-12">
        <Reveal className="panel wash-leaf shine lift grid items-center gap-6 overflow-hidden p-5 sm:p-8 md:grid-cols-[1.2fr_auto] md:p-12">
          <div>
            <p className="kicker">{t("gameKicker")}</p>
            <h2 className="display mt-3 text-4xl">{t("gameTitle")}</h2>
            <p className="mt-3 max-w-xl text-muted">{t("gameLead")}</p>
          </div>
          <div className="grid justify-items-start gap-4">
            <div className="seed-row" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
            <Link className="btn btn-primary" href="/game">{t("gameCta")}</Link>
          </div>
        </Reveal>
      </section>

      <Suspense fallback={<section className="shell py-8 text-muted">{t("newsKicker")}</section>}>
        <NewsStrip />
      </Suspense>

      <MessageForm />

      <section className="shell py-12" id="join">
        <Reveal className="panel join-band p-5 sm:p-8 md:p-12">
          <p className="kicker">{t("joinKicker")}</p>
          <h2 className="display mt-3 text-4xl md:text-6xl">
            {t("joinTitle")} <em>{t("joinEm")}</em>
          </h2>
          <p className="join-lead mt-4 max-w-xl">{t("joinLead")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className="btn join-main w-full sm:w-auto" href="/volunteer">{t("joinVolunteer")}</Link>
            <a className="btn join-ghost w-full sm:w-auto" href={site.whatsapp_channel.url} target="_blank" rel="noreferrer">
              {t("joinChannel")}
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}

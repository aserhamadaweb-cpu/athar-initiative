import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { leaveMembers } from "@/app/actions/members";
import { JoinForm } from "@/components/teams/JoinForm";
import { TeamsBoard } from "@/components/teams/TeamsBoard";
import { isLocale } from "@/i18n/routing";
import { readMemberSession } from "@/lib/admin-session";
import { getOrgBoard } from "@/lib/supabase";

async function MembersBoard() {
  const t = await getTranslations("org");
  const joined = await readMemberSession();
  if (!joined) return <JoinForm />;
  const teams = await getOrgBoard();

  return (
    <div className="grid gap-4">
      <form action={leaveMembers} className="flex justify-end">
        <button className="btn btn-line">{t("leave")}</button>
      </form>
      <TeamsBoard teams={teams} />
    </div>
  );
}

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("org");

  return (
    <>
      <header className="shell pb-4 pt-14">
        <div className="panel stage-card wash-gold p-5 sm:p-8 md:p-10">
          <p className="kicker">{t("kicker")}</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">
            {t("title")} <em>{t("titleEm")}</em>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{t("lead")}</p>
        </div>
      </header>
      <section className="shell py-8">
        <Suspense fallback={<p className="text-muted">{t("loading")}</p>}>
          <MembersBoard />
        </Suspense>
      </section>
    </>
  );
}

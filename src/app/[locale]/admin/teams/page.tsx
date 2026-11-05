import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TeamsDesk } from "@/components/admin/TeamsDesk";
import { LoginForm } from "@/components/admin/LoginForm";
import { isLocale } from "@/i18n/routing";
import { loadAdminData } from "@/lib/admin-data";
import { readAdminSession } from "@/lib/admin-session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "admin" });
  return {
    title: t("teamsDesk"),
    robots: { index: false, follow: false },
  };
}

async function Screen() {
  const signedIn = await readAdminSession();
  if (!signedIn) return <LoginForm />;
  const data = await loadAdminData();
  return <TeamsDesk teams={data.org} error={data.error} />;
}

export default async function AdminTeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <Suspense fallback={<p className="shell py-16 text-muted">{t("loading")}</p>}>
      <Screen />
    </Suspense>
  );
}

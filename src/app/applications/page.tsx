"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

type WhitelistApplication = {
  id: string;
  inGameName: string;
  status: string;
  createdAt: string;
};

type StaffApplication = {
  id: string;
  status: string;
  createdAt: string;
};

function getStatusLabel(status: string) {
  if (status === "approved") return "Kinnitatud";
  if (status === "rejected") return "Tagasi lükatud";
  if (status === "device_check") return "Seadmekontroll";
  return "Ülevaatamisel";
}

function getStatusClassName(status: string) {
  if (status === "approved") {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30";
  }
  if (status === "rejected") {
    return "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30";
  }
  if (status === "device_check") {
    return "bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-500/30";
  }
  return "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30";
}

function MyApplicationsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "staff" ? "staff" : "whitelist";

  const [whitelistApps, setWhitelistApps] = useState<Array<WhitelistApplication>>(new Array());
  const [staffApps, setStaffApps] = useState<Array<StaffApplication>>(new Array());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/applications");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/staff-applications").then((r) => r.json()),
    ])
      .then(([wl, staff]) => {
        if (Array.isArray(wl)) setWhitelistApps(wl);
        if (Array.isArray(staff)) setStaffApps(staff);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-400">Avalduste laadimine...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        {/* ÜLEMINE PÄIS */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl">
          <div>
            <span className="inline-block rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-400">
              Ajalugu ja staatus
            </span>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Minu avaldused
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Jälgi oma esitatud whitelist- ja meeskonna avalduste olekut.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/apply"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:border-white/30 hover:bg-white/10"
            >
              + Uus whitelist avaldus
            </Link>
            <Link
              href="/apply/staff"
              className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500"
            >
              + Kandideeri meeskonda
            </Link>
          </div>
        </div>

        {/* VAHEKAARDID: WHITELIST JA MEESKOND */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          <Link
            href="/applications"
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "whitelist"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            Whitelist ({whitelistApps.length})
          </Link>
          <Link
            href="/applications?tab=staff"
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
              tab === "staff"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            Meeskond ({staffApps.length})
          </Link>
        </div>

        {/* AVALDUSTE NIMEKIRI */}
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-8 text-center text-sm text-zinc-400 backdrop-blur-xl">
            Andmete laadimine...
          </div>
        ) : tab === "staff" ? (
          staffApps.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-10 text-center shadow-xl backdrop-blur-xl">
              <p className="text-sm text-zinc-400">
                Sa ei ole veel ühtegi meeskonna avaldust esitanud.
              </p>
              <Link
                href="/apply/staff"
                className="mt-4 inline-block rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
              >
                Kandideeri meeskonda →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {staffApps.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/55 p-5 shadow-lg backdrop-blur-xl transition hover:border-white/20"
                >
                  <div>
                    <p className="text-base font-bold text-white">
                      Meeskonna avaldus
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Esitatud {new Date(app.createdAt).toLocaleDateString("et-EE")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(app.status)}`}
                  >
                    {getStatusLabel(app.status)}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : whitelistApps.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-10 text-center shadow-xl backdrop-blur-xl">
            <p className="text-sm text-zinc-400">
              Sa ei ole veel ühtegi whitelist-avaldust esitanud.
            </p>
            <Link
              href="/apply"
              className="mt-4 inline-block rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
            >
              Esita esimene avaldus →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {whitelistApps.map((app) => (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/55 p-5 shadow-lg backdrop-blur-xl transition hover:border-white/20"
              >
                <div>
                  <p className="text-base font-bold text-white">
                    {app.inGameName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Esitatud {new Date(app.createdAt).toLocaleDateString("et-EE")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(app.status)}`}
                >
                  {getStatusLabel(app.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-zinc-400">Laadimine...</p>
        </div>
      }
    >
      <MyApplicationsContent />
    </Suspense>
  );
}

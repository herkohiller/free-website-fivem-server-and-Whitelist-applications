"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type LeadershipConfig = {
  discordId: string;
  role: string;
  quote: string;
  fallbackName?: string;
};

// 👇 LISA SIIA OMA JUHATUSE DISCORDI ID-D, ROLLID JA TSITAADID:
const LEADERSHIP_MEMBERS: LeadershipConfig[] = [
  {
    discordId: "123456789012345678",
    role: "Omanik & Arendaja",
    quote: "Aju tühi, server täis.",
    fallbackName: "Juhatuse liige 1",
  },
  {
    discordId: "234567890123456789",
    role: "Omanik & Arendaja",
    quote: "Vaba aeg on mu kõige suurem opp.",
    fallbackName: "Juhatuse liige 2",
  },
  {
    discordId: "345678901234567890",
    role: "Peaadministraator",
    quote: "Olen luuraja.",
    fallbackName: "Juhatuse liige 3",
  },
  {
    discordId: "456789012345678901",
    role: "Peaadministraator",
    quote: "Uks kinni, aken lahti.",
    fallbackName: "Juhatuse liige 4",
  },
];

// Kui palju on veel meeskonnaliikmeid peale juhatuse (kuvatakse juhatuse all)
const EXTRA_STAFF_COUNT = 6;

type ResolvedLeader = LeadershipConfig & {
  username: string;
  avatar: string | null;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const [leaders, setLeaders] = useState<ResolvedLeader[]>(
    LEADERSHIP_MEMBERS.map((m) => ({
      ...m,
      username: m.fallbackName ?? "Laadimine...",
      avatar: null,
    }))
  );

  useEffect(() => {
    let active = true;

    async function fetchDiscordProfiles() {
      const results = await Promise.all(
        LEADERSHIP_MEMBERS.map(async (member) => {
          try {
            const res = await fetch(
              `/api/members/lookup?discordId=${encodeURIComponent(member.discordId)}`
            );
            if (!res.ok) {
              return {
                ...member,
                username: member.fallbackName ?? "Teadmata",
                avatar: null,
              };
            }
            const data = (await res.json()) as {
              username?: string | null;
              avatar?: string | null;
            };
            return {
              ...member,
              username: data.username || member.fallbackName || "Teadmata",
              avatar: data.avatar ?? null,
            };
          } catch {
            return {
              ...member,
              username: member.fallbackName ?? "Teadmata",
              avatar: null,
            };
          }
        })
      );

      if (active) {
        setLeaders(results);
      }
    }

    void fetchDiscordProfiles();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white">
      {/* Taustapilt koos tumeda hajutusega */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 blur-[2px]"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/85 to-zinc-950" />

      {/* 1. ÜLEMINE VAADE (HERO) */}
      <section className="relative z-10 flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Suur pealkiri */}
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-white">STREETS OF </span>
            <span className="text-orange-500">SAN ANDREAS</span>
          </h1>

          {/* Tsitaat / alapealkiri */}
          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-3 text-sm italic text-zinc-300 sm:text-base">
            <span className="h-5 w-0.5 shrink-0 bg-orange-500" />
            <p>&ldquo;Sinu lugu, sinu valikud, sinu linn — liitu meiega juba täna!&rdquo;</p>
            <span className="h-5 w-0.5 shrink-0 bg-orange-500" />
          </div>

          {/* Info- ja tegevuskast (sarnane statistika-kaardile) */}
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-orange-500/20 bg-zinc-900/75 p-6 shadow-[0_0_40px_rgba(249,115,22,0.08)] backdrop-blur-md">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Serveri staatus
                </p>
                <p className="mt-1 text-2xl font-extrabold text-orange-500">
                  AVATUD <span className="text-xs font-normal text-zinc-300">24/7</span>
                </p>
                <div className="mt-2 h-1 w-full rounded-full bg-orange-500" />
              </div>

              <div className="border-l border-zinc-800 pl-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Whitelist
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  AKTIIVNE
                </p>
                <p className="mt-1 text-xs text-zinc-400">Esita avaldus</p>
              </div>
            </div>

            {/* Tegevusnupud */}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              {status === "loading" ? (
                <button
                  disabled
                  className="w-full rounded-xl bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-400"
                >
                  Laadimine...
                </button>
              ) : session ? (
                <>
                  <Link
                    href="/apply"
                    className="flex-1 rounded-xl bg-orange-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-500"
                  >
                    Taotle Whitelisti
                  </Link>
                  <Link
                    href="/rules"
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-3 text-center text-sm font-bold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    Loe reegleid
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => signIn("discord")}
                    className="flex-1 cursor-pointer rounded-xl bg-[#5865F2] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4752C4]"
                  >
                    Logi sisse Discordiga
                  </button>
                  <Link
                    href="/rules"
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-3 text-center text-sm font-bold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    Loe reegleid
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Allapoole kerimise nool */}
          <div className="mt-14 flex justify-center">
            <a
              href="#juhatus"
              aria-label="Keri juhatuse juurde"
              className="group flex h-11 w-11 items-center justify-center rounded-full text-orange-500/80 transition hover:translate-y-1 hover:text-orange-400"
            >
              <svg
                xmlns="http://w3.org"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-7 w-7 animate-bounce"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 2. ALLAPOOLE KERIDES: MEIE JUHATUS */}
      <section
        id="juhatus"
        className="relative z-10 mx-auto max-w-6xl px-4 py-24 text-center"
      >
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Meie juhatus
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-300 sm:text-base">
          Me oleme pühendunud sellele, et viia oma ideed ellu ja pakkuda mängijatele parimat rollimängukogemust.
        </p>

        {/* Juhatuse kaartide ruudustik */}
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => (
            <div
              key={leader.discordId}
              className="group flex flex-col text-left transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Suur kandiline profiilipilt (nagu pildil) */}
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
                {leader.avatar ? (
                  <img
                    src={leader.avatar}
                    alt={leader.username}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-4xl font-bold text-zinc-600">
                    {leader.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Nimi, roll ja tsitaat */}
              <h3 className="mt-4 text-lg font-bold text-white">
                {leader.username}
              </h3>
              <p className="text-sm font-medium text-orange-500">
                {leader.role}
              </p>
              <p className="mt-1.5 text-sm italic text-zinc-400">
                &ldquo;{leader.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* Alumine kokkuvõttev rida */}
        {EXTRA_STAFF_COUNT > 0 && (
          <p className="mt-16 text-sm italic text-zinc-300">
            Lisaks on veel{" "}
            <span className="font-bold text-orange-500">{EXTRA_STAFF_COUNT}</span>{" "}
            tublit ja aktiivset meeskonna liiget.
          </p>
        )}
      </section>
    </div>
  );
}

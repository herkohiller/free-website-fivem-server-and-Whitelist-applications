"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full flex-col items-center justify-center px-4 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row md:justify-between md:gap-16">
        {/* Vasakul: logo */}
        <div className="flex-shrink-0">
          <img
            src="/taust2.png"
            alt="Streets of San Andreas RP"
            className="h-64 w-64 rounded-full object-contain drop-shadow-[0_0_35px_rgba(245,158,11,0.35)] sm:h-80 sm:w-80 md:h-[420px] md:w-[420px]"
          />
        </div>

        {/* Paremal: tekst ja nupp */}
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Streets of San Andreas RP
          </h1>

          <p className="mt-6 text-xl font-medium text-gray-200 sm:text-2xl">
            Streets of San Andreas RP on nüüd avatud — liitu linnaga juba täna!
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            {status === "loading" ? (
              <button
                disabled
                className="rounded-xl bg-[#5865F2]/70 px-8 py-4 text-lg font-bold text-white"
              >
                Laadimine...
              </button>
            ) : session ? (
              <>
                <Link
                  href="/apply"
                  className="inline-block rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-500"
                >
                  Taotle Whitelisti
                </Link>
                <Link
                  href="/apply/staff"
                  className="inline-block rounded-xl border border-zinc-700 bg-zinc-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  Kandideeri meeskonda
                </Link>
              </>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="cursor-pointer rounded-xl bg-[#5865F2] px-10 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-[#4752C4]"
              >
                Logi sisse Discordiga
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

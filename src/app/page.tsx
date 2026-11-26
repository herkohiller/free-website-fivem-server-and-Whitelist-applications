"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-[#1f140c] via-[#0d0d0d] to-black px-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row md:justify-between md:gap-16">
        {/* Vasakul: sinu logo täiesti teravalt ja puhtalt */}
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

          <div className="mt-8">
            {status === "loading" ? (
              <button
                disabled
                className="rounded-xl bg-[#5865F2]/70 px-10 py-4 text-xl font-bold text-white"
              >
                Laadimine...
              </button>
            ) : session ? (
              <div className="space-y-4">
                <p className="text-lg text-green-400">
                  Oled sisse logitud kui{" "}
                  <span className="font-bold">{session.user?.name}</span>
                </p>
                <Link
                  href="/whitelist"
                  className="inline-block rounded-xl bg-emerald-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-emerald-500"
                >
                  Esita Whitelist taotlus
                </Link>
              </div>
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

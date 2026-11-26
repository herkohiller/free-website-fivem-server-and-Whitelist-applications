"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div
      className="fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4 text-center text-white"
      style={{ backgroundImage: "url('/taust2.png')" }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 max-w-4xl space-y-10">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Streets of San Andreas RP
        </h1>

        <p className="text-2xl font-semibold text-gray-100 sm:text-4xl">
          Streets of San Andreas RP on nüüd avatud — liitu linnaga juba täna!
        </p>

        <div className="pt-4">
          {status === "loading" ? (
            <button
              disabled
              className="rounded-xl bg-[#5865F2]/70 px-10 py-5 text-xl font-bold text-white"
            >
              Laadimine...
            </button>
          ) : session ? (
            <div className="space-y-5">
              <p className="text-xl text-green-400 sm:text-2xl">
                Oled sisse logitud kui{" "}
                <span className="font-bold">{session.user?.name}</span>
              </p>
              <Link
                href="/whitelist"
                className="inline-block rounded-xl bg-emerald-600 px-10 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-emerald-500"
              >
                Esita Whitelist taotlus
              </Link>
            </div>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="cursor-pointer rounded-xl bg-[#5865F2] px-10 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-[#4752C4]"
            >
              Logi sisse Discordiga
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

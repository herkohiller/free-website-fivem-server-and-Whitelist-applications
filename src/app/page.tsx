"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a120b] via-[#0d0d0d] to-black px-4 text-center text-white">
      {/* Logo tervikuna taustal ilma sisse suumimata */}
      <img
        src="/taust2.png"
        alt="Streets of San Andreas RP"
        className="pointer-events-none absolute inset-0 m-auto h-[85vh] w-[85vw] object-contain opacity-35"
      />

      {/* Tume klaasjas kast keskel, et tekst ja nupp paistaksid selgelt */}
      <div className="relative z-10 max-w-3xl rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-md sm:p-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Streets of San Andreas RP
        </h1>

        <p className="mt-6 text-xl font-medium text-gray-200 sm:text-3xl">
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
              <p className="text-lg text-green-400 sm:text-xl">
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
  );
}

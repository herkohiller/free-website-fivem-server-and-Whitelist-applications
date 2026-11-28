"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StoreItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  taxNote: string;
  duration: string;
  badge: string;
  features: Array<string>;
};

const STORE_ITEMS: Array<StoreItem> = [
  {
    id: "teine-karakter",
    category: "Karakter",
    title: "Teine karakter",
    description:
      "Ava oma kontole lisakarakteri koht, et mängida serveris korraga kahte täiesti erinevat tegelast ja lugu.",
    price: "9.99 €",
    taxNote: "+ lisanduvad Tebexi maksud",
    duration: "PÜSIV",
    badge: "SOODNE",
    features: [
      "Lisakarakteri pesa sinu kontole",
      "Eraldi pank, sõidukid ja elukoht",
      "Püsiv ligipääs pärast aktiveerimist",
    ],
  },
  {
    id: "eritellimus",
    category: "Sõidukid",
    title: "Imporditud Sõiduk",
    description:
      "Soeta endale unikaalne lore-friendly sõiduk koos kohandatud numbrimärgiga, mis sobitub loomulikult serveri keskkonda.",
    price: "19.99 €",
    taxNote: "+ lisanduvad Tebexi maksud",
    duration: "PÜSIV",
    badge: "POPULAARNE",
    features: [
      "Lore-friendly mudel serveri valikust",
      "Kohandatud numbrimärk hinna sees",
      "Kiire paigaldus serverisse",
    ],
  },
  {
    id: "custom-mlo",
    category: "Kinnisvara",
    title: "Maja MLO",
    description:
      "Sinu ettevõttele, gängile või kodule loodud privaatne elamu siseruum (MLO) koos panipaikade ja ukselukkudega.",
    price: "29.99 €",
    taxNote: "+ lisanduvad Tebexi maksud",
    duration: "PÜSIV",
    badge: "PREMIUM",
    features: [
      "Privaatne kinnisvara siseruum",
      "Optimeeritud FPS ja sujuv töö",
      "Privaatsed ukselukud ja panipaigad",
    ],
  },
];

export default function PoodPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return null;
  }

  async function handleBuy(itemId: string) {
    setErrorMsg(null);
    setLoadingId(itemId);

    try {
      const res = await fetch("/api/tebex/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setErrorMsg(data.error || "Makselehe avamine ebaõnnestus.");
        setLoadingId(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setErrorMsg("Ühenduse viga. Proovi uuesti.");
      setLoadingId(null);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30">
                STREETS OF SAN ANDREAS
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Serveri <span className="text-rose-500">Pood</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Toeta serveri arengut ja soeta endale teine karakter, imporditud sõiduk või oma Maja MLO.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tickets"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              🎫 Minu ticketid
            </Link>
          </div>
        </header>

        {errorMsg && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-sm text-rose-200">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STORE_ITEMS.map((item) => {
            const isLoading = loadingId === item.id;
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:border-rose-500/40 hover:bg-zinc-900/80"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                      {item.category}
                    </span>
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-rose-300 ring-1 ring-inset ring-rose-500/30">
                      {item.badge}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-white transition group-hover:text-rose-400">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-zinc-300">
                    {item.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Hind
                      </p>
                      <p className="text-2xl font-black text-white">{item.price}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">{item.taxNote}</p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-400">
                      {item.duration}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={loadingId !== null}
                    onClick={() => handleBuy(item.id)}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Avan makselehte..." : "Osta kohe →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-center text-xs text-zinc-400 backdrop-blur-md">
          Kõikidele hindadele lisanduvad Tebexi teenus- ja käibemaksud vastavalt sinu asukohariigile. Pärast ostu sooritamist suunatakse sind automaatselt{" "}
          <Link href="/tickets" className="font-semibold text-rose-400 underline hover:text-rose-300">
            Minu ticketid
          </Link>{" "}
          lehele, kus saad edastada oma tellimuse detailid.
        </div>
      </div>
    </div>
  );
}

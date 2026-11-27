"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationForm } from "@/components/application-form";

export default function ApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/apply");
    }
  }, [mounted, status, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-400">Vormi laadimine...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      {/* Taustapilt ja hajutus */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        {/* Päise kaart */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <span className="inline-block rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-400">
            Uus kodanik
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Karakteri loomine ja Whitelist
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
            Loo oma tegelane ja kirjuta tema taustalugu. Pärast esitamist vaatab meeskond avalduse üle ning annab sulle otsusest teada Discordis.
          </p>
        </div>

        <ApplicationForm />
      </div>
    </div>
  );
}

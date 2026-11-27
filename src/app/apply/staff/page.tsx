"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-rose-500 focus:bg-zinc-950 focus:outline-none";

export default function ApplyStaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roleInterest, setRoleInterest] = useState("");
  const [age, setAge] = useState("");
  const [dailyHours, setDailyHours] = useState("");
  const [previousExperience, setPreviousExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [conflictScenario, setConflictScenario] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);

  useEffect(() => setMounted(true),);
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/apply/staff");
    }
  }, [mounted, status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!roleInterest) {
      setError("Palun vali, millisele ametikohale soovid kandideerida.");
      return;
    }
    if (!age || Number(age) < 16) {
      setError("Palun sisesta oma tegelik vanus (vähemalt 16).");
      return;
    }
    if (!dailyHours.trim()) {
      setError("Palun märgi, kui palju tunde päevas saad aktiivne olla.");
      return;
    }
    if (motivation.trim().length < 30) {
      setError("Palun põhjenda veidi pikemalt, miks soovid meeskonnaga liituda.");
      return;
    }
    if (!rulesAccepted) {
      setError("Enne esitamist kinnita, et oled tutvunud serveri reeglitega.");
      return;
    }

    setLoading(true);
    try {
      const answersPayload: Record<string, string> = {
        "Soovitud ametikoht": roleInterest,
        "Vanus": age.trim(),
        "Aktiivsus päevas (tundides)": dailyHours.trim(),
        "Varasem meeskonna kogemus": previousExperience.trim() || "Puudub",
        "Miks soovid meeskonnaga liituda ja mis on sinu eesmärk?": motivation.trim(),
        "Kuidas lahendad olukorra, kus kaks mängijat vaidlevad OOC-s?":
          conflictScenario.trim() || "Märkimata",
      };

      const res = await fetch("/api/staff-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Avalduse esitamine ebaõnnestus");
      }

      toast.addToast(
        "Meeskonna avaldus on edukalt esitatud! Vaatame selle peagi üle.",
        "success"
      );
      setTimeout(() => {
        router.push("/applications?tab=staff");
        router.refresh();
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Midagi läks valesti";
      setError(msg);
      toast.addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

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
        {/* PÄISE KAART */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <span className="inline-block rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-400">
            Meeskond
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Kandideeri meeskonda
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
            Soovid panustada <strong>Streets of San Andreas RP</strong> arengusse ja aidata kogukonda? Täida allolev ankeet ning juhtkond võtab sinuga Discordis ühendust.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* VASAK VEERG: KÜSIMUSED (8 VEERGU) */}
          <div className="space-y-6 lg:col-span-8">
            {error && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            {/* 01. PÕHIANDMED */}
            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-extrabold text-rose-400">
                  01
                </span>
                <h2 className="text-lg font-bold text-white">Põhiandmed ja aktiivsus</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label htmlFor="roleInterest" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Millisele positsioonile kandideerid? <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="roleInterest"
                    required
                    value={roleInterest}
                    onChange={(e) => setRoleInterest(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Vali sobiv roll...</option>
                    <option value="Abistaja / Support">Abistaja / Support</option>
                    <option value="Moderaator">Moderaator</option>
                    <option value="Whitelist ülevaataja">Whitelist ülevaataja</option>
                    <option value="Administraator">Administraator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="age" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Sinu vanus <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={16}
                    max={99}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="nt 18"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="dailyHours" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Kui palju aega päevas saad panustada? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="dailyHours"
                    type="text"
                    required
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    placeholder="nt 2–4 tundi päevas"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* 02. KOGEMUS JA MOTIVATSIOON */}
            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-extrabold text-rose-400">
                  02
                </span>
                <h2 className="text-lg font-bold text-white">Kogemus ja motivatsioon</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="previousExperience" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Varasem meeskonna / modereerimise kogemus
                  </label>
                  <textarea
                    id="previousExperience"
                    rows={3}
                    value={previousExperience}
                    onChange={(e) => setPreviousExperience(e.target.value)}
                    placeholder="Kirjelda, millistes serverites või kogukondades oled varem meeskonnas olnud ja millised olid sinu ülesanded..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="motivation" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Miks peaksime just sinu valima ja mis on sinu eesmärk? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="motivation"
                    required
                    rows={4}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Räägi oma tugevustest, suhtlemisoskusest ja sellest, kuidas aitad serverit paremaks muuta..."
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* 03. OLUKORRA LAHENDAMINE JA KINNITUS */}
            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-extrabold text-rose-400">
                  03
                </span>
                <h2 className="text-lg font-bold text-white">Olukorra lahendamine</h2>
              </div>

              <div>
                <label htmlFor="conflictScenario" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Kuidas käitud, kui kaks mängijat vaidlevad häälekalt ja süüdistavad üksteist reeglite rikkumises?
                </label>
                <textarea
                  id="conflictScenario"
                  rows={3}
                  value={conflictScenario}
                  onChange={(e) => setConflictScenario(e.target.value)}
                  placeholder="Kirjelda lühidalt oma tegutsemisviisi..."
                  className={inputClass}
                />
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/5 bg-white/ p-3.5 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-rose-600"
                />
                <span>
                  Kinnitan, et olen esitanud tõesed andmed ning tunnen hästi <strong>Streets of San Andreas RP</strong> reegleid.
                </span>
              </label>
            </section>
          </div>

          {/* PAREM VEERG: KANDIDAADI KOKKUVÕTE JA NUPUD (4 VEERGU) */}
          <div className="space-y-6 lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400">
                  KANDIDAAT
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-white">
                  Avalduse kokkuvõte
                </h3>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-3.5">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 text-base font-bold text-rose-400">
                      {(session.user.name || "K").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {roleInterest || "Positsioon valimata"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-2xl border border-white/5 bg-white/ p-4 text-xs text-zinc-400">
                  <p className="font-semibold text-zinc-200">Mida me ootame:</p>
                  <p>• Viisakat ja rahulikku suhtlust mängijatega</p>
                  <p>• Erapooletust ja reeglite head tundmist</p>
                  <p>• Valmidust meeskonnatööks</p>
                </div>

                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer rounded-2xl bg-rose-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 disabled:opacity-50"
                  >
                    {loading ? "Esitamine..." : "Esita avaldus →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Katkesta
                  </button>
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-rose-500 focus:bg-zinc-950 focus:outline-none";

function calculateAgeFromBirthdate(birthdate: string): number {
  if (!birthdate) return 18;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return 18;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(16, Math.min(120, age));
}

export function ApplicationForm() {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [backstory, setBackstory] = useState("");
  const [rpExperience, setRpExperience] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const fullName = useMemo(() => {
    const combined = `${firstName.trim()} ${lastName.trim()}`.trim();
    return combined || "Eesnimi Perekonnanimi";
  }, [firstName, lastName]);

  const calculatedAge = useMemo(
    () => calculateAgeFromBirthdate(birthdate),
    [birthdate]
  );

  const discordId =
    (session?.user as { discordId?: string } | undefined)?.discordId ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Palun sisesta nii tegelase eesnimi kui ka perekonnanimi.");
      return;
    }
    if (!gender) {
      setError("Palun vali tegelase sugu.");
      return;
    }
    if (!birthdate) {
      setError("Palun vali tegelase sünnikuupäev.");
      return;
    }
    if (backstory.trim().length < 50) {
      setError("Palun kirjuta veidi pikem ja sisukam tegelase elulugu (vähemalt 50 tähemärki).");
      return;
    }
    if (!rulesAccepted) {
      setError("Enne esitamist kinnita, et oled tutvunud serveri reeglitega.");
      return;
    }

    setLoading(true);
    try {
      const answersPayload: Record<string, string> = {
        inGameName: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthdate,
        age: String(calculatedAge),
        discordId,
        timezone: "Europe/Tallinn",
        characterStory: backstory.trim(),
        motivation: backstory.trim(),
        experience: rpExperience.trim() || "Märkimata",
        rulesAccepted: "Jah",
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Avalduse esitamine ebaõnnestus");
      }

      toast.addToast(
        "Avaldus on edukalt esitatud! Vaatame selle peagi üle.",
        "success"
      );
      setTimeout(() => {
        router.push("/applications");
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

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* VASAK VEERG: VORMIVÄLJAD (8 VEERGU) */}
      <div className="space-y-6 lg:col-span-8">
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* 1. TEGELASE PÕHIANDMED */}
        <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-extrabold text-rose-400">
              01
            </span>
            <h2 className="text-lg font-bold text-white">Tegelase põhiandmed</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Eesnimi <span className="text-rose-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="nt Marcus"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Perekonnanimi <span className="text-rose-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="nt Vance"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="gender" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Sugu <span className="text-rose-500">*</span>
              </label>
              <select
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
                <option value="">Vali sugu...</option>
                <option value="Mees">Mees</option>
                <option value="Naine">Naine</option>
              </select>
            </div>

            <div>
              <label htmlFor="birthdate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Sünnikuupäev <span className="text-rose-500">*</span>
              </label>
              <input
                id="birthdate"
                type="date"
                required
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* 2. TEGELASE ELULUGU */}
        <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-extrabold text-rose-400">
                02
              </span>
              <h2 className="text-lg font-bold text-white">Tegelase elulugu</h2>
            </div>
            <span className="text-xs text-zinc-500">
              {backstory.trim().length} märki
            </span>
          </div>

          {/* Suunavad abipunktid eraldi kaardina */}
          <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl border border-white/5 bg-black/30 p-3.5 text-xs text-zinc-400 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Päritolu, lapsepõlv ja perekond</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Iseloomujooned, tugevused ja nõrkused</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Kuidas ja miks jõudis ta Los Santosesse</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Eesmärgid ja tulevikuplaanid linnas</span>
            </div>
          </div>

          <textarea
            id="backstory"
            required
            rows={7}
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            placeholder="Kirjuta siia oma karakteri taustalugu..."
            className={inputClass}
          />
        </section>

        {/* 3. OOC KOGEMUS JA REEGLID */}
        <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-extrabold text-rose-400">
              03
            </span>
            <h2 className="text-lg font-bold text-white">Rollimängu taust (OOC)</h2>
          </div>

          <div>
            <label htmlFor="rpExperience" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Varasem RP kogemus (valikuline)
            </label>
            <textarea
              id="rpExperience"
              rows={3}
              value={rpExperience}
              onChange={(e) => setRpExperience(e.target.value)}
              placeholder="Kirjelda lühidalt oma varasemat rollimängu kogemust..."
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
              Kinnitan, et olen läbi lugenud <strong>Streets of San Andreas RP</strong> reeglid ja kohustun neid järgima.
            </span>
          </label>
        </section>
      </div>

      {/* PAREM VEERG: REAALAJAS ID-KAARDI EELVAADE JA NUPUD (4 VEERGU) */}
      <div className="space-y-6 lg:col-span-4">
        <div className="sticky top-6 space-y-6">
          <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-xl backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400">
              EELVAADE
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-white">
              Kodaniku ID-kaart
            </h3>

            {/* Dünaamiline ID-kaart */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-rose-950/40 p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-rose-400">
                    SAN ANDREAS
                  </p>
                  <p className="text-xs font-extrabold tracking-wide text-white">
                    ISIKUTUNNISTUS
                  </p>
                </div>
                <div className="h-6 w-8 rounded-md border border-amber-400/40 bg-gradient-to-br from-amber-300/30 to-amber-600/20 p-1">
                  <div className="h-full w-full rounded-[2px] border border-amber-300/30" />
                </div>
              </div>

              <div className="mt-3.5 flex items-center gap-3">
                <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-400">
                  <svg
                    xmlns="http://w3.org"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-9 w-9 text-zinc-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                      TÄISNIMI
                    </p>
                    <p className="truncate text-xs font-extrabold uppercase text-white">
                      {fullName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                        SUGU
                      </p>
                      <p className="text-[11px] font-bold text-zinc-200">
                        {gender || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                        SÜNNIAEG
                      </p>
                      <p className="text-[11px] font-bold text-zinc-200">
                        {birthdate
                          ? new Date(birthdate).toLocaleDateString("et-EE")
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 border-t border-white/10 pt-2 font-mono text-[9px] tracking-widest text-zinc-500">
                IDSSA&lt;&lt;NEW&lt;CITIZEN&lt;&lt;&lt;&lt;&lt;&lt;&lt;
              </div>
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
  );
}

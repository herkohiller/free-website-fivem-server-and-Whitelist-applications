import Link from "next/link";
import { auth, resolveSessionUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBrandingSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type FivemServerInfo = {
  online: boolean;
  players: number;
  maxPlayers: number;
  connectCode: string;
  topPlayers: { name: string; id: number; ping: number }[];
};

async function getFivemServerInfo(serverCode: string | null | undefined): Promise<FivemServerInfo> {
  const code = (serverCode || "").trim().replace(/^cfx\.re\/join\//i, "");
  if (!code) {
    return {
      online: false,
      players: 0,
      maxPlayers: 64,
      connectCode: "",
      topPlayers: [],
    };
  }

  try {
    const res = await fetch(`https://fivem.net{encodeURIComponent(code)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return {
        online: false,
        players: 0,
        maxPlayers: 64,
        connectCode: code,
        topPlayers: [],
      };
    }

    const json = (await res.json()) as {
      Data?: {
        clients?: number;
        sv_maxclients?: number;
        players?: { name?: string; id?: number; ping?: number }[];
      };
    };

    const data = json.Data;
    const rawPlayers = Array.isArray(data?.players) ? data.players : [];

    return {
      online: true,
      players: typeof data?.clients === "number" ? data.clients : rawPlayers.length,
      maxPlayers: typeof data?.sv_maxclients === "number" ? data.sv_maxclients : 64,
      connectCode: code,
      topPlayers: rawPlayers.slice(0, 10).map((p, i) => ({
        name: p.name || `Mängija #${i + 1}`,
        id: p.id ?? i + 1,
        ping: p.ping ?? 0,
      })),
    };
  } catch {
    return {
      online: false,
      players: 0,
      maxPlayers: 64,
      connectCode: code,
      topPlayers: [],
    };
  }
}

function getStatusBadge(status: string) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-400">
        Aktsepteeritud
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-3 py-0.5 text-xs font-semibold text-red-400">
        Tagasi lükatud
      </span>
    );
  }
  if (status === "device_check") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-0.5 text-xs font-semibold text-amber-300">
        Seadmekontroll
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-0.5 text-xs font-semibold text-amber-400">
      Ülevaatamisel
    </span>
  );
}

export default async function HomePage() {
  const session = await auth();
  const branding = await getBrandingSettings();

  // 1. KUI KASUTAJA POLE SISSE LOGITUD: Avalik avaleht
  if (!session?.user) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-zinc-950 px-4 text-center text-white">
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 blur-[2px]"
          style={{ backgroundImage: "url('/taust2.png')" }}
        />
        <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/85 to-zinc-950" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-white">STREETS OF </span>
            <span className="text-orange-500">SAN ANDREAS</span>
          </h1>

          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-3 text-sm italic text-zinc-300 sm:text-base">
            <span className="h-5 w-0.5 shrink-0 bg-orange-500" />
            <p>&ldquo;Sinu lugu, sinu valikud, sinu linn — liitu meiega juba täna!&rdquo;</p>
            <span className="h-5 w-0.5 shrink-0 bg-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  // 2. KUI KASUTAJA ON SISSE LOGITUD: UCP Avaleht
  const resolved = await resolveSessionUserId(session);
  const userId = resolved.ok ? resolved.userId : null;

  const [userApplications, recentMembers, serverInfo] = await Promise.all([
    userId
      ? prisma.application.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(),
    prisma.user.findMany({
      orderBy: { lastActiveAt: "desc" },
      take: 10,
      select: {
        id: true,
        username: true,
        avatar: true,
        applications: {
          where: { status: "approved" },
          take: 1,
          select: { inGameName: true },
        },
      },
    }),
    getFivemServerInfo(branding.fivemServerDetailId),
  ]);

  const approvedChar = userApplications.find((a) => a.status === "approved") ?? userApplications ?? null;
  const citizenId = approvedChar
    ? `SSA${approvedChar.id.slice(-5).toUpperCase()}`
    : "Puudub";

  // TOP 10 nimekiri: kui serveris on hetkel mängijad sees, näita neid; muidu näita 10 aktiivseimat kodanikku
  const leaderboard =
    serverInfo.topPlayers.length > 0
      ? serverInfo.topPlayers.map((p, idx) => ({
          rank: idx + 1,
          primaryName: p.name,
          secondaryName: `ID #${p.id}`,
          rightValue: `${p.ping} ms`,
          rightLabel: "PING",
        }))
      : recentMembers.map((m, idx) => ({
          rank: idx + 1,
          primaryName: m.applications?.inGameName || m.username,
          secondaryName: m.username,
          rightValue: `#${idx + 1}`,
          rightLabel: "KOHT",
        }));

  return (
    <div className="min-h-screen w-full bg-[#090b10] px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* ÜLEMINE PÄIS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              — UCP
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Avaleht
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Sinu karakterid, serveri olek ja olulisem info ühes kohas.
            </p>
          </div>

          {/* Kasutaja profiil paremal üleval */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/30 text-sm font-bold text-indigo-300">
                {(session.user.name || "K").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{session.user.name}</p>
              <span className="inline-block rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                Kodanik
              </span>
            </div>
          </div>
        </div>

        {/* PÕHISISU: VASAK VEERG (KARAKTERID) + PAREM VEERG (SERVER & TOP 10) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          {/* VASAK VEERG */}
          <div className="space-y-6">
            {/* 1. SINU KARAKTERID */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                KARAKTERID
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">Sinu karakterid</h2>

              {approvedChar ? (
                <>
                  {/* Valitud karakteri riba */}
                  <div className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 px-4 py-2.5 text-center text-sm font-semibold text-indigo-200">
                    {approvedChar.inGameName}
                  </div>

                  {/* Karakteri pilt ja detailid */}
                  <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
                    <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={approvedChar.inGameName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-extrabold text-zinc-600">
                          {approvedChar.inGameName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-zinc-800/80 text-sm">
                      <div className="grid grid-cols-2 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          [OLEK]:
                        </span>
                        <div>{getStatusBadge(approvedChar.status)}</div>
                      </div>
                      <div className="grid grid-cols-2 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          [ISIKUKOOD]:
                        </span>
                        <span className="font-mono font-semibold text-zinc-200">
                          {citizenId}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          [TÄISNIMI]:
                        </span>
                        <span className="font-semibold text-white">
                          {approvedChar.inGameName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          [VANUS]:
                        </span>
                        <span className="text-zinc-200">{approvedChar.age}-aastane</span>
                      </div>
                      <div className="grid grid-cols-2 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          [LOODUD]:
                        </span>
                        <span className="text-zinc-300">
                          {new Date(approvedChar.createdAt).toLocaleDateString("et-EE")}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
                  <p className="text-sm text-zinc-400">
                    Sul ei ole veel ühtegi karakterit loodud.
                  </p>
                  <Link
                    href="/apply"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    + Loo uus karakter
                  </Link>
                </div>
              )}
            </section>

            {/* 2. KARAKTERI FRAKTSIOONID */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Karakteri fraktsioonid</h3>
                <span className="text-xs text-zinc-500">(2 vaba kohta)</span>
              </div>
              <div className="mt-4 grid grid-cols-4 border-b border-zinc-800/80 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>NIMI</span>
                <span>AKTIIVSUS</span>
                <span>TÖÖAEG KOKKU</span>
                <span>AUASTE</span>
              </div>
              <p className="py-6 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                FRAKTSIOONID PUUDUVAD
              </p>
            </section>

            {/* 3. KARAKTERILE KUULUVAD SÕIDUKID */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Karakterile kuuluvad sõidukid</h3>
                <span className="text-xs text-zinc-500">(5 vaba kohta)</span>
              </div>
              <div className="mt-4 grid grid-cols-5 border-b border-zinc-800/80 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>NIMETUS</span>
                <span>NUMBRIMÄRK</span>
                <span>LIIKLUSKINDLUSTUS</span>
                <span>OLEK</span>
                <span>JAGATUD</span>
              </div>
              <p className="py-6 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                SÕIDUKID PUUDUVAD
              </p>
            </section>

            {/* 4. KARAKTERILE KUULUVAD KINNISVARAD */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Karakterile kuuluvad kinnisvarad</h3>
                <span className="text-xs text-zinc-500">(0 tk)</span>
              </div>
              <div className="mt-4 grid grid-cols-3 border-b border-zinc-800/80 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>KINNISVARA</span>
                <span>AADRESS</span>
                <span>JAGATUD KARAKTERITEGA</span>
              </div>
              <p className="py-6 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                KINNISVARAD PUUDUVAD
              </p>
            </section>

            {/* 5. SAADETUD KARAKTERI TAOTLUSED */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Saadetud karakteri taotlused
                    </h3>
                    <span className="text-xs text-zinc-500">
                      ({userApplications.length} esitatud)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Sinu karakteri taotlused on alljärgnevad. Pea meeles, et sa ei saa luua uut karakterit enne kui sinu eelnevad taotlused on aktsepteeritud.
                  </p>
                </div>

                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
                >
                  + Loo uus karakter
                </Link>
              </div>

              {userApplications.length === 0 ? (
                <p className="py-8 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  TAOTLUSED PUUDUVAD
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        <th className="py-2.5 pr-4">#</th>
                        <th className="py-2.5 pr-4">KARAKTERI NIMI</th>
                        <th className="py-2.5 pr-4">ESITATUD</th>
                        <th className="py-2.5 pr-4">STAATUS</th>
                        <th className="py-2.5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {userApplications.map((app, index) => (
                        <tr key={app.id} className="hover:bg-zinc-900/40">
                          <td className="py-3.5 pr-4 font-mono text-xs text-zinc-400">
                            {userApplications.length - index}
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-white">
                            {app.inGameName}
                          </td>
                          <td className="py-3.5 pr-4 text-zinc-400">
                            {new Date(app.createdAt).toLocaleDateString("et-EE")}
                          </td>
                          <td className="py-3.5 pr-4">{getStatusBadge(app.status)}</td>
                          <td className="py-3.5 text-right">
                            <Link
                              href="/applications"
                              className="text-xs font-semibold text-indigo-400 transition hover:text-indigo-300"
                            >
                              Vaata taotlust →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* PAREM VEERG: SERVER JA TOP 10 */}
          <div className="space-y-6">
            {/* SERVERI STAATUS JA SLOTID */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    SERVER
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-white">Liitu serveriga</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    serverInfo.online ? "text-emerald-400" : "text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      serverInfo.online ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                    }`}
                  />
                  {serverInfo.online ? "Online" : "Offline"}
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-zinc-800/90 bg-[#131722] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  MÄNGIJAID SERVERIS
                </p>
                <p className="mt-1 text-3xl font-extrabold text-white">
                  {serverInfo.players}
                  <span className="text-lg font-medium text-zinc-500">
                    {" "}
                    / {serverInfo.maxPlayers}
                  </span>
                </p>
              </div>

              {serverInfo.connectCode ? (
                <a
                  href={`fivem://connect/cfx.re/join/${serverInfo.connectCode}`}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-4 py-3 text-sm font-semibold text-white transition hover:border-indigo-500/50 hover:bg-zinc-800"
                >
                  <span>Mängima</span>
                  <span className="text-indigo-400">▶</span>
                </a>
              ) : (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
                  Määra FiveM serveri kood jaotises Admin → Bränding ja välimus.
                </div>
              )}
            </section>

            {/* TOP 10 EDETABEL */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0e1118] p-6 shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                EDETABEL
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                TOP 10 aktiivseimat karakterit
              </h2>

              <div className="mt-4 divide-y divide-zinc-800/70">
                {leaderboard.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    Andmed puuduvad
                  </p>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {entry.primaryName}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {entry.secondaryName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-white">{entry.rightValue}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          {entry.rightLabel}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { auth, resolveSessionUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBrandingSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type FivemPlayer = {
  name: string;
  id: number;
  ping: number;
};

type FivemServerInfo = {
  online: boolean;
  players: number;
  maxPlayers: number;
  connectCode: string;
  topPlayers: Array<FivemPlayer>;
};

async function getFivemServerInfo(
  serverCode: string | null | undefined
): Promise<FivemServerInfo> {
  const code = (serverCode || "").trim().replace(/^cfx\.re\/join\//i, "");
  const emptyPlayers: Array<FivemPlayer> = new Array();

  if (!code) {
    return {
      online: false,
      players: 0,
      maxPlayers: 64,
      connectCode: "",
      topPlayers: emptyPlayers,
    };
  }

  try {
    const apiUrl =
      "https://fivem.net" +
      encodeURIComponent(code);
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return {
        online: false,
        players: 0,
        maxPlayers: 64,
        connectCode: code,
        topPlayers: emptyPlayers,
      };
    }

    const json = (await res.json()) as {
      Data?: {
        clients?: number;
        sv_maxclients?: number;
        players?: Array<{ name?: string; id?: number; ping?: number }>;
      };
    };

    const data = json.Data;
    const rawPlayers = Array.isArray(data?.players)
      ? data.players
      : new Array<{ name?: string; id?: number; ping?: number }>();

    return {
      online: true,
      players:
        typeof data?.clients === "number" ? data.clients : rawPlayers.length,
      maxPlayers:
        typeof data?.sv_maxclients === "number" ? data.sv_maxclients : 64,
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
      topPlayers: emptyPlayers,
    };
  }
}

function getStatusPill(status: string) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Kinnitatud
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        Tagasi lükatud
      </span>
    );
  }
  if (status === "device_check") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        Seadmekontroll
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Ootel
    </span>
  );
}

export default async function HomePage() {
  const session = await auth();
  const branding = await getBrandingSettings();

  // Sisselogimata külastaja vaade
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
            <span className="text-rose-500">SAN ANDREAS</span>
          </h1>

          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-3 text-sm italic text-zinc-300 sm:text-base">
            <span className="h-5 w-0.5 shrink-0 bg-rose-500" />
            <p>&ldquo;Sinu lugu, sinu valikud, sinu linn — liitu meiega juba täna!&rdquo;</p>
            <span className="h-5 w-0.5 shrink-0 bg-rose-500" />
          </div>
        </div>
      </div>
    );
  }

  // Sisselogitud mängija juhtpaneel
  const resolved = await resolveSessionUserId(session);
  const userId = resolved.ok ? resolved.userId : null;

  const userApplications = userId
    ? await prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.application.findMany({
        where: { id: "__none__" },
      });

  const userStaffApplications = userId
    ? await prisma.staffApplication.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.staffApplication.findMany({
        where: { id: "__none__" },
      });

  const [recentMembers, totalMembersCount] = await Promise.all([
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
    prisma.user.count(),
  ]);

  const serverInfo = await getFivemServerInfo(branding.fivemServerDetailId);

  const approvedChar =
    userApplications.find((a) => a.status === "approved") ??
    userApplications.at(0) ??
    null;

  const citizenCode = approvedChar
    ? `SSA-${approvedChar.id.slice(-4).toUpperCase()}`
    : "—";

  const leaderboard =
    serverInfo.topPlayers.length > 0
      ? serverInfo.topPlayers.map((p, idx) => ({
          rank: idx + 1,
          name: p.name,
          sub: `Mängija #${p.id}`,
          badge: `${p.ping} ms`,
          avatar: null as string | null,
        }))
      : recentMembers.map((m, idx) => ({
          rank: idx + 1,
          name: m.applications.at(0)?.inGameName || m.username,
          sub: `@${m.username}`,
          badge: `#${idx + 1}`,
          avatar: m.avatar,
        }));

  return (
    <div className="min-h-screen w-full bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ÜLEMINE TERVITUSRIBA + KIIRNUPUD */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-rose-950/20 p-6 sm:flex-row sm:items-center">
          <div>
            <span className="inline-block rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-semibold text-rose-400">
              Streets of San Andreas RP
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Tere tulemast, {session.user.name}!
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Halda oma kodaniku profiili, esita avaldusi ja jälgi serveri seisu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500"
            >
              Taotle Whitelisti
            </Link>
            <Link
              href="/apply/staff"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Kandideeri meeskonda
            </Link>
          </div>
        </div>

        {/* 4 ÜLEVAATE KAARTI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Serveri staatus</p>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  serverInfo.online ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    serverInfo.online ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                  }`}
                />
                {serverInfo.online ? "Sees" : "Väljas"}
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {serverInfo.players} / {serverInfo.maxPlayers}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Mängijat hetkel linnas</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-400">Aktiivne karakter</p>
            <p className="mt-2 truncate text-2xl font-extrabold text-white">
              {approvedChar ? approvedChar.inGameName : "Puudub"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {approvedChar ? `Kood: ${citizenCode}` : "Esita whitelist-avaldus"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-400">Sinu avaldused</p>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {userApplications.length + userStaffApplications.length}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {userApplications.length} whitelist · {userStaffApplications.length} meeskond
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-400">Kogukonna liikmeid</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{totalMembersCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Registreeritud kodanikku</p>
          </div>
        </div>

        {/* PÕHISISU: VASAKUL KODANIKU PROFIIL & AVALDUSED, PAREMAL ÜHENDUS & TOP 10 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* KODANIKU KAART */}
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Kodaniku profiil</h2>
                  <p className="text-xs text-zinc-400">
                    Sinu tegelase andmed ja staatus serveris
                  </p>
                </div>
                {approvedChar && getStatusPill(approvedChar.status)}
              </div>

              {approvedChar ? (
                <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-800">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={approvedChar.inGameName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-400">
                        {approvedChar.inGameName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-zinc-500">Tegelase nimi</p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {approvedChar.inGameName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Kodaniku kood</p>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-200">
                        {citizenCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Vanus</p>
                      <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                        {approvedChar.age} a
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Töökoht / Fraktsioon</p>
                      <p className="mt-0.5 text-sm text-zinc-300">Töötu</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Sõidukid</p>
                      <p className="mt-0.5 text-sm text-zinc-300">0 sõidukit</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Kinnisvara</p>
                      <p className="mt-0.5 text-sm text-zinc-300">Puudub</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-8 text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    Sul pole veel tegelast loodud
                  </p>
                  <p className="mt-1 max-w-md text-xs text-zinc-500">
                    Täida whitelist-avaldus, et alustada oma teekonda Streets of San Andreas RP serveris.
                  </p>
                  <Link
                    href="/apply"
                    className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
                  >
                    Alusta avaldust
                  </Link>
                </div>
              )}
            </section>

            {/* SINU VIIMASED AVALDUSED (WHITELIST + MEESKOND) */}
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Viimased avaldused</h2>
                  <p className="text-xs text-zinc-400">
                    Sinu esitatud whitelist- ja meeskonna avaldused
                  </p>
                </div>
                <Link
                  href="/applications"
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                >
                  Vaata kõiki →
                </Link>
              </div>

              {userApplications.length === 0 && userStaffApplications.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Ühtegi avaldust pole veel esitatud.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-zinc-800/70">
                  {userApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Whitelist: {app.inGameName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Esitatud {new Date(app.createdAt).toLocaleDateString("et-EE")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusPill(app.status)}
                        <Link
                          href="/applications"
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                        >
                          Ava
                        </Link>
                      </div>
                    </div>
                  ))}

                  {userStaffApplications.map((staffApp) => (
                    <div
                      key={staffApp.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Meeskonna avaldus
                        </p>
                        <p className="text-xs text-zinc-500">
                          Esitatud {new Date(staffApp.createdAt).toLocaleDateString("et-EE")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusPill(staffApp.status)}
                        <Link
                          href="/applications"
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                        >
                          Ava
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* PAREM VEERG: SERVERIGA ÜHENDAMINE JA TOP 10 */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
              <h2 className="text-lg font-bold text-white">Ühenda serveriga</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Ava FiveM ja liitu otse meie rollimänguserveriga.
              </p>

              {serverInfo.connectCode ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 font-mono text-xs text-zinc-300">
                    connect cfx.re/join/{serverInfo.connectCode}
                  </div>
                  <a
                    href={`fivem://connect/cfx.re/join/${serverInfo.connectCode}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
                  >
                    Liitu serveriga kohe
                  </a>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-xs text-zinc-400">
                  Serveri ühenduskood on seadistamisel (Admin → Bränding ja välimus).
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">TOP 10 mängijat</h2>
                <span className="text-xs text-zinc-500">Aktiivsus</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {leaderboard.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-500">
                    Andmed puuduvad
                  </p>
                ) : (
                  leaderboard.map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            item.rank === 1
                              ? "bg-amber-500/20 text-amber-400"
                              : item.rank === 2
                                ? "bg-zinc-400/20 text-zinc-300"
                                : item.rank === 3
                                  ? "bg-orange-600/20 text-orange-400"
                                  : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {item.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-100">
                            {item.name}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold text-zinc-400">
                        {item.badge}
                      </span>
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

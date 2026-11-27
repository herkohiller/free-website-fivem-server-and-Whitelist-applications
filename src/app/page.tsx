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

function getStatusBadge(status: string) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Kinnitatud
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        Tagasi lükatud
      </span>
    );
  }
  if (status === "device_check") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-inset ring-amber-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        Seadmekontroll
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Ülevaatamisel
    </span>
  );
}

export default async function HomePage() {
  const session = await auth();
  const branding = await getBrandingSettings();

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
    : "MÄÄRAMATA";

  const leaderboard =
    serverInfo.topPlayers.length > 0
      ? serverInfo.topPlayers.map((p, idx) => ({
          rank: idx + 1,
          name: p.name,
          sub: `ID #${p.id}`,
          value: `${p.ping} ms`,
          avatar: null as string | null,
        }))
      : recentMembers.map((m, idx) => ({
          rank: idx + 1,
          name: m.applications.at(0)?.inGameName || m.username,
          sub: m.username,
          value: `#${idx + 1}`,
          avatar: m.avatar,
        }));

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/15"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-xl font-black text-rose-400 ring-1 ring-rose-500/30">
                {(session.user.name || "K").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-zinc-300">
                  KODANIKU PORTAAL
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400">
                  {totalMembersCount} liiget kogukonnas
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Tere, {session.user.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/apply"
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500"
            >
              + Taotle Whitelisti
            </Link>
            <Link
              href="/apply/staff"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-100 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10"
            >
              Kandideeri meeskonda
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* SINU KODANIKU PASS (ID-KAARDI VISUAALIGA) */}
            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400">
                    IDENTITEET
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold text-white">
                    Sinu kodaniku pass
                  </h2>
                </div>
                {approvedChar ? getStatusBadge(approvedChar.status) : null}
              </div>

              {approvedChar ? (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
                  {/* AMETLIK ID-KAART */}
                  <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-rose-950/40 p-4 shadow-xl">
                    {/* ID-kaardi ülemine riba */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-rose-400">
                          SAN ANDREAS
                        </p>
                        <p className="text-xs font-extrabold tracking-wide text-white">
                          ISIKUTUNNISTUS
                        </p>
                      </div>
                      {/* Kiibi ikoon */}
                      <div className="h-6 w-8 rounded-md border border-amber-400/40 bg-gradient-to-br from-amber-300/30 to-amber-600/20 p-1">
                        <div className="h-full w-full rounded-[2px] border border-amber-300/30" />
                      </div>
                    </div>

                    {/* ID-kaardi keskosa: portree siluett + andmed */}
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

                      <div className="min-w-0 flex-1 space-y-1">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                            NIMI / NAME
                          </p>
                          <p className="truncate text-xs font-extrabold uppercase text-white">
                            {approvedChar.inGameName}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                              VANUS
                            </p>
                            <p className="text-[11px] font-bold text-zinc-200">
                              {approvedChar.age} a
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                              DOK. NR
                            </p>
                            <p className="font-mono text-[11px] font-bold text-rose-300">
                              {citizenCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ID-kaardi alumine masinloetav riba */}
                    <div className="mt-3.5 border-t border-white/10 pt-2 font-mono text-[9px] tracking-widest text-zinc-500">
                      IDSSA&lt;&lt;{citizenCode}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                    </div>
                  </div>

                  {/* DETAILSED VÄLJAD PAREMAL */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Tegelase nimi
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-white">
                        {approvedChar.inGameName}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Passi kood
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-rose-300">
                        {citizenCode}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Vanus
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {approvedChar.age}-aastane
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Fraktsioon
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-300">
                        Puudub
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Sõidukid
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-300">
                        0 sõidukit
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Kinnisvara
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-300">
                        Puudub
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    Sul ei ole veel ühtegi tegelast loodud.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Alusta whitelist-avalduse täitmisega, et saada linnakodanikuks.
                  </p>
                  <Link
                    href="/apply"
                    className="mt-4 inline-block rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
                  >
                    Täida avaldus
                  </Link>
                </div>
              )}
            </section>

            {/* ESITATUD AVALDUSED */}
            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    AJALUGU
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-white">
                    Sinu esitatud avaldused
                  </h2>
                </div>
                <Link
                  href="/applications"
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                >
                  Kõik avaldused →
                </Link>
              </div>

              {userApplications.length === 0 && userStaffApplications.length === 0 ? (
                <p className="py-8 text-center text-xs font-medium text-zinc-500">
                  Sa pole veel ühtegi avaldust esitanud.
                </p>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {userApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          Whitelist · {app.inGameName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(app.createdAt).toLocaleDateString("et-EE")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(app.status)}
                        <Link
                          href="/applications"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                        >
                          Vaata
                        </Link>
                      </div>
                    </div>
                  ))}

                  {userStaffApplications.map((staffApp) => (
                    <div
                      key={staffApp.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          Meeskonna avaldus
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(staffApp.createdAt).toLocaleDateString("et-EE")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(staffApp.status)}
                        <Link
                          href="/applications"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                        >
                          Vaata
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  FIVEM SERVER
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    serverInfo.online
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
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

              <div className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-4">
                <p className="text-xs text-zinc-400">Mängijaid linnas</p>
                <p className="mt-1 text-3xl font-black text-white">
                  {serverInfo.players}
                  <span className="text-lg font-normal text-zinc-500">
                    {" "}
                    / {serverInfo.maxPlayers}
                  </span>
                </p>
              </div>

              {serverInfo.connectCode ? (
                <a
                  href={`fivem://connect/cfx.re/join/${serverInfo.connectCode}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
                >
                  Ühenda serveriga ▶
                </a>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 text-xs text-zinc-400">
                  Määra FiveM serveri kood jaotises Admin → Bränding ja välimus.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    EDETABEL
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-white">
                    TOP 10 kodanikku
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    Andmed puuduvad
                  </p>
                ) : (
                  leaderboard.map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                            item.rank === 1
                              ? "bg-amber-400/20 text-amber-300"
                              : item.rank === 2
                                ? "bg-zinc-300/20 text-zinc-200"
                                : item.rank === 3
                                  ? "bg-orange-500/20 text-orange-300"
                                  : "bg-white/5 text-zinc-500"
                          }`}
                        >
                          {item.rank}
                        </span>

                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt=""
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : null}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {item.name}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">
                            {item.sub}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 font-mono text-xs font-semibold text-zinc-400">
                        {item.value}
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

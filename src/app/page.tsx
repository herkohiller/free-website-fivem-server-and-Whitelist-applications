import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 👇 ASENDA NEED 4 OMA JUHTKONNA PÄRIS DISCORDI ID-DEGA (AINULT NUMBRID JUTUMÄRKIDE SEES):
const LEADERSHIP_DISCORD_IDS = [
  "1226573496860151999",
  "1428023982422102160",
  "989929420099825715",
];

type LeaderProfile = {
  discordId: string;
  username: string;
  avatar: string | null;
};

function makeAvatarSharp(url: string | null): string | null {
  if (!url) return null;
  if (url.includes("discordapp.com")) {
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?size=1024`;
  }
  return url;
}

function discordAvatarUrl(userId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null;
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://discordapp.com{userId}/${avatarHash}.${ext}?size=1024`;
}

async function resolveDiscordLeader(discordId: string): Promise<LeaderProfile> {
  const cleanId = discordId.trim();

  // 1. Proovime võtta otse Discordi API-st (kõrgeima kvaliteediga pilt ja värskeim nimi)
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  if (botToken && cleanId) {
    try {
      const res = await fetch(`https://discord.com{cleanId}`, {
        headers: { Authorization: `Bot ${botToken}` },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          username?: string;
          global_name?: string | null;
          avatar?: string | null;
        };
        return {
          discordId: cleanId,
          username: data.global_name || data.username || "Teadmata",
          avatar: discordAvatarUrl(cleanId, data.avatar ?? null),
        };
      }
    } catch {
      // Kui Discord API ei vasta, liigume edasi andmebaasi päringu juurde
    }
  }

  // 2. Varuvõimalus: otsime veebilehe andmebaasist ja teeme pildi teravaks (?size=1024)
  try {
    const user = await prisma.user.findUnique({
      where: { discordId: cleanId },
      select: { username: true, avatar: true },
    });
    if (user) {
      return {
        discordId: cleanId,
        username: user.username,
        avatar: makeAvatarSharp(user.avatar ?? null),
      };
    }
  } catch {
    // Ignoreerime andmebaasi viga
  }

  return {
    discordId: cleanId,
    username: "Teadmata",
    avatar: null,
  };
}

export default async function HomePage() {
  const leaders = await Promise.all(
    LEADERSHIP_DISCORD_IDS.map((id) => resolveDiscordLeader(id))
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white">
      {/* Taustapilt koos tumeda hajutusega */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 blur-[2px]"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/85 to-zinc-950" />

      {/* 1. ÜLEMINE VAADE (HERO) */}
      <section className="relative z-10 flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-white">STREETS OF </span>
            <span className="text-orange-500">SAN ANDREAS</span>
          </h1>

          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-3 text-sm italic text-zinc-300 sm:text-base">
            <span className="h-5 w-0.5 shrink-0 bg-orange-500" />
            <p>&ldquo;Sinu lugu, sinu valikud, sinu linn — liitu meiega juba täna!&rdquo;</p>
            <span className="h-5 w-0.5 shrink-0 bg-orange-500" />
          </div>

          {/* Allapoole kerimise nool */}
          <div className="mt-16 flex justify-center">
            <a
              href="#juhtkond"
              aria-label="Keri juhtkonna juurde"
              className="group flex h-11 w-11 items-center justify-center rounded-full text-orange-500/80 transition hover:translate-y-1 hover:text-orange-400"
            >
              <svg
                xmlns="http://w3.org"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-7 w-7 animate-bounce"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 2. ALLAPOOLE KERIDES: JUHTKOND */}
      <section
        id="juhtkond"
        className="relative z-10 mx-auto max-w-6xl px-4 py-24 text-center"
      >
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Juhtkond
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader, index) => (
            <div
              key={`${leader.discordId}-${index}`}
              className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Terav Discordi profiilipilt */}
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl">
                {leader.avatar ? (
                  <img
                    src={leader.avatar}
                    alt={leader.username}
                    loading="eager"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800/80 to-zinc-950 text-5xl font-extrabold text-orange-500/80">
                    {leader.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Discordi nimi */}
              <h3 className="mt-4 text-lg font-bold text-white">
                {leader.username}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscordAvatarImage } from "@/components/discord-avatar-image";
import { resolveDiscordAvatarUrl } from "@/lib/discord-avatar";

type SiteMember = {
  id: string;
  discordId: string;
  adminType: string;
  createdAt: string;
  addedBy: { id: string; username: string; discordId: string };
  user: { username: string; avatar: string | null; discriminator: string | null } | null;
};

type MemberDirectoryEntry = {
  id: string;
  sequence: number;
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isAdmin: boolean;
  adminType: string | null;
  siteRole: string | null;
};

type MemberDashboardData = {
  stats: {
    totalVisitors: number;
    totalMembers: number;
    onlineMembers: number;
    onlineWindowMinutes: number;
  };
  broadcast?: {
    guildConfigured: boolean;
    approximateGuildMembers: number | null;
    discordOnline?: {
      count: number;
      fresh: boolean;
      updatedAt: string | null;
    };
  };
  members: MemberDirectoryEntry[];
};

type AdminMembersListProps = {
  isFullAdmin: boolean;
};

function formatRoleLabel(role: string | null | undefined): string {
  if (role === "full") return "Peaadministraator";
  if (role === "team") return "Tiimi administraator";
  if (role === "jobs") return "Töökohtade administraator";
  if (role === "rules") return "Reeglite haldur";
  return "Liige";
}

function isOnline(lastActiveAt: string | null, onlineWindowMinutes: number): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() <= onlineWindowMinutes * 60 * 1000;
}

function broadcastScopeLabel(audience: string): string {
  if (audience === "guild") return "serveri liikmetele";
  if (audience === "online_site") return "veebilehel aktiivsetele liikmetele";
  if (audience === "online_discord") return "Discordis võrgus olevatele liikmetele (hetktõmmis)";
  return "registreeritud liikmetele";
}

type BroadcastProgress = { current: number; total: number; sent: number; failed: number };

type BroadcastStreamDone = {
  sent: number;
  failed: number;
  audience: string;
  attempted: number;
  fullTotal?: number;
  nextChunkOffset?: number;
  broadcastComplete: boolean;
};

async function consumeMemberBroadcastStream(
  res: Response,
  priorSent: number,
  priorFailed: number,
  setBroadcastProgress: Dispatch<SetStateAction<BroadcastProgress | null>>
): Promise<{
  err: string | null;
  done: BroadcastStreamDone | null;
  partial: boolean;
  streamAudience: string;
  lastLp: BroadcastProgress | null;
}> {
  const outcome: { done: BroadcastStreamDone | null; err: string | null } = { done: null, err: null };
  const streamMeta: {
    audience: string;
    lastProgress: BroadcastProgress | null;
  } = { audience: "registered", lastProgress: null };

  const reader = res.body?.getReader();
  if (!reader) {
    return {
      err: "Serveri vastuse lugemine ebaõnnestus.",
      done: null,
      partial: false,
      streamAudience: "registered",
      lastLp: null,
    };
  }

  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line: string) => {
    const t = line.trim();
    if (!t) return;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(t) as Record<string, unknown>;
    } catch {
      return;
    }
    if (msg.type === "start" && typeof msg.total === "number") {
      if (typeof msg.audience === "string") streamMeta.audience = msg.audience;
      const ft = typeof msg.fullTotal === "number" ? msg.fullTotal : msg.total;
      const co = typeof msg.chunkOffset === "number" ? msg.chunkOffset : 0;
      setBroadcastProgress({ current: co, total: ft, sent: priorSent, failed: priorFailed });
    } else if (msg.type === "progress") {
      const cur =
        typeof msg.globalCurrent === "number" ? Number(msg.globalCurrent) : Number(msg.current) || 0;
      const tot = typeof msg.fullTotal === "number" ? Number(msg.fullTotal) : Number(msg.total) || 0;
      streamMeta.lastProgress = {
        current: cur,
        total: tot,
        sent: priorSent + (Number(msg.sent) || 0),
        failed: priorFailed + (Number(msg.failed) || 0),
      };
      setBroadcastProgress(streamMeta.lastProgress);
    } else if (msg.type === "done") {
      outcome.done = {
        sent: Number(msg.sent) || 0,
        failed: Number(msg.failed) || 0,
        audience: String(msg.audience ?? streamMeta.audience),
        attempted: Number(msg.attempted) || 0,
        fullTotal: typeof msg.fullTotal === "number" ? msg.fullTotal : undefined,
        nextChunkOffset: typeof msg.nextChunkOffset === "number" ? msg.nextChunkOffset : undefined,
        broadcastComplete: typeof msg.broadcastComplete === "boolean" ? msg.broadcastComplete : true,
      };
    } else if (msg.type === "error") {
      outcome.err = String(msg.message ?? "Sõnumite saatmine ebaõnnestus.");
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  if (buffer.trim()) handleLine(buffer);

  const lp = streamMeta.lastProgress;
  const partial = !outcome.done && !outcome.err && Boolean(lp && lp.current > 0);

  return {
    err: outcome.err,
    done: outcome.done,
    partial,
    streamAudience: streamMeta.audience,
    lastLp: lp,
  };
}

export function AdminMembersList({ isFullAdmin }: AdminMembersListProps) {
  const [members, setMembers] = useState<SiteMember[]>([]);
  const [dashboard, setDashboard] = useState<MemberDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [discordId, setDiscordId] = useState("");
  const [adminType, setAdminType] = useState<"team" | "jobs" | "rules" | "full">("team");
  const [submitting, setSubmitting] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [lookupPreview, setLookupPreview] = useState<{ username: string; avatar: string | null } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastCtaLabel, setBroadcastCtaLabel] = useState("");
  const [broadcastCtaUrl, setBroadcastCtaUrl] = useState("");
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastAudience, setBroadcastAudience] = useState<
    "online_discord" | "online_site" | "registered" | "guild"
  >("online_discord");
  const [broadcastProgress, setBroadcastProgress] = useState<BroadcastProgress | null>(null);
  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLookup = useCallback((id: string) => {
    const trimmed = id.trim();
    if (trimmed.length < 17) {
      setLookupPreview(null);
      return;
    }
    setLookupLoading(true);
    fetch(`/api/members/lookup?discordId=${encodeURIComponent(trimmed)}`)
      .then((res) => (res.ok ? res.json() : { username: null, avatar: null }))
      .then((data) => {
        if (data.username || data.avatar) setLookupPreview({ username: data.username ?? "Teadmata", avatar: data.avatar ?? null });
        else setLookupPreview(null);
      })
      .catch(() => setLookupPreview(null))
      .finally(() => setLookupLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, dashboardRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/admin/member-dashboard"),
      ]);

      if (membersRes.status === 403 || dashboardRes.status === 403) {
        throw new Error("Forbidden");
      }

      if (!membersRes.ok || !dashboardRes.ok) {
        throw new Error("Failed");
      }

      const [siteMembers, dashboardData] = await Promise.all([
        membersRes.json() as Promise<SiteMember[]>,
        dashboardRes.json() as Promise<MemberDashboardData>,
      ]);

      setMemberError(null);
      setMembers(siteMembers);
      setDashboard(dashboardData);
    } catch {
      setMembers([]);
      setDashboard(null);
      setMemberError("Liikmete andmete laadimine ebaõnnestus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMemberError(null);
    setMemberSuccess(null);
    const idToAdd = discordId.trim();
    if (!idToAdd) {
      setMemberError("Sisesta Discord ID.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: idToAdd, adminType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberError(data.error || "Liikme lisamine ebaõnnestus");
        return;
      }
      setDiscordId("");
      setLookupPreview(null);
      setAdminType("team");
      setMemberSuccess("Liige on lisatud. Ligipääsu saamiseks peab ta võib-olla korra välja ja uuesti sisse logima.");
      await loadData();
    } catch {
      setMemberError("Liikme lisamine ebaõnnestus");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Kas eemaldada see liige? Ta kaotab administraatori õigused kuni uuesti lisamiseni.")) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setMemberSuccess("Liige on eemaldatud.");
      await loadData();
    } catch {
      setMemberError("Liikme eemaldamine ebaõnnestus");
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setBroadcastError(null);
    setBroadcastSuccess(null);

    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastError("Sisesta nii pealkiri kui ka sõnum.");
      return;
    }

    if ((broadcastCtaLabel.trim() && !broadcastCtaUrl.trim()) || (!broadcastCtaLabel.trim() && broadcastCtaUrl.trim())) {
      setBroadcastError("Nupu tekst ja nupu link (URL) tuleb täita koos.");
      return;
    }

    if (broadcastAudience === "guild") {
      const ok = window.confirm(
        "Kas saata Discordi privaatsõnum igale serveri inimkasutajale (mitte ainult neile, kes on veebilehele sisse loginud)? Sõnumeid saadetakse aeglaselt (mitme sekundi tagant), et vältida piiranguid. Suurte serverite puhul võib see võtta kaua aega ja ületada serveri ajalimiidi."
      );
      if (!ok) return;
    }

    setBroadcastSubmitting(true);
    setBroadcastProgress(null);

    const CHUNK_SIZE = broadcastAudience === "guild" ? 20 : 45;

    let offset = 0;
    let aggSent = 0;
    let aggFail = 0;
    let lastAudience: string = broadcastAudience;

    try {
      while (true) {
        const body = JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          ctaLabel: broadcastCtaLabel,
          ctaUrl: broadcastCtaUrl,
          audience: broadcastAudience,
          chunkOffset: offset,
          chunkSize: CHUNK_SIZE,
        });

        const res = await fetch("/api/admin/member-broadcast?stream=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setBroadcastError(data.error || "Privaatsõnumite saatmine ebaõnnestus.");
          setBroadcastProgress(null);
          return;
        }

        const chunkResult = await consumeMemberBroadcastStream(res, aggSent, aggFail, setBroadcastProgress);

        if (chunkResult.err) {
          setBroadcastError(chunkResult.err);
          setBroadcastProgress(null);
          return;
        }

        lastAudience = chunkResult.streamAudience;

        if (chunkResult.partial) {
          const lp = chunkResult.lastLp;
          const scope = broadcastScopeLabel(lastAudience);
          if (lp && lp.current > 0) {
            const incomplete = lp.total > 0 && lp.current < lp.total;
            setBroadcastSuccess(
              incomplete
                ? `Osaline saatmine (serveri ajalimiit või ühenduse katkemine): ${lp.sent} sõnumit saadetud, ${lp.failed} ebaõnnestus — töödeldud ${lp.current} / ${lp.total} (${scope}). ${aggSent > 0 ? `Varasemad valmis partiid: ${aggSent} saadetud. ` : ""}Uuesti käivitamine võib katkenud partii kasutajatele sõnumi uuesti saata.`
                : `Saadetud ${lp.sent} Discordi privaatsõnumit (${scope}). ${lp.failed ? `${lp.failed} ebaõnnestus.` : ""} Lõplikku kinnitust ei saadud.`
            );
          } else {
            setBroadcastError("Ühendus katkes või saatmine ebaõnnestus.");
          }
          window.setTimeout(() => setBroadcastProgress(null), 1200);
          return;
        }

        if (!chunkResult.done) {
          setBroadcastError("Saatmine lõppes ilma tulemuseta. Kontrolli logisid.");
          setBroadcastProgress(null);
          return;
        }

        const d = chunkResult.done;
        aggSent += d.sent;
        aggFail += d.failed;
        const ft = d.fullTotal ?? d.attempted;
        const next = d.nextChunkOffset ?? offset + d.attempted;

        if (d.broadcastComplete || next >= ft || d.attempted === 0) {
          break;
        }

        offset = next;
        await new Promise((r) => setTimeout(r, 600));
      }

      const scope = broadcastScopeLabel(lastAudience);
      setBroadcastSuccess(
        `Saadetud ${aggSent} Discordi privaatsõnumit automaatsete partiidena (${scope}). ${aggFail ? `Kõikide partiide peale ebaõnnestus ${aggFail}.` : "Tõrkeid ei esinenud."}`
      );
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastCtaLabel("");
      setBroadcastCtaUrl("");
      window.setTimeout(() => setBroadcastProgress(null), 900);
    } catch {
      setBroadcastError("Ühendus katkes või saatmine ebaõnnestus.");
      setBroadcastProgress(null);
    } finally {
      setBroadcastSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Liikmete laadimine...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Siia lisatud liikmed saavad administraatori õigused ilma .env faili muutmata. Ainult <strong>peaadministraatorid</strong> (Discordi ID-d muutujas <code className="rounded bg-zinc-800 px-1">ADMIN_DISCORD_IDS</code>) saavad liikmeid lisada või eemaldada.
      </p>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="members-discord-id" className="text-xs font-medium text-zinc-400">
            Discord ID
          </label>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <input
              id="members-discord-id"
              type="text"
              value={discordId}
              onChange={(e) => {
                const val = e.target.value;
                setDiscordId(val);
                setLookupPreview(null);
                if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
                if (val.trim().length >= 17) {
                  lookupTimeoutRef.current = setTimeout(() => fetchLookup(val), 400);
                }
              }}
              onBlur={() => discordId.trim().length >= 17 && fetchLookup(discordId)}
              placeholder="nt 123456789012345678"
              className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--accent)] focus:outline-none lg:w-72"
            />
            {lookupLoading && <span className="text-xs text-zinc-500">Otsimine…</span>}
            {lookupPreview && !lookupLoading && (
              <span className="flex items-center gap-2 rounded bg-zinc-800/80 px-2 py-1 text-sm text-zinc-200">
                <DiscordAvatarImage
                  src={resolveDiscordAvatarUrl(discordId.trim(), lookupPreview.avatar, null)}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span>{lookupPreview.username}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="members-role" className="text-xs font-medium text-zinc-400">
            Roll
          </label>
          <select
            id="members-role"
            value={adminType}
            onChange={(e) => setAdminType(e.target.value as "team" | "jobs" | "rules" | "full")}
            className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-3 text-base text-zinc-100 focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="team">Tiim (whitelist + meeskond)</option>
            <option value="jobs">Töökohad + pood</option>
            <option value="rules">Reeglite haldur</option>
            {isFullAdmin && <option value="full">Peaadministraator (kõik)</option>}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="brand-bg w-full rounded-lg px-4 py-3 text-sm font-medium transition brand-bg-hover disabled:opacity-50 lg:w-auto"
        >
          {submitting ? "Lisamine…" : "Lisa liige"}
        </button>
      </form>

      {memberError && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{memberError}</p>
      )}
      {memberSuccess && (
        <p className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          {memberSuccess}
        </p>
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Külastajaid kokku</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{dashboard.stats.totalVisitors}</p>
              <p className="mt-1 text-sm text-zinc-500">Unikaalsed brauserid, mis on lehe avanud.</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Registreeritud liikmed</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{dashboard.stats.totalMembers}</p>
              <p className="mt-1 text-sm text-zinc-500">Liikmed, kes on Discordiga sisse loginud.</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Liikmeid võrgus</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{dashboard.stats.onlineMembers}</p>
              <p className="mt-1 text-sm text-zinc-500">Aktiivsed viimase {dashboard.stats.onlineWindowMinutes} minuti jooksul.</p>
            </div>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Saada Discordi privaatsõnumeid</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Saadab sinu boti kaudu <strong>ühe kasutaja kaupa</strong> koos pauside ja 429 ooteajaga. Suuremad sihtrühmad saadetakse <strong>automaatsete partiidena</strong> (järjestatud Discord ID järgi), et majutuse ajalimiidid (nt Vercel ~5 min) ei katkestaks saatmist poole pealt. Saajad peavad olema botiga samas serveris.{" "}
                <strong>Discordis võrgus</strong> kasutab reaalajas nimekirja käsuga <code className="rounded bg-zinc-800 px-1 text-xs">npm run discord:presence</code> (Presence + Server Members õigused). Väga suurte serverite puhul ei pruugi kõik võrgus olevad kasutajad botile nähtavad olla.
              </p>
            </div>
            <fieldset className="space-y-2">
              <legend className="sr-only">Sihtrühm</legend>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="broadcast-audience"
                  checked={broadcastAudience === "online_discord"}
                  onChange={() => setBroadcastAudience("online_discord")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-zinc-200">Discordis võrgus (roheline täpp / eemal / mitte segada)</span>
                  <span className="block text-zinc-500">
                    Gateway oleku hetktõmmisest:{" "}
                    <strong>{dashboard.broadcast?.discordOnline?.count ?? 0}</strong> inimkasutajat
                    {dashboard.broadcast?.discordOnline?.updatedAt
                      ? ` · uuendatud ${new Date(dashboard.broadcast.discordOnline.updatedAt).toLocaleString("et-EE")}`
                      : ""}
                    . Nõuab olekubotti + <code className="rounded bg-zinc-800 px-1 text-xs">DATABASE_URL</code>.
                  </span>
                  {(!dashboard.broadcast?.discordOnline?.fresh || (dashboard.broadcast?.discordOnline?.count ?? 0) < 1) && (
                    <span className="mt-1 block text-amber-500/90">
                      Käivita <code className="rounded bg-zinc-800 px-1 text-xs">npm run discord:presence</code> serveris, millel on ligipääs andmebaasile; luba{" "}
                      <strong>Presence</strong> ja <strong>Server Members</strong> õigused; oota, kuni ülalolev arv uueneb (~15 minuti jooksul).
                    </span>
                  )}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="broadcast-audience"
                  checked={broadcastAudience === "online_site"}
                  onChange={() => setBroadcastAudience("online_site")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-zinc-200">Ainult veebilehel võrgus</span>
                  <span className="block text-zinc-500">
                    Sama mis ülalpool <strong>Liikmeid võrgus</strong>: Discordiga sisse loginud ja aktiivsed viimase{" "}
                    {dashboard.stats.onlineWindowMinutes} minuti jooksul ({dashboard.stats.onlineMembers}) — mitte Discordi olek.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="broadcast-audience"
                  checked={broadcastAudience === "registered"}
                  onChange={() => setBroadcastAudience("registered")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-zinc-200">Kõik veebilehel registreeritud</span>
                  <span className="block text-zinc-500">
                    Kõik, kes on Discordiga sisse loginud ({dashboard.stats.totalMembers}).
                  </span>
                </span>
              </label>
              <label
                className={`flex items-start gap-2 text-sm ${
                  dashboard.broadcast?.guildConfigured ? "cursor-pointer text-zinc-300" : "cursor-not-allowed text-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="broadcast-audience"
                  checked={broadcastAudience === "guild"}
                  onChange={() => dashboard.broadcast?.guildConfigured && setBroadcastAudience("guild")}
                  disabled={!dashboard.broadcast?.guildConfigured}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-zinc-200">Kõik Discordi serveris (täielik nimekiri)</span>
                  <span className="block text-zinc-500">
                    Kõik inimliikmed serveris, mis on seotud muutujaga{" "}
                    <code className="rounded bg-zinc-800 px-1 text-xs">DISCORD_GUILD_ID</code>
                    {dashboard.broadcast?.approximateGuildMembers != null
                      ? ` (~${dashboard.broadcast.approximateGuildMembers} koos bottidega Discordi loenduse järgi).`
                      : "."}{" "}
                    Nõuab botil õigust{" "}
                    <strong>Server Members Intent</strong> (Developer Portal → Bot → Privileged Gateway Intents).
                  </span>
                  {!dashboard.broadcast?.guildConfigured && (
                    <span className="mt-1 block text-amber-500/90">
                      Selle valiku lubamiseks määra nii <code className="rounded bg-zinc-800 px-1 text-xs">DISCORD_BOT_TOKEN</code> kui ka{" "}
                      <code className="rounded bg-zinc-800 px-1 text-xs">DISCORD_GUILD_ID</code>.
                    </span>
                  )}
                </span>
              </label>
            </fieldset>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
                Pealkiri
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Kogukonna teadaanne"
                  className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
                Nupu tekst (valikuline)
                <input
                  type="text"
                  value={broadcastCtaLabel}
                  onChange={(e) => setBroadcastCtaLabel(e.target.value)}
                  placeholder="Ava veebileht"
                  className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
              Sõnum
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={5}
                placeholder="Kirjuta privaatsõnum, mille soovid kõigile liikmetele saata."
                className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
              Nupu link / URL (valikuline)
              <input
                type="url"
                value={broadcastCtaUrl}
                onChange={(e) => setBroadcastCtaUrl(e.target.value)}
                placeholder="https://example.com"
                className="rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </label>
            {broadcastProgress !== null && (
              <div className="w-full space-y-2">
                <div
                  className="h-4 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-600/50"
                  aria-label="Saatmine edenemine"
                >
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={broadcastProgress.total}
                    aria-valuenow={broadcastProgress.current}
                    className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 transition-[width] duration-500 ease-out"
                    style={{
                      width: `${
                        broadcastProgress.total > 0
                          ? Math.min(100, (broadcastProgress.current / broadcastProgress.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="text-center text-xs text-zinc-400">
                  {broadcastProgress.current} / {broadcastProgress.total} töödeldud · {broadcastProgress.sent} saadetud ·{" "}
                  {broadcastProgress.failed} ebaõnnestus
                </p>
              </div>
            )}
            {broadcastError && (
              <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{broadcastError}</p>
            )}
            {broadcastSuccess && (
              <p className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                {broadcastSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={
                broadcastSubmitting ||
                (broadcastAudience === "registered" && !dashboard.members.length) ||
                (broadcastAudience === "online_site" && dashboard.stats.onlineMembers < 1) ||
                (broadcastAudience === "online_discord" &&
                  (!dashboard.broadcast?.discordOnline?.fresh || (dashboard.broadcast?.discordOnline?.count ?? 0) < 1))
              }
              className="brand-bg rounded-lg px-4 py-2 text-sm font-medium transition brand-bg-hover disabled:opacity-50"
            >
              {broadcastSubmitting
                ? "Saatmine…"
                : broadcastAudience === "guild"
                  ? `Saada sõnum kõigile Discordi serveris${
                      dashboard.broadcast?.approximateGuildMembers != null
                        ? ` (~${dashboard.broadcast.approximateGuildMembers})`
                        : ""
                    }`
                  : broadcastAudience === "online_discord"
                    ? `Saada sõnum Discordis võrgus olijatele (${dashboard.broadcast?.discordOnline?.count ?? 0})`
                    : broadcastAudience === "online_site"
                      ? `Saada sõnum veebilehel võrgus olijatele (${dashboard.stats.onlineMembers})`
                      : `Saada sõnum kõigile registreeritutele (${dashboard.stats.totalMembers})`}
            </button>
          </form>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-300">Kõik registreeritud liikmed</h3>
            {dashboard.members.length === 0 ? (
              <p className="text-sm text-zinc-500">Ükski registreeritud liige pole veel sisse loginud.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {dashboard.members.map((member) => {
                    const online = isOnline(member.lastActiveAt, dashboard.stats.onlineWindowMinutes);
                    const effectiveRole = member.siteRole ?? member.adminType;
                    return (
                      <article key={member.id} className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
                        <div className="flex items-center gap-3">
                          <DiscordAvatarImage
                            src={resolveDiscordAvatarUrl(member.discordId, member.avatar, member.discriminator)}
                            fallbackDiscriminator={member.discriminator}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-zinc-100">{member.username}</p>
                            <p className="truncate font-mono text-xs text-zinc-500">{member.discordId}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Ligipääs</p>
                            <p className="text-sm text-zinc-300">{formatRoleLabel(effectiveRole)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Olek</p>
                            <p className={`text-sm ${online ? "text-emerald-400" : "text-zinc-400"}`}>{online ? "Võrgus" : "Võrgust väljas"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Liitunud</p>
                            <p className="text-sm text-zinc-300">{new Date(member.createdAt).toLocaleDateString("et-EE")}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Viimati aktiivne</p>
                            <p className="text-sm text-zinc-300">
                              {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleString("et-EE") : "Tegevus puudub"}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto rounded-lg border border-zinc-700 md:block">
                  <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-800/80">
                      <th className="px-4 py-2 font-medium text-zinc-400">#</th>
                      <th className="px-4 py-2 font-medium text-zinc-400">Liige</th>
                      <th className="px-4 py-2 font-medium text-zinc-400">Ligipääs</th>
                      <th className="px-4 py-2 font-medium text-zinc-400">Liitunud</th>
                      <th className="px-4 py-2 font-medium text-zinc-400">Olek</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.members.map((member) => {
                      const online = isOnline(member.lastActiveAt, dashboard.stats.onlineWindowMinutes);
                      const effectiveRole = member.siteRole ?? member.adminType;
                      return (
                        <tr key={member.id} className="border-b border-zinc-800 last:border-0">
                          <td className="px-4 py-2 font-mono text-xs text-zinc-500">{member.sequence}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <DiscordAvatarImage
                                src={resolveDiscordAvatarUrl(member.discordId, member.avatar, member.discriminator)}
                                fallbackDiscriminator={member.discriminator}
                                alt=""
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="flex flex-col">
                                <span className="text-zinc-200">{member.username}</span>
                                <span className="font-mono text-xs text-zinc-500">{member.discordId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-zinc-300">
                            <div className="flex flex-col">
                              <span>{formatRoleLabel(effectiveRole)}</span>
                              {member.isAdmin && !member.siteRole && member.adminType && (
                                <span className="text-xs text-zinc-500">Env administraator</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-zinc-500">{new Date(member.createdAt).toLocaleDateString("et-EE")}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className={online ? "text-emerald-400" : "text-zinc-400"}>
                                {online ? "Võrgus" : "Võrgust väljas"}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleString("et-EE") : "Tegevus puudub"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Lehel lisatud liikmed ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">Lehe kaudu pole veel ühtegi liiget lisatud.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {members.map((m) => (
                <article key={m.id} className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
                  <div className="flex items-center gap-3">
                    <DiscordAvatarImage
                      src={resolveDiscordAvatarUrl(m.discordId, m.user?.avatar ?? null, m.user?.discriminator ?? null)}
                      fallbackDiscriminator={m.user?.discriminator ?? null}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-zinc-100">{m.user?.username ?? "Teadmata"}</p>
                      <p className="truncate font-mono text-xs text-zinc-500">{m.discordId}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Roll</p>
                      <p className="text-sm text-zinc-300">{formatRoleLabel(m.adminType)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Lisas</p>
                      <p className="text-sm text-zinc-300">{m.addedBy?.username ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Lisatud</p>
                      <p className="text-sm text-zinc-300">{new Date(m.createdAt).toLocaleDateString("et-EE")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    className="mt-4 w-full rounded-lg border border-red-500/40 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    Eemalda
                  </button>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-zinc-700 md:block">
              <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="px-4 py-2 font-medium text-zinc-400">Liige</th>
                  <th className="px-4 py-2 font-medium text-zinc-400">Roll</th>
                  <th className="px-4 py-2 font-medium text-zinc-400">Lisas</th>
                  <th className="px-4 py-2 font-medium text-zinc-400">Lisatud</th>
                  <th className="px-4 py-2 font-medium text-zinc-400"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-800 last:border-0">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <DiscordAvatarImage
                          src={resolveDiscordAvatarUrl(m.discordId, m.user?.avatar ?? null, m.user?.discriminator ?? null)}
                          fallbackDiscriminator={m.user?.discriminator ?? null}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-zinc-200">{m.user?.username ?? "Teadmata"}</span>
                          <span className="font-mono text-xs text-zinc-500">{m.discordId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-zinc-300">{formatRoleLabel(m.adminType)}</td>
                    <td className="px-4 py-2 text-zinc-400">{m.addedBy?.username ?? "—"}</td>
                    <td className="px-4 py-2 text-zinc-500">
                      {new Date(m.createdAt).toLocaleDateString("et-EE")}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Eemalda
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { appConfig } from "@/config/app.config";
import { useBranding } from "@/components/branding-provider";

export function Header() {
  const { data: session, status } = useSession();
  const branding = useBranding();
  const pathname = usePathname();
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { href: "/", label: "Avaleht" },
    { href: "/community", label: "Kogukond" },
    { href: "/rules", label: "Reeglid" },
    { href: "/store", label: branding.storeNavLabel || "Pood" },
  ];

  const signedInLinks = [
    ...publicLinks,
    { href: "/applications", label: "Minu avaldused" },
    { href: "/apply", label: branding.whitelistNavLabel || "Whitelist" },
    { href: "/apply/staff", label: "Meeskond" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const navLinks = session ? signedInLinks : publicLinks;

  const logoBlock = (
    <Link
      href="/"
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-3 px-2 py-2 font-bold text-zinc-100"
    >
      {branding.logoDataUrl ? (
        <img
          src={branding.logoDataUrl}
          alt={`${branding.siteName} logo`}
          className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-md"
          width={44}
          height={44}
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl brand-bg text-base font-extrabold shadow-md">
          {branding.headerIcon || appConfig.headerIcon}
        </span>
      )}
      <span className="truncate text-base tracking-tight">{branding.siteName}</span>
    </Link>
  );

  const renderLinks = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1.5" aria-label="Külgmenüü">
      {status === "loading" ? (
        <span className="px-3 py-2 text-sm text-zinc-500">Laadimine…</span>
      ) : (
        navLinks.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-white shadow-sm"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full transition ${
                  isActive ? "bg-[var(--accent)]" : "bg-zinc-700"
                }`}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })
      )}
    </nav>
  );

  const authBlock = (
    <div className="border-t border-zinc-800/80 pt-4">
      {status === "loading" ? null : session ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-3 py-2.5">
            {(session.user as { image?: string | null })?.image ? (
              <img
                src={(session.user as { image: string }).image}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover"
                width={36}
                height={36}
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                {(session.user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">
                {session.user?.name}
              </p>
              <p className="text-[11px] text-emerald-400">Sisse logitud</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            Logi välja
          </button>
        </div>
      ) : (
        <Link
          href="/api/auth/signin/discord"
          className="flex w-full items-center justify-center rounded-xl bg-[#5865f2] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#4752c4]"
        >
          Logi sisse Discordiga
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* MOBIILIVAADE: Ülemine riba + avanev sahtel */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur md:hidden">
        {logoBlock}
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Sulge" : "Menüü"}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between bg-zinc-950/98 px-4 pt-20 pb-6 md:hidden">
          {renderLinks(() => setMobileOpen(false))}
          {authBlock}
        </div>
      )}

      {/* ARVUTIVAADE: Vasakpoolne fikseeritud külgmenüü (Sidebar) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-zinc-800/80 bg-zinc-950/95 p-4 md:flex">
        <div className="space-y-6 overflow-y-auto">
          {logoBlock}
          <div className="border-t border-zinc-800/80 pt-4">{renderLinks()}</div>
        </div>
        {authBlock}
      </aside>
    </>
  );
}

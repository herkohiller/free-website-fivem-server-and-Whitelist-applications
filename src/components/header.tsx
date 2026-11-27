"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useBranding } from "@/components/branding-provider";

export function Header() {
  const { data: session, status } = useSession();
  const branding = useBranding();
  const pathname = usePathname();
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (status !== "authenticated" || !session?.user) {
    if (status === "loading") return null;
    return (
      <div className="fixed top-5 right-5 z-50">
        <Link
          href="/api/auth/signin/discord"
          className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/30 transition hover:bg-[#4752C4]"
        >
          Logi sisse Discordiga
        </Link>
      </div>
    );
  }

    const navLinks = [
    { href: "/", label: "Avaleht", icon: "🏠" },
    { href: "/rules", label: "Reeglid", icon: "📜" },
    { href: "/applications", label: "Minu avaldused", icon: "📄" },
    { href: "/tickets", label: "Minu ticketid", icon: "🎫" },
    { href: "/apply", label: branding.whitelistNavLabel || "Whitelist", icon: "✍️" },
    { href: "/apply/staff", label: "Meeskond", icon: "🛡️" },
  ];


  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin", icon: "⚙️" });
  }

  return (
    <>
      {/* Mobiilivaate päis */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 items-center gap-3 font-bold text-zinc-100"
        >
          <img
            src="/taust2.png"
            alt={`${branding.siteName} logo`}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
          <span className="truncate text-base tracking-tight">{branding.siteName}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Sulge" : "Menüü"}
        </button>
      </header>

      {/* Mobiilivaate avatud menüü */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between bg-black/98 px-4 pt-20 pb-6 md:hidden">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Arvutivaate külgmenüü */}
      <aside
        className={`relative sticky top-0 z-30 hidden h-screen shrink-0 flex-col justify-between border-r border-zinc-800/80 bg-black p-3.5 transition-all duration-300 md:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {/* Ilus ümmargune nupp täpselt menüü paremal äärel */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Ava menüü" : "Lükka menüü kokku"}
          className="absolute top-6 -right-3.5 z-40 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-200 shadow-lg transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          {collapsed ? "›" : "‹"}
        </button>

        <div className="space-y-5 overflow-hidden">
          {/* Logo ja nimi */}
          <Link
            href="/"
            className={`flex items-center gap-3 py-1 font-bold text-zinc-100 ${
              collapsed ? "justify-center" : "px-1"
            }`}
            title={branding.siteName}
          >
            <img
              src="/taust2.png"
              alt={`${branding.siteName} logo`}
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-md"
            />
            {!collapsed && (
              <span className="min-w-0 truncate text-base tracking-tight">
                {branding.siteName}
              </span>
            )}
          </Link>

          {/* Lingid */}
          <nav className="flex flex-col gap-1.5 border-t border-zinc-800/80 pt-4" aria-label="Külgmenüü">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition ${
                    collapsed ? "justify-center px-0" : "gap-3 px-3"
                  } ${
                    isActive
                      ? "border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-white shadow-sm"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <span className="text-base leading-none">{link.icon}</span>
                  {!collapsed && <span className="truncate">{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Kasutaja plokk all */}
        <div className="border-t border-zinc-800/80 pt-4">
          <div className="space-y-2.5">
            <div
              className={`flex items-center rounded-xl border border-zinc-800/80 bg-zinc-900/70 py-2 ${
                collapsed ? "justify-center px-0" : "gap-3 px-2.5"
              }`}
              title={session.user?.name || ""}
            >
              {(session.user as { image?: string | null })?.image ? (
                <img
                  src={(session.user as { image: string }).image}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                  {(session.user?.name || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {session.user?.name}
                  </p>
                  <p className="text-[11px] text-emerald-400">Sisse logitud</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Logi välja"
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900 px-2 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              {collapsed ? "🚪" : "Logi välja"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

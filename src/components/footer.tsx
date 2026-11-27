"use client";

import Link from "next/link";
import { useBranding } from "@/components/branding-provider";

export function Footer() {
  const year = new Date().getFullYear();
  const branding = useBranding();

  return (
    <footer className="relative z-10 mt-12 border-t border-white/10 bg-black text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:py-12">
        {/* Bränd ja kirjeldus */}
        <section className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>{branding.footerBadgeLabel || "STREETS OF SAN ANDREAS"}</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-400">
              {branding.footerTagline || "TÄNAVATELT PÕLVKONDADENI"}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-zinc-400">
              {branding.footerText ||
                "Koge kaasahaaravat GTA V rollimängu unikaalsete süsteemide, tõsise RP ja ühtehoidva kogukonnaga."}
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {branding.serverName || "Streets of San Andreas"} © {year}
            </span>
          </div>
        </section>

        {/* Navigatsioon */}
        <section className="flex-1 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            {branding.footerNavHeading || "NAVIGATSIOON"}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="transition hover:text-rose-400">
                Avaleht
              </Link>
            </li>
            <li>
              <Link href="/rules" className="transition hover:text-rose-400">
                Serveri reeglid
              </Link>
            </li>
            <li>
              <Link href="/apply" className="transition hover:text-rose-400">
                Whitelist avaldus
              </Link>
            </li>
            <li>
              <Link href="/applications" className="transition hover:text-rose-400">
                Minu avaldused
              </Link>
            </li>
            <li>
              <Link href="/apply/staff" className="transition hover:text-rose-400">
                Meeskonna avaldus
              </Link>
            </li>
          </ul>
        </section>

        {/* Discordi kaart */}
        <section className="flex-1 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            {branding.footerConnectHeading || "ÜHENDU"}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-rose-500/30 bg-zinc-900/70 shadow-xl">
            <div className="border-b border-white/10 bg-zinc-950/70 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
              {branding.footerDiscordCardTitle || "DISCORD"}
            </div>
            <div className="px-4 py-4 text-sm">
              <p className="mb-4 text-zinc-300">
                {(
                  branding.footerConnectBlurb ||
                  "Liitu {serverName} Discordiga, et saada whitelist, küsida küsimusi ja olla kursis uuendustega."
                ).replace("{serverName}", branding.serverName || "Streets of San Andreas")}
              </p>
              <Link
                href={branding.discordLink || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/25 transition hover:bg-[#4752C4]"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-black/20">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292 14.5 14.5 0 0 0 4.04 1.42 14.55 14.55 0 0 0 4.034-1.42 10.37 10.37 0 0 0 .373.292.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </span>
                {branding.footerConnectButtonText || "Liitu Discordiga"}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Alumine riba */}
      <div className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] text-zinc-500 md:flex-row">
          <p className="text-center md:text-left">
            © {year} {branding.serverName || "Streets of San Andreas"}.{" "}
            {branding.footerCopyrightNote ||
              "Ei ole seotud ettevõtetega Rockstar Games ega Take-Two Interactive."}
          </p>
          <p className="text-center text-xs text-zinc-500 md:text-right">
            Developed by{" "}
            <span className="font-semibold text-zinc-200">herkzz</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

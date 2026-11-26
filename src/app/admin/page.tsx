"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminApplicationList } from "@/components/admin-application-list";
import { AdminAuditLogList } from "@/components/admin-audit-log-list";
import { AdminBrandingSettings } from "@/components/admin-branding-settings";
import { AdminFormQuestionManager } from "@/components/admin-form-question-manager";
import { AdminJobApplicationList } from "@/components/admin-job-application-list";
import { AdminStaffApplicationList } from "@/components/admin-staff-application-list";
import { AdminMembersList } from "@/components/admin-members-list";
import { AdminStoreManager } from "@/components/admin-store-manager";
import { AdminRulesManager } from "@/components/admin-rules-manager";
import { canManageRules as userCanManageRules, canViewAuditLogs } from "@/lib/admin-permissions";
import { canManageStore } from "@/lib/store";

type AdminTab =
  | "whitelist"
  | "jobs"
  | "staff"
  | "store"
  | "members"
  | "branding"
  | "logs"
  | "forms"
  | "rules";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("whitelist");

  const adminType = (session?.user as { adminType?: string | null } | undefined)?.adminType;
  const canManageWhitelist = adminType === "team" || adminType === "full";
  const canManageJobs = adminType === "jobs" || adminType === "full";
  const canManageStaff = adminType === "team" || adminType === "full";
  const canManageStoreCatalog = canManageStore(adminType);
  const canManageMembers = adminType === "full";
  const canManageBranding = adminType === "full";
  const canManageRules = userCanManageRules(adminType);
  const canViewLogs = canViewAuditLogs(adminType);
  const canManageForms = canManageWhitelist || canManageStaff;
  const activeTab = useMemo<AdminTab>(() => {
    if (tab === "whitelist" && canManageWhitelist) return tab;
    if (tab === "jobs" && canManageJobs) return tab;
    if (tab === "staff" && canManageStaff) return tab;
    if (tab === "store" && canManageStoreCatalog) return tab;
    if (tab === "members" && canManageMembers) return tab;
    if (tab === "branding" && canManageBranding) return tab;
    if (tab === "rules" && canManageRules) return tab;
    if (tab === "logs" && canViewLogs) return tab;
    if (tab === "forms" && canManageForms) return tab;
    if (canManageWhitelist) return "whitelist";
    if (canManageJobs) return "jobs";
    if (canManageStaff) return "staff";
    if (canManageStoreCatalog) return "store";
    if (canManageMembers) return "members";
    if (canManageBranding) return "branding";
    if (canManageRules) return "rules";
    if (canManageForms) return "forms";
    if (canViewLogs) return "logs";
    return "members";
  }, [
    tab,
    canManageWhitelist,
    canManageJobs,
    canManageStaff,
    canManageStoreCatalog,
    canManageMembers,
    canManageBranding,
    canManageRules,
    canViewLogs,
    canManageForms,
  ]);
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/admin");
      return;
    }
    if (status === "authenticated") {
      const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
      if (!isAdmin) {
        const t = setTimeout(() => router.replace("/"), 10000);
        return () => clearTimeout(t);
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-500">Laadimine...</p>
      </div>
    );
  }

  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;

  if (session && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-2 text-lg font-semibold text-amber-400">Vajalik on administraatori ligipääs</h2>
        <p className="mb-3 text-sm text-zinc-300">
          Sinu konto ei ole administraatorite nimekirjas. Admin-paneeli ligipääsuks:
        </p>
        <ol className="mb-4 list-inside list-decimal space-y-1 text-sm text-zinc-400">
          <li>Palu olemasoleval peakorraldajal lisada sind jaotises <strong>Admin → Halda liikmeid</strong>, või lisa oma Discord ID serveri keskkonnamuutujatesse.</li>
          {discordId && (
            <li className="mt-2 rounded bg-zinc-800/80 px-2 py-1 font-mono text-amber-300">
              Sinu Discord ID: <strong>{discordId}</strong>
            </li>
          )}
          <li>
            Määra <code className="rounded bg-zinc-800 px-1">ADMIN_DISCORD_IDS</code> (või{" "}
            <code className="rounded bg-zinc-800 px-1">TEAM_ADMIN_DISCORD_IDS</code> /{" "}
            <code className="rounded bg-zinc-800 px-1">JOBS_ADMIN_DISCORD_IDS</code> /{" "}
            <code className="rounded bg-zinc-800 px-1">RULES_ADMIN_DISCORD_IDS</code>) Verceli projekti seadetes (Environment Variables).
          </li>
          <li>Tee Redeploy, logi korra välja ja uuesti sisse.</li>
        </ol>
        <p className="text-xs text-zinc-500">
          Suuname sind mõne sekundi pärast avalehele…
        </p>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin</h1>
      <p className="mb-2 text-zinc-600 dark:text-zinc-400">
        {[canManageWhitelist && "whitelist", canManageJobs && "töökohad", canManageStaff && "meeskond", canManageStoreCatalog && "poe kataloog", canManageForms && "vormid", canManageBranding && "bränding", canManageRules && "reeglid", canViewLogs && "logid"]
          .filter(Boolean)
          .join(", ")}
        {" "}— halduspaneel.
      </p>
      {!canManageStaff && (canManageWhitelist || canManageJobs) && (
        <p className="mb-6 text-xs text-amber-600/90 dark:text-amber-400/90">
          Meeskonna avalduste ülevaatamiseks lisa oma Discord ID muutujasse <code className="rounded bg-zinc-800 px-1">ADMIN_DISCORD_IDS</code> või <code className="rounded bg-zinc-800 px-1">TEAM_ADMIN_DISCORD_IDS</code> ja logi uuesti sisse.
        </p>
      )}
      {canManageStaff && (
        <p className="mb-6 text-xs text-zinc-500">
          Lehelt /apply/staff saadetud meeskonna avaldused ilmuvad allolevasse <strong>Meeskonna avaldused</strong> vahekaarti.
        </p>
      )}
      <div className="mb-4 grid gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800 sm:flex sm:flex-wrap sm:pb-0">
        {canManageWhitelist && (
          <button
            type="button"
            onClick={() => setTab("whitelist")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "whitelist"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Whitelist (tiim)
          </button>
        )}
        {canManageJobs && (
          <button
            type="button"
            onClick={() => setTab("jobs")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "jobs"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Töökohad ja ametid
          </button>
        )}
        {canManageStaff && (
          <button
            type="button"
            onClick={() => setTab("staff")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "staff"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Meeskonna avaldused
          </button>
        )}
        {canManageStoreCatalog && (
          <button
            type="button"
            onClick={() => setTab("store")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "store"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Poe kataloog
          </button>
        )}
        {canManageMembers && (
          <button
            type="button"
            onClick={() => setTab("members")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "members"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Halda liikmeid
          </button>
        )}
        {canManageBranding && (
          <button
            type="button"
            onClick={() => setTab("branding")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "branding"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Bränding ja välimus
          </button>
        )}
        {canManageRules && (
          <button
            type="button"
            onClick={() => setTab("rules")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "rules"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Reeglid
          </button>
        )}
        {canManageForms && (
          <button
            type="button"
            onClick={() => setTab("forms")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "forms"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Vormid ja küsimused
          </button>
        )}
        {canViewLogs && (
          <button
            type="button"
            onClick={() => setTab("logs")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:py-2 ${
              activeTab === "logs"
                ? "brand-border brand-text bg-zinc-100/80 dark:bg-zinc-900/80"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Logid
          </button>
        )}
      </div>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
        Vaade: <strong className="text-zinc-600 dark:text-zinc-400">
          {activeTab === "whitelist"
            ? "Whitelist (tiim)"
            : activeTab === "jobs"
              ? "Töökohad ja ametid"
              : activeTab === "staff"
                ? "Meeskonna avaldused"
                : activeTab === "store"
                  ? "Poe kataloog"
                  : activeTab === "members"
                    ? "Halda liikmeid"
                    : activeTab === "branding"
                      ? "Bränding ja välimus"
                      : activeTab === "rules"
                        ? "Reeglid"
                        : activeTab === "forms"
                          ? "Vormid ja küsimused"
                          : "Logid"}
        </strong>
        {activeTab !== "staff" && canManageStaff && activeTab !== "members" && activeTab !== "store" && " — Meeskonna avaldused leiad ülalolevalt vahekaardilt."}
      </p>

      {activeTab === "whitelist" && <AdminApplicationList />}
      {activeTab === "jobs" && <AdminJobApplicationList />}
      {activeTab === "staff" && <AdminStaffApplicationList />}
      {activeTab === "store" && <AdminStoreManager />}
      {activeTab === "members" && <AdminMembersList isFullAdmin={adminType === "full"} />}
      {activeTab === "branding" && <AdminBrandingSettings />}
      {activeTab === "rules" && <AdminRulesManager />}
      {activeTab === "forms" && <AdminFormQuestionManager />}
      {activeTab === "logs" && <AdminAuditLogList />}
    </div>
  );
}

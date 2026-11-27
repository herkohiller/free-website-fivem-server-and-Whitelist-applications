"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminApplicationList } from "@/components/admin-application-list";
import { AdminStaffApplicationList } from "@/components/admin-staff-application-list";
import { AdminRulesManager } from "@/components/admin-rules-manager";
import { AdminMembersList } from "@/components/admin-members-list";
import { AdminBrandingSettings } from "@/components/admin-branding-settings";
import { AdminAuditLogList } from "@/components/admin-audit-log-list";

type AdminTab =
  | "whitelist"
  | "staff"
  | "rules"
  | "members"
  | "branding"
  | "logs";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "whitelist", label: "Whitelist avaldused" },
  { id: "staff", label: "Meeskonna avaldused" },
  { id: "rules", label: "Reeglid" },
  { id: "members", label: "Liikmed" },
  { id: "branding", label: "Bränding ja välimus" },
  { id: "logs", label: "Auditilogid" },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("whitelist");

  const user = session?.user as
    | { isAdmin?: boolean; adminType?: string | null }
    | undefined;
  const isAdmin = Boolean(user?.isAdmin);
  const isFullAdmin =
    user?.adminType === "owner" ||
    user?.adminType === "full" ||
    !user?.adminType;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/admin");
    } else if (!isAdmin) {
      router.replace("/");
    }
  }, [mounted, status, isAdmin, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-400">Administraatori paneeli laadimine...</p>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <span className="inline-block rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-400">
            Juhtkond
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Administraatori paneel
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Halda whitelist- ja meeskonna avaldusi, serveri reegleid, liikmeid ja veebilehe välimust.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "border border-white/10 bg-zinc-900/55 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl">
          {activeTab === "whitelist" && <AdminApplicationList />}
          {activeTab === "staff" && <AdminStaffApplicationList />}
          {activeTab === "rules" && <AdminRulesManager />}
        {activeTab === "members" && (
  <AdminMembersList isFullAdmin={isFullAdmin} />
)}

          {activeTab === "branding" && <AdminBrandingSettings />}
          {activeTab === "logs" && <AdminAuditLogList />}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationForm } from "@/components/application-form";
import { useBranding } from "@/components/branding-provider";

export default function ApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const branding = useBranding();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.replace("/api/auth/signin/discord?callbackUrl=/apply");
    }
  }, [mounted, status, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-500">Laadimine...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">{branding.whitelistNavLabel}</h1>
      <p className="mb-8 text-zinc-400">
        Täida allolev vorm, et taotleda whitelisti. Vaatame selle üle ja anname sulle Discordis teada.
      </p>
      <ApplicationForm />
    </div>
  );
}

import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { CSSProperties } from "react";
import { BrandingProvider } from "@/components/branding-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/toast";
import { TopBanner } from "@/components/top-banner";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteActivityTracker } from "@/components/site-activity-tracker";
import { getBrandingCssVariables } from "@/lib/branding";
import { getBrandingSettings } from "@/lib/site-settings";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Streets of San Andreas RP | Kogukond ja avaldused",
  description:
    "Liitu Streets of San Andreas RP serveriga. Esita whitelist-avaldus, tutvu reeglitega ja liitu kogukonnaga.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBrandingSettings();
  const brandingCssVariables = getBrandingCssVariables(branding);

  return (
    <html lang="et" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100 antialiased`}
        style={brandingCssVariables as CSSProperties}
      >
        <BrandingProvider initialSettings={branding}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
            <AuthSessionProvider>
              <ToastProvider>
                <SiteActivityTracker />
                <TopBanner />
                <div className="flex min-h-screen flex-1 flex-col md:flex-row">
                  <Header />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex-1 w-full">{children}</main>
                    <Footer />
                  </div>
                </div>
              </ToastProvider>
            </AuthSessionProvider>
          </ThemeProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}

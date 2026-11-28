import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type StoreItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  badge: string;
  tebexUrl: string;
  features: string[];
};

// ASENDA SIIN HINNAD JA OMA TEBEXI PAKETTIDE LINGID:
const STORE_ITEMS: StoreItem[] = [
  {
    id: "eritellimus",
    category: "Sõidukid",
    title: "Eritellimus",
    description:
      "Soeta endale ainulaadne lore-friendly sõiduk, mis valmib vastavalt sinu soovidele ja sobitub loomulikult serveri keskkonda.",
    price: "25.00 €",
    duration: "6 KUUD / PÜSIV",
    badge: "POPULAARNE",
    tebexUrl: process.env.NEXT_PUBLIC_TEBEX_ERITELLIMUS_URL || "https://tebex.io",
    features: [
      "Lore-friendly mudel vastavalt soovile",
      "Kohandatud numbrimärk hinna sees",
      "Kiire paigaldus serverisse",
    ],
  },
  {
    id: "teie-karakter",
    category: "Karakter",
    title: "Teie karakter",
    description:
      "Ainulaadne kohandatud karakteri välimus (Custom Ped) või eksklusiivsed riided, et sinu tegelane eristuks linnapildis.",
    price: "15.00 €",
    duration: "PÜSIV",
    badge: "EKSKLUSIIVNE",
    tebexUrl: process.env.NEXT_PUBLIC_TEBEX_KARAKTER_URL || "https://tebex.io",
    features: [
      "Unikaalne Custom Ped mudel",
      "Isikupärane stiil ja detailid",
      "Püsiv ligipääs sinu kontole",
    ],
  },
  {
    id: "custom-mlo",
    category: "Kinnisvara",
    title: "Custom MLO",
    description:
      "Sinu ettevõttele, gängile või kodule loodud eksklusiivne siseruum (MLO) soovitud asukohas Los Santoses.",
    price: "35.00 €",
    duration: "PÜSIV",
    badge: "PREMIUM",
    tebexUrl: process.env.NEXT_PUBLIC_TEBEX_MLO_URL || "https://tebex.io",
    features: [
      "Sinu valitud asukoht kaardil",
      "Optimeeritud FPS ja sujuv töö",
      "Privaatsed ukselukud ja panipaigad",
    ],
  },
];

export default async function PoodPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),_transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* Päis */}
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-zinc-900/55 p-6 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30">
                STREETS OF SAN ANDREAS
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Serveri <span className="text-rose-500">Pood</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Toeta serveri arengut ja soeta endale eritellimus, unikaalne karakter või oma MLO.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              ← Tagasi avalehele
            </Link>
          </div>
        </header>

        {/* Toodete kaardid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STORE_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:border-rose-500/40 hover:bg-zinc-900/80"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                    {item.category}
                  </span>
                  <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-rose-300 ring-1 ring-inset ring-rose-500/30">
                    {item.badge}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-white group-hover:text-rose-400 transition">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>

                <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-zinc-300">
                  {item.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Hind
                    </p>
                    <p className="text-2xl font-black text-white">{item.price}</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400">
                    {item.duration}
                  </span>
                </div>

                <a
                  href={item.tebexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 active:scale-[0.99]"
                >
                  Osta kohe →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Info kast */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-center text-xs text-zinc-400 backdrop-blur-md">
          Pärast ostu sooritamist Tebexi keskkonnas ava meie Discordi serveris <strong className="text-zinc-200">Ticket</strong>, et edastada oma tellimuse detailid (soovitud auto mudel, ped või MLO asukoht).
        </div>
      </div>
    </div>
  );
}

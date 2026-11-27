"use client";

type Leader = {
  name: string;
  image?: string; // Valikuline: nt "/juht1.png" (kaustast public) või pildi URL
};

// 👇 PANE SIIA OMA JUHTKONNA LIIKMETE NIMED (JA SOOVI KORRAL PILDID):
const LEADERSHIP_MEMBERS: Leader[] = [
  {
    name: "Esimene nimi",
    // image: "/juht1.png",
  },
  {
    name: "Teine nimi",
    // image: "/juht2.png",
  },
  {
    name: "Kolmas nimi",
    // image: "/juht3.png",
  },
  {
    name: "Neljas nimi",
    // image: "/juht4.png",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white">
      {/* Taustapilt koos tumeda hajutusega */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 blur-[2px]"
        style={{ backgroundImage: "url('/taust2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/85 to-zinc-950" />

      {/* 1. ÜLEMINE VAADE (HERO) – AINULT PEALKIRI, TSITAAT JA NOOL */}
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
          {LEADERSHIP_MEMBERS.map((leader, index) => (
            <div
              key={index}
              className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Profiilipilt või nimetäht */}
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl">
                {leader.image ? (
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800/80 to-zinc-950 text-5xl font-extrabold text-orange-500/80">
                    {leader.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Nimi */}
              <h3 className="mt-4 text-lg font-bold text-white">
                {leader.name}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

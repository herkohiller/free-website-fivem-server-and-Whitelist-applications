import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED_PACKAGES: Record<string, number> = {
  "teine-karakter": 7841511,
  "eritellimus": 7841514,
  "custom-mlo": 7841515,
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Pead olema sisse logitud." }, { status: 401 });
    }

    const body = (await req.json()) as { itemId?: string };
    const packageId = body.itemId ? ALLOWED_PACKAGES[body.itemId] : undefined;

    if (!packageId) {
      return NextResponse.json({ error: "Vigane toode." }, { status: 400 });
    }

    const token =
      process.env.TEBEX_PUBLIC_TOKEN || process.env.NEXT_PUBLIC_TEBEX_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Tebex API võti (TEBEX_PUBLIC_TOKEN) on seadistamata." },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "https://streetsofsanandreas.ee";

    // 1. Loome Tebex Headless ostukorvi
    const basketRes = await fetch(
      `https://tebex.io{encodeURIComponent(token)}/baskets`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complete_url: `${baseUrl}/tickets`,
          cancel_url: `${baseUrl}/pood`,
          custom: {
            discord_name: session.user.name || "Mängija",
            discord_email: session.user.email || "",
          },
        }),
      }
    );

    if (!basketRes.ok) {
      const errText = await basketRes.text();
      return NextResponse.json(
        { error: `Tebex ostukorvi viga: ${errText}` },
        { status: 502 }
      );
    }

    const basketJson = (await basketRes.json()) as {
      data?: { ident?: string };
    };
    const basketIdent = basketJson.data?.ident;

    if (!basketIdent) {
      return NextResponse.json(
        { error: "Tebex ei tagastanud ostukorvi ID-d." },
        { status: 502 }
      );
    }

    // 2. Lisame valitud paketi ostukorvi
    const addPkgRes = await fetch(
      `https://tebex.io{encodeURIComponent(basketIdent)}/packages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          quantity: 1,
        }),
      }
    );

    if (!addPkgRes.ok) {
      const errText = await addPkgRes.text();
      return NextResponse.json(
        { error: `Paketi lisamise viga: ${errText}` },
        { status: 502 }
      );
    }

    const finalBasket = (await addPkgRes.json()) as {
      data?: { links?: { checkout?: string } };
    };
    const checkoutUrl = finalBasket.data?.links?.checkout;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Makselehe linki ei leitud." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("Tebex checkout error:", err);
    return NextResponse.json(
      { error: "Serveri viga makselehe loomisel." },
      { status: 500 }
    );
  }
}

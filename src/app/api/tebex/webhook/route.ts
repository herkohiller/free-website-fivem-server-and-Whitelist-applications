import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      type?: string;
      subject?: {
        transaction_id?: string;
        price?: { amount?: number; currency?: string };
        customer?: {
          username?: { username?: string };
          email?: string;
        };
        products?: Array<{ name?: string; quantity?: number }>;
      };
    };

    // 1. Tebexi valideerimispäring (vastab alati sama ID-ga tagasi)
    if (body.type === "validation.webhook" && body.id) {
      return NextResponse.json({ id: body.id }, { status: 200 });
    }

    // 2. Kui makse on sooritatud, saadame teate Discordi
    if (body.type === "payment.completed") {
      const discordWebhookUrl = process.env.TEBEX_DISCORD_WEBHOOK_URL?.trim();
      if (discordWebhookUrl) {
        const buyer =
          body.subject?.customer?.username?.username ||
          body.subject?.customer?.email ||
          "Tundmatu ostja";
        const amount = body.subject?.price?.amount ?? 0;
        const currency = body.subject?.price?.currency ?? "EUR";
        const items =
          body.subject?.products
            ?.map((p) => `${p.name ?? "Toode"} (x${p.quantity ?? 1})`)
            .join(", ") || "Pakett";

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: "🛒 Uus Tebexi ost!",
                color: 3066993,
                fields: [
                  { name: "Ostja", value: buyer, inline: true },
                  { name: "Summa", value: `${amount} ${currency}`, inline: true },
                  { name: "Toode", value: items, inline: false },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      }
    }

    return NextResponse.json({ id: body.id ?? "ok" }, { status: 200 });
  } catch (error) {
    console.error("[Tebex Webhook Error]", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

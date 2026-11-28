
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_TICKET_WEBHOOK_URL;

function cleanDiscordText(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "—";
  return value.slice(0, maxLength).replace(/@/g, "@\u200b") || "—";
}

async function notifyDiscord(
  title: string,
  fields: Array<{ name: string; value: string }>
) {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [{
          title,
          color: 0x2563eb,
          fields: fields.map((field) => ({
            name: cleanDiscordText(field.name, 256),
            value: cleanDiscordText(field.value, 1024),
            inline: false,
          })),
          footer: {
            text: "Streets of San Andreas • Ticket System",
          },
          timestamp: new Date().toISOString(),
        }],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Discord webhook returned", response.status);
    }
  } catch (error) {
    console.error("Discordi teavituse saatmine ebaõnnestus:", error);
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Pole sisse logitud" },
      { status: 401 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  const isAdmin = Boolean(dbUser?.isAdmin);

  const tickets = await prisma.ticket.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
      claimedBy: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    tickets,
    isAdmin,
    currentUserId: session.user.id,
  });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Pole sisse logitud" },
      { status: 401 }
    );
  }

  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Vigane päring" },
      { status: 400 }
    );
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const category =
    typeof body.category === "string" ? body.category.trim() : "";

  const priority =
    typeof body.priority === "string"
      ? body.priority
      : "Normaalne";

  const evidenceUrl =
    typeof body.evidenceUrl === "string"
      ? body.evidenceUrl.trim()
      : "";

  if (!title || !description || !category) {
    return NextResponse.json(
      { error: "Täida kohustuslikud väljad" },
      { status: 400 }
    );
  }

  if (
    title.length > 120 ||
    description.length > 5000 ||
    category.length > 80
  ) {
    return NextResponse.json(
      { error: "Mõni väli on liiga pikk" },
      { status: 400 }
    );
  }

  if (!["Madal", "Normaalne", "Kõrge"].includes(priority)) {
    return NextResponse.json(
      { error: "Vigane prioriteet" },
      { status: 400 }
    );
  }

  if (evidenceUrl) {
    try {
      const parsed = new URL(evidenceUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid URL");
      }
    } catch {
      return NextResponse.json(
        { error: "Pildi või video link peab olema korrektne URL" },
        { status: 400 }
      );
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      category,
      priority,
      evidenceUrl: evidenceUrl || null,
      userId: session.user.id,
      logs: {
        create: {
          action: "Ticket loodud",
          details: "Ticket loodi süsteemis.",
        },
      },
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  await notifyDiscord("🎫 Uus ticket", [
    { name: "Pealkiri", value: ticket.title },
    { name: "Kategooria", value: ticket.category },
    { name: "Prioriteet", value: ticket.priority },
    { name: "Ticket ID", value: ticket.id },
    {
      name: "Autor",
      value: ticket.user?.username || "Kasutaja",
    },
    { name: "Kirjeldus", value: ticket.description },
    ...(ticket.evidenceUrl
      ? [{ name: "Lisatud link", value: ticket.evidenceUrl }]
      : []),
  ]);

  return NextResponse.json(ticket, { status: 201 });
}

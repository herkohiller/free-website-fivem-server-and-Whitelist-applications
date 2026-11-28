
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_TICKET_WEBHOOK_URL;

function safeText(value: unknown, maxLength = 1000) {
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
            name: safeText(field.name, 256),
            value: safeText(field.value, 1024),
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: Request,
  { params }: RouteContext
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Pole sisse logitud" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  const isAdmin = Boolean(dbUser?.isAdmin);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
      claimedBy: {
        select: { id: true, username: true, avatar: true },
      },
      messages: {
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticketit ei leitud" },
      { status: 404 }
    );
  }

  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Sul pole selle ticketi vaatamise õigust" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ticket, isAdmin });
}

export async function POST(
  req: Request,
  { params }: RouteContext
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Pole sisse logitud" },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Vigane päring" },
      { status: 400 }
    );
  }

  const content =
    typeof body.content === "string" ? body.content.trim() : "";

  const action =
    typeof body.action === "string" ? body.action : "";

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, username: true },
  });

  const isAdmin = Boolean(dbUser?.isAdmin);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticketit ei leitud" },
      { status: 404 }
    );
  }

  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Sul pole selle ticketi muutmise õigust" },
      { status: 403 }
    );
  }

  if (ticket.status === "SULETUD") {
    return NextResponse.json(
      { error: "See ticket on suletud" },
      { status: 400 }
    );
  }

  // Ticketi claimimine
  if (action === "CLAIM") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ainult admin saab ticketi võtta" },
        { status: 403 }
      );
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        claimedById: session.user.id,
        logs: {
          create: {
            action: "Ticket claimitud",
            details: `${dbUser?.username || "Admin"} võttis ticketi enda peale.`,
          },
        },
      },
    });

    return NextResponse.json(updated);
  }

  // Claimi vabastamine
  if (action === "UNCLAIM") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ainult admin saab claim'i eemaldada" },
        { status: 403 }
      );
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        claimedById: null,
        logs: {
          create: {
            action: "Claim eemaldatud",
            details: `${dbUser?.username || "Admin"} vabastas ticketi.`,
          },
        },
      },
    });

    return NextResponse.json(updated);
  }

  // Ticketi sulgemine
  if (action === "CLOSE") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ainult admin saab ticketi sulgeda" },
        { status: 403 }
      );
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: "SULETUD",
        logs: {
          create: {
            action: "Staatus muudetud",
            details: `${ticket.status} -> Suletud (${dbUser?.username || "Admin"})`,
          },
        },
      },
    });

    return NextResponse.json(updated);
  }

  if (action) {
    return NextResponse.json(
      { error: "Tundmatu tegevus" },
      { status: 400 }
    );
  }

  // Sõnumi lisamine
  if (!content) {
    return NextResponse.json(
      { error: "Tühi sõnum" },
      { status: 400 }
    );
  }

  if (content.length > 5000) {
    return NextResponse.json(
      { error: "Sõnum on liiga pikk" },
      { status: 400 }
    );
  }

  const newStatus = isAdmin
    ? "KASUTAJA_VASTUS"
    : "ADMIN_VASTUS";

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      status: newStatus,
      claimedById:
        isAdmin && !ticket.claimedById
          ? session.user.id
          : ticket.claimedById,
      messages: {
        create: {
          content,
          isStaff: isAdmin,
          userId: session.user.id,
        },
      },
      logs:
        ticket.status !== newStatus
          ? {
              create: {
                action: "Staatus muudetud",
                details: `${ticket.status} -> ${newStatus}`,
              },
            }
          : undefined,
    },
  });

  await notifyDiscord("💬 Ticketile lisati vastus", [
    { name: "Ticket", value: ticket.title },
    { name: "Ticket ID", value: ticket.id },
    {
      name: "Saatja",
      value: dbUser?.username || "Kasutaja",
    },
    { name: "Sõnum", value: content },
  ]);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext
) {
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

  if (!dbUser?.isAdmin) {
    return NextResponse.json(
      { error: "Ainult admin saab kustutada" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticketit ei leitud" },
      { status: 404 }
    );
  }

  await prisma.ticket.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

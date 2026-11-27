import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Pole lubatud" }, { status: 401 });
  }

  const { id } = await params;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      claimedBy: { select: { id: true, username: true, avatar: true } },
      messages: {
        include: { user: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      logs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticketit ei leitud" }, { status: 404 });
  }

  return NextResponse.json({ ticket, isAdmin: Boolean(dbUser?.isAdmin) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Pole lubatud" }, { status: 401 });
  }

  const { id } = await params;
  const { content, action } = await req.json();

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, username: true },
  });
  const isAdmin = Boolean(dbUser?.isAdmin);

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ei leitud" }, { status: 404 });
  }

  // Ticketi claimimine (ainult admin)
  if (action === "CLAIM" && isAdmin) {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        claimedById: session.user.id,
        logs: {
          create: {
            action: "Ticket claimitud",
            details: `${dbUser?.username} võttis ticketi enda peale.`,
          },
        },
      },
    });
    return NextResponse.json(updated);
  }

  // Claimi vabastamine (ainult admin)
  if (action === "UNCLAIM" && isAdmin) {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        claimedById: null,
        logs: {
          create: {
            action: "Claim eemaldatud",
            details: `${dbUser?.username} vabastas ticketi.`,
          },
        },
      },
    });
    return NextResponse.json(updated);
  }

  // Ticketi sulgemine
  if (action === "CLOSE") {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: "SULETUD",
        logs: {
          create: {
            action: "Staatus muudetud",
            details: `${ticket.status} -> Suletud (${dbUser?.username})`,
          },
        },
      },
    });
    return NextResponse.json(updated);
  }

  // Sõnumi lisamine
  if (!content?.trim()) {
    return NextResponse.json({ error: "Tühi sõnum" }, { status: 400 });
  }

  const newStatus = isAdmin ? "KASUTAJA_VASTUS" : "ADMIN_VASTUS";

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      status: newStatus,
      claimedById: isAdmin && !ticket.claimedById ? session.user.id : ticket.claimedById,
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

  return NextResponse.json(updated);
}

// Ticketi kustutamine (ainult admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Pole lubatud" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!dbUser?.isAdmin) {
    return NextResponse.json({ error: "Ainult admin saab kustutada" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.ticket.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

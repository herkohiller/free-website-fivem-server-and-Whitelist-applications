import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Pole lubatud" }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
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

  return NextResponse.json(ticket);
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
    select: { isAdmin: true },
  });
  const isAdmin = Boolean(dbUser?.isAdmin);

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ei leitud" }, { status: 404 });
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
            details: `${ticket.status} -> Suletud`,
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

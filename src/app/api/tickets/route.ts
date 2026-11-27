import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Pole sisse logitud" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  const isAdmin = Boolean(dbUser?.isAdmin);

  const tickets = await prisma.ticket.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      claimedBy: { select: { id: true, username: true, avatar: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ tickets, isAdmin, currentUserId: session.user.id });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Pole sisse logitud" }, { status: 401 });
  }

  const { title, description, category, priority, evidenceUrl } = await req.json();

  if (!title || !description || !category) {
    return NextResponse.json({ error: "Täida kohustuslikud väljad" }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      category,
      priority: priority || "Normaalne",
      evidenceUrl: evidenceUrl || null,
      userId: session.user.id,
      logs: {
        create: {
          action: "Ticket loodud",
          details: "Ticket loodi süsteemis.",
        },
      },
    },
  });

  return NextResponse.json(ticket);
}

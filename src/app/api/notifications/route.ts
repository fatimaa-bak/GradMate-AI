import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (projectId) {
    const membership = await db.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id, ...(projectId ? { projectId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.markAllRead) {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.deleteAll) {
    await db.notification.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    const updated = await db.notification.update({
      where: { id: body.id },
      data: { read: body.read ?? true },
    });
    return NextResponse.json({ notification: updated });
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const phases = await db.timelinePhase.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ phases });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: body.projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // body.phases is an array of phases to create (replace existing)
  if (Array.isArray(body.phases)) {
    await db.timelinePhase.deleteMany({ where: { projectId: body.projectId } });
    const created = await Promise.all(
      body.phases.map((p: any, idx: number) =>
        db.timelinePhase.create({
          data: {
            projectId: body.projectId,
            title: p.title,
            description: p.description || null,
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate),
            progress: p.progress || 0,
            isMilestone: !!p.isMilestone,
            order: idx,
          },
        })
      )
    );
    return NextResponse.json({ phases: created });
  }

  // Single phase create/update
  const phase = await db.timelinePhase.create({
    data: {
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      progress: body.progress || 0,
      isMilestone: body.isMilestone || false,
      order: body.order || 0,
    },
  });

  return NextResponse.json({ phase });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phase = await db.timelinePhase.findUnique({ where: { id } });
  if (!phase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: phase.projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed: any = {};
  for (const k of ["title", "description", "startDate", "endDate", "progress", "isMilestone", "order"]) {
    if (updates[k] !== undefined) {
      if (k === "startDate" || k === "endDate") allowed[k] = new Date(updates[k]);
      else if (k === "progress" || k === "order") allowed[k] = Number(updates[k]);
      else allowed[k] = updates[k];
    }
  }

  const updated = await db.timelinePhase.update({ where: { id }, data: allowed });
  return NextResponse.json({ phase: updated });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phase = await db.timelinePhase.findUnique({ where: { id } });
  if (!phase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: phase.projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.timelinePhase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

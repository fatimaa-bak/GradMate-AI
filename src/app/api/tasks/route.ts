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

  const tasks = await db.task.findMany({
    where: projectId ? { projectId } : {
      project: { members: { some: { userId: user.id } } },
    },
    include: {
      assignee: true,
      project: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
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

  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      assigneeId: body.assigneeId || null,
      priority: body.priority || "medium",
      status: body.status || "todo",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      estimatedHours: body.estimatedHours ? Number(body.estimatedHours) : null,
      requiredSkills: body.requiredSkills || null,
      dependencies: body.dependencies || null,
      attachments: body.attachments || null,
      progress: body.progress ? Number(body.progress) : 0,
      createdById: user.id,
    },
  });

  await db.activityLog.create({
    data: {
      projectId: body.projectId,
      userId: user.id,
      action: "created_task",
      details: `أنشأ ${user.name} مهمة «${task.title}»`,
    },
  });

  return NextResponse.json({ task });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: task.projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed: any = {};
  for (const k of [
    "title", "description", "assigneeId", "priority", "status",
    "startDate", "dueDate", "estimatedHours", "requiredSkills",
    "dependencies", "attachments", "progress",
  ]) {
    if (updates[k] !== undefined) {
      if (k === "startDate" || k === "dueDate") {
        allowed[k] = updates[k] ? new Date(updates[k]) : null;
      } else if (k === "estimatedHours" || k === "progress") {
        allowed[k] = updates[k] === null ? null : Number(updates[k]);
      } else {
        allowed[k] = updates[k];
      }
    }
  }

  // Auto-set progress on completion
  if (updates.status === "completed" && updates.progress === undefined) {
    allowed.progress = 100;
  }

  const updated = await db.task.update({ where: { id }, data: allowed });
  return NextResponse.json({ task: updated });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: task.projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

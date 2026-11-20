import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";

const ProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.string().optional(),
  specialization: z.string().optional(),
  problemStatement: z.string().optional(),
  objectives: z.string().optional(),
  targetUsers: z.string().optional(),
  technologies: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationWeeks: z.number().optional(),
  academicYear: z.string().optional(),
  supervisorName: z.string().optional(),
  memberCount: z.number().optional(),
  teamLeader: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          members: true,
          tasks: true,
        },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
  });

  const projects = memberships.map((m) => ({
    ...m.project,
    myRole: m.role,
    teamSize: m.project.members.length,
    completedTasks: m.project.tasks.filter((t) => t.status === "completed").length,
    totalTasks: m.project.tasks.length,
    progress: m.project.tasks.length
      ? Math.round(
          (m.project.tasks.filter((t) => t.status === "completed").length /
            m.project.tasks.length) *
            100
        )
      : 0,
  }));

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await db.project.create({
    data: {
      name: d.name,
      description: d.description,
      category: d.category,
      specialization: d.specialization,
      problemStatement: d.problemStatement,
      objectives: d.objectives,
      targetUsers: d.targetUsers,
      technologies: d.technologies,
      startDate: d.startDate ? new Date(d.startDate) : new Date(),
      endDate: d.endDate ? new Date(d.endDate) : undefined,
      durationWeeks: d.durationWeeks,
      academicYear: d.academicYear,
      supervisorName: d.supervisorName,
      status: "planning",
      currentPhase: "التحليل والتخطيط",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
          experience: "advanced",
          availability: 20,
        },
      },
    },
    include: { members: true },
  });

  await db.activityLog.create({
    data: {
      projectId: project.id,
      userId: user.id,
      action: "created_project",
      details: `أنشأ ${user.name} مشروع «${project.name}»`,
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      projectId: project.id,
      type: "info",
      title: "تم إنشاء المشروع",
      body: `يمكنك الآن تحليل الفكرة وإضافة أعضاء الفريق والمهام.`,
      read: false,
    },
  });

  return NextResponse.json({ project });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can edit" }, { status: 403 });
  }

  const allowed: any = {};
  for (const k of [
    "name", "description", "category", "specialization", "problemStatement",
    "objectives", "targetUsers", "technologies", "status", "currentPhase",
    "startDate", "endDate", "durationWeeks", "academicYear", "supervisorName",
  ]) {
    if (updates[k] !== undefined) {
      allowed[k] = k === "startDate" || k === "endDate" ? new Date(updates[k]) : updates[k];
    }
  }

  const project = await db.project.update({ where: { id }, data: allowed });
  return NextResponse.json({ project });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can delete" }, { status: 403 });
  }

  await db.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

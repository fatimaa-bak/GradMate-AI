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

  const members = await db.membership.findMany({
    where: projectId ? { projectId } : { userId: user.id },
    include: {
      user: { omit: { passwordHash: true } },
      project: true,
    },
  });

  const enriched = await Promise.all(
    members.map(async (m) => {
      const assigned = await db.task.count({ where: { assigneeId: m.userId, projectId: m.projectId } });
      const completed = await db.task.count({ where: { assigneeId: m.userId, projectId: m.projectId, status: "completed" } });
      const inProgress = await db.task.count({ where: { assigneeId: m.userId, projectId: m.projectId, status: "in_progress" } });
      return {
        ...m,
        assignedTasks: assigned,
        completedTasks: completed,
        inProgressTasks: inProgress,
        workload: Math.min(100, Math.round((inProgress + (assigned - completed) * 0.5) * 25)),
      };
    })
  );

  return NextResponse.json({ members: enriched });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ownerMembership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: body.projectId } },
  });
  if (!ownerMembership || ownerMembership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can add members" }, { status: 403 });
  }

  // Find user by email, or create a placeholder membership
  let targetUser = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  if (!targetUser) {
    // Create a lightweight user record (no password — they'll register later)
    targetUser = await db.user.create({
      data: {
        email: body.email.toLowerCase().trim(),
        name: body.name || body.email.split("@")[0],
        passwordHash: "pending-invitation",
        university: body.university,
      },
    });
  }

  const existing = await db.membership.findUnique({
    where: { userId_projectId: { userId: targetUser.id, projectId: body.projectId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  const membership = await db.membership.create({
    data: {
      userId: targetUser.id,
      projectId: body.projectId,
      role: body.role || "member",
      skills: body.skills || "",
      experience: body.experience || "intermediate",
      availability: body.availability ? Number(body.availability) : 20,
    },
  });

  await db.notification.create({
    data: {
      userId: targetUser.id,
      projectId: body.projectId,
      type: "team",
      title: "دعوة للانضمام للفريق",
      body: `تمت دعوتك للانضمام إلى فريق المشروع.`,
      read: false,
    },
  });

  return NextResponse.json({ membership });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const membershipId = searchParams.get("id");
  if (!membershipId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const target = await db.membership.findUnique({ where: { id: membershipId } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.userId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const ownerMembership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: target.projectId } },
  });
  if (!ownerMembership || ownerMembership.role !== "owner") {
    return NextResponse.json({ error: "Only owner can remove members" }, { status: 403 });
  }

  await db.membership.delete({ where: { id: membershipId } });
  return NextResponse.json({ ok: true });
}

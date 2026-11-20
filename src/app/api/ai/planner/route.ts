import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { callAIJson } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const projectId = body.projectId;
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await db.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const project = await db.project.findUnique({ where: { id: projectId } });
  const members = await db.membership.findMany({ where: { projectId }, include: { user: true } });
  const existingTasks = await db.task.findMany({ where: { projectId } });

  const systemPrompt = `You are GradMate AI's Planning Agent, an expert in academic project scheduling.
Generate a realistic, structured project timeline divided into phases and milestones.
Consider: project duration, team size, technical complexity, existing tasks, and dependencies.
Respond in Arabic (unless the user wrote in English).
JSON shape:
{
  "phases": [
    {
      "title": string,
      "description": string,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "progress": number,
      "isMilestone": boolean
    }
  ],
  "milestones": [string],
  "estimatedTasks": [{"title": string, "phase": string, "estimatedDays": number}],
  "criticalPath": [string],
  "summary": string
}`;

  const userPrompt = `أنشئ خطة زمنية ذكية للمشروع التالي:
اسم المشروع: ${project?.name}
الوصف: ${project?.description}
التقنيات: ${project?.technologies || "غير محدد"}
تاريخ البدء: ${project?.startDate?.toISOString().split("T")[0]}
تاريخ الانتهاء: ${project?.endDate?.toISOString().split("T")[0]}
المدة: ${project?.durationWeeks} أسبوع
عدد أعضاء الفريق: ${members.length}
المهام الموجودة حالياً: ${existingTasks.length}`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) {
    return NextResponse.json({ error: "AI planning failed." }, { status: 500 });
  }

  // Optionally persist phases if requested
  if (body.apply && result.phases) {
    await db.timelinePhase.deleteMany({ where: { projectId } });
    await Promise.all(
      result.phases.map((p: any, idx: number) =>
        db.timelinePhase.create({
          data: {
            projectId,
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
  }

  return NextResponse.json({ result });
}

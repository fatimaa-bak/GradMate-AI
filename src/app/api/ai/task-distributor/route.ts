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

  const members = await db.membership.findMany({
    where: { projectId },
    include: { user: true },
  });
  const tasks = await db.task.findMany({ where: { projectId, status: { in: ["todo", "overdue"] } } });

  if (tasks.length === 0) {
    return NextResponse.json({ result: { assignments: [], summary: "لا توجد مهام غير مُسندة للتوزيع." } });
  }

  const teamData = members.map((m) => ({
    id: m.userId,
    name: m.user.name,
    skills: (m.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
    experience: m.experience,
    availability: m.availability,
    currentLoad: tasks.filter((t) => t.assigneeId === m.userId).length,
  }));

  const taskData = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    requiredSkills: (t.requiredSkills || "").split(",").map((s) => s.trim()).filter(Boolean),
    estimatedHours: t.estimatedHours,
    dueDate: t.dueDate,
  }));

  const systemPrompt = `You are GradMate AI's Smart Task Distribution Agent.
Assign each unassigned task to the most suitable team member based on skills match, experience, availability, current workload, and deadlines.
Never auto-overwrite existing assignments — only suggest.
Respond in Arabic (unless the user wrote in English).
JSON shape:
{
  "assignments": [
    {
      "taskId": string,
      "taskTitle": string,
      "recommendedMemberId": string,
      "recommendedMemberName": string,
      "matchingSkills": [string],
      "estimatedEffort": string,
      "reason": string,
      "confidenceScore": number  // 0-100
    }
  ],
  "summary": string,
  "warnings": [string]
}`;

  const userPrompt = `وزّع المهام التالية على أعضاء الفريق:

المهام غير المُسندة:
${JSON.stringify(taskData, null, 2)}

أعضاء الفريق:
${JSON.stringify(teamData, null, 2)}

أعطِ توصية إسناد لكل مهمة مع توضيح السبب.`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) {
    return NextResponse.json({ error: "AI distribution failed." }, { status: 500 });
  }
  return NextResponse.json({ result });
}

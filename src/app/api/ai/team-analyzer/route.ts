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

  const tasks = await db.task.findMany({ where: { projectId } });

  const teamData = members.map((m) => ({
    name: m.user.name,
    role: m.role,
    skills: m.skills,
    experience: m.experience,
    availability: m.availability,
    assignedTasks: tasks.filter((t) => t.assigneeId === m.userId).length,
    completedTasks: tasks.filter((t) => t.assigneeId === m.userId && t.status === "completed").length,
    inProgress: tasks.filter((t) => t.assigneeId === m.userId && t.status === "in_progress").length,
  }));

  const systemPrompt = `You are GradMate AI's Team Manager Agent, an expert in team dynamics for graduation projects.
Analyze the team composition and produce a STRUCTURED assessment as JSON.
Respond in Arabic (unless the user wrote in English). Be concrete.
JSON shape:
{
  "strengths": [string],
  "skillGaps": [{"skill": string, "why": string, "suggestedAction": string}],
  "recommendations": [{"member": string, "responsibilities": [string], "why": string}],
  "overloadedMembers": [{"member": string, "currentLoad": number, "suggestion": string}],
  "balancedDistribution": [{"member": string, "suggestedTasks": number, "focus": string}],
  "summary": string
}`;

  const userPrompt = `حلّل فريق مشروع التخرج التالي وأعطِ توصيات عملية:
أعضاء الفريق:
${JSON.stringify(teamData, null, 2)}
المهام الحالية: ${tasks.length} مهمة.
حالة المهام: ${tasks.filter((t) => t.status === "completed").length} مكتمل، ${tasks.filter((t) => t.status === "in_progress").length} قيد التنفيذ، ${tasks.filter((t) => t.status === "overdue").length} متأخرة.`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) {
    return NextResponse.json({ error: "AI analysis failed." }, { status: 500 });
  }
  return NextResponse.json({ result });
}

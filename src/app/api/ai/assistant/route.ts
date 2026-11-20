import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { message, conversationId, projectId } = body;
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build project context (only authorized data)
  let projectContext = "";
  if (projectId) {
    const membership = await db.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (membership) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      const members = await db.membership.findMany({
        where: { projectId },
        include: { user: true },
      });
      const tasks = await db.task.findMany({ where: { projectId } });
      const phases = await db.timelinePhase.findMany({ where: { projectId }, orderBy: { order: "asc" } });
      const recentAnalyses = await db.ideaAnalysis.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      projectContext = `بيانات المشروع الحالي (يحق للمستخدم الوصول إليها):
اسم المشروع: ${project?.name}
الوصف: ${project?.description}
الحالة: ${project?.status}
المرحلة الحالية: ${project?.currentPhase || "غير محدد"}
التقنيات: ${project?.technologies || "غير محدد"}
تاريخ البدء: ${project?.startDate?.toISOString().split("T")[0]}
تاريخ الانتهاء: ${project?.endDate?.toISOString().split("T")[0]}

أعضاء الفريق:
${members.map((m) => `- ${m.user.name} (${m.role}, مهارات: ${m.skills || "غير محدد"})`).join("\n")}

المهام:
${tasks.map((t) => `- ${t.title} | المسؤول: ${members.find((m) => m.userId === t.assigneeId)?.user.name || "غير مُسند"} | الأولوية: ${t.priority} | الحالة: ${t.status} | الاستحقاق: ${t.dueDate?.toISOString().split("T")[0] || "غير محدد"}`).join("\n")}

مراحل الجدول الزمني:
${phases.map((p) => `- ${p.title}: ${p.startDate.toISOString().split("T")[0]} إلى ${p.endDate.toISOString().split("T")[0]} (تقدم ${p.progress}%)${p.isMilestone ? " [معلم]" : ""}`).join("\n")}

${recentAnalyses.length > 0 ? `آخر تحليل فكرة: درجة الجدوى ${recentAnalyses[0].feasibility}, الابتكار ${recentAnalyses[0].innovation}, التعقيد ${recentAnalyses[0].complexity}` : "لا يوجد تحليل سابق للفكرة."}
`;
    }
  }

  // Load conversation history
  let conversation = null;
  if (conversationId) {
    conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 12 } },
    });
  }
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        userId: user.id,
        projectId: projectId || null,
        title: message.slice(0, 60),
      },
      include: { messages: true },
    });
  }

  // Save user message
  await db.chatMessage.create({
    data: {
      conversationId: conversation.id,
      userId: user.id,
      role: "user",
      content: message,
    },
  });

  const history = conversation.messages
    .map((m) => `${m.role === "user" ? "الطالب" : "المساعد"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are GradMate AI Assistant, an expert in academic graduation projects.
Help the student with planning, technical decisions, team coordination, and defense preparation.
Respond in Arabic by default (unless the student wrote in English), in a friendly and practical tone.
Always base answers on the actual project data provided. Never fabricate information.
Do not claim actions were completed unless the student confirms them.
When appropriate, suggest concrete next steps.

${projectContext}

Conversation so far:
${history || "(بداية المحادثة)"}`;

  const reply = await callAI(systemPrompt, message, { temperature: 0.5, max_tokens: 1200 });

  // Save assistant message
  await db.chatMessage.create({
    data: {
      conversationId: conversation.id,
      userId: null,
      role: "assistant",
      content: reply,
    },
  });

  // Update conversation title from first message
  if (conversation.messages.length === 0) {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { title: message.slice(0, 60), updatedAt: new Date() },
    });
  } else {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  }

  return NextResponse.json({ reply, conversationId: conversation.id });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (conversationId) {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ conversation });
  }

  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json({ conversations });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { callAI, callAIJson } from "@/lib/ai";

// POST: either start session (returns first question) or submit answer (returns next question or feedback)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const projectId = body.projectId;
    if (!projectId && body.action !== "answer") {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // For "answer" action, projectId may be absent; resolve via session
    let resolvedProjectId = projectId;
    if (body.action === "answer" && body.sessionId && !resolvedProjectId) {
      const existing = await db.defenseSession.findUnique({ where: { id: body.sessionId } });
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      resolvedProjectId = existing.projectId;
    }

    const membership = await db.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: resolvedProjectId } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const project = await db.project.findUnique({ where: { id: resolvedProjectId } });

    // ===== Start new session =====
    if (body.action === "start") {
      const mode = body.mode || "mixed";
      const systemPrompt = `You are GradMate AI's Defense Simulator, playing the role of a graduation project committee examiner.
The student will practice defending their project. Ask realistic questions, one at a time, in Arabic (or English if the student prefers).
Mode: ${mode} (technical focuses on implementation; academic focuses on methodology/contribution; mixed alternates).
Adapt follow-up questions to the student's answers. Be rigorous but fair.
Reply with ONLY the next question, no preamble.`;

      const userPrompt = `ابدأ جلسة محاكاة مناقشة لمشروع التخرج التالي:
العنوان: ${project?.name}
الوصف: ${project?.description}
التقنيات: ${project?.technologies || "غير محدد"}
الأهداف: ${project?.objectives || "غير محدد"}
المشكلة: ${project?.problemStatement || "غير محدد"}

اطرح السؤال الأول فقط.`;

      const question = await callAI(systemPrompt, userPrompt, { temperature: 0.7, max_tokens: 400 });

      const defenseSession = await db.defenseSession.create({
        data: {
          projectId: resolvedProjectId,
          userId: user.id,
          mode,
          duration: body.duration || 30,
          transcriptJson: JSON.stringify([{ role: "examiner", content: question }]),
        },
      });

      const response = { sessionId: defenseSession.id, question, mode };
      return NextResponse.json(response);
    }

    // ===== Submit answer → next question or end =====
    if (body.action === "answer" && body.sessionId) {
      const defenseSession = await db.defenseSession.findUnique({ where: { id: body.sessionId } });
      if (!defenseSession || defenseSession.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const transcript: any[] = JSON.parse(defenseSession.transcriptJson || "[]");
      transcript.push({ role: "student", content: body.answer });

      const systemPrompt = `You are GradMate AI's Defense Simulator, a graduation project committee examiner.
Continue the defense session. Either ask a follow-up question, or if enough rounds have passed (${transcript.filter((m) => m.role === "student").length} student answers), you may say "[END]" to indicate the session should conclude.
Reply with EITHER a follow-up question OR the literal string "[END]" if you judge the session complete.
Be specific to the student's answers. Probe for depth when the answer is shallow.

Transcript so far:
${transcript.map((m) => `${m.role === "examiner" ? "اللجنة" : "الطالب"}: ${m.content}`).join("\n")}`;

      const next = await callAI(
        systemPrompt,
        `المشروع: ${project?.name} — ${project?.description}\nاستمر في المناقشة.`,
        { temperature: 0.7, max_tokens: 400 }
      );

      const isEnd = next.trim().includes("[END]");

      if (isEnd) {
        const feedbackSystem = `You are GradMate AI's Defense Simulator evaluator.
Provide final structured feedback on the student's defense performance based on the transcript.
Respond in Arabic (unless the student used English).
JSON shape:
{
  "score": number,
  "strengths": [string],
  "improvements": [string],
  "tips": [string],
  "overallComment": string
}`;

        const feedbackPrompt = `قيّم أداء الطالب في المناقشة بناءً على المحادثة التالية:
${transcript.map((m) => `${m.role === "examiner" ? "اللجنة" : "الطالب"}: ${m.content}`).join("\n")}

المشروع: ${project?.name} — ${project?.description}`;

        const feedback = await callAIJson(feedbackSystem, feedbackPrompt);

        transcript.push({ role: "examiner", content: "[انتهت الجلسة]" });
        await db.defenseSession.update({
          where: { id: body.sessionId },
          data: {
            transcriptJson: JSON.stringify(transcript),
            score: feedback?.score ?? null,
            feedback: feedback ? JSON.stringify(feedback) : null,
          },
        });

        return NextResponse.json({ ended: true, feedback, sessionId: body.sessionId });
      }

      transcript.push({ role: "examiner", content: next });
      await db.defenseSession.update({
        where: { id: body.sessionId },
        data: { transcriptJson: JSON.stringify(transcript) },
      });

      return NextResponse.json({ question: next, sessionId: body.sessionId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("[defense] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const where: any = { userId: user.id };
  if (projectId) where.projectId = projectId;

  const sessions = await db.defenseSession.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { project: true },
  });

  return NextResponse.json({ sessions });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

// Discuss an idea (free-form chat bound to a specific analysis)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { message, analysisId, history = [] } = body;
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let analysisContext = "";
  if (analysisId) {
    const analysis = await db.ideaAnalysis.findUnique({ where: { id: analysisId } });
    if (analysis && analysis.userId === user.id) {
      analysisContext = `سياق فكرة المشروع قيد النقاش:
عنوان الفكرة: ${analysis.ideaTitle}
الوصف: ${analysis.ideaDescription}
درجة الجدوى: ${analysis.feasibility}
درجة الابتكار: ${analysis.innovation}
التعقيد: ${analysis.complexity}
التحليل الكامل: ${analysis.resultJson}`;
    }
  }

  const systemPrompt = `You are GradMate AI's Idea Discussion Agent.
The student wants to discuss their graduation project idea in depth. Use the analysis context to ground your answers.
Respond in Arabic (unless the student uses English). Be practical and specific.
${analysisContext}

Discussion history:
${history.map((m: any) => `${m.role}: ${m.content}`).join("\n") || "(بداية النقاش)"}`;

  const reply = await callAI(systemPrompt, message, { temperature: 0.5, max_tokens: 1200 });
  return NextResponse.json({ reply });
}

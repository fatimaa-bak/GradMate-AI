import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { callAIJson } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const systemPrompt = `You are GradMate AI's Idea Analyzer Agent, an expert in academic graduation projects.
Analyze the student's project idea and produce a STRUCTURED assessment as JSON.
Respond in Arabic (unless the user wrote in English). Be specific and practical.
Scoring: feasibility and innovation are 0-100 (higher is better). Complexity is one of: "low" | "medium" | "high".
Provide 3-6 technology recommendations, 3-5 risks with severity "low"|"medium"|"high" and concrete mitigations,
3-5 actionable improvements, and a 5-8 step implementation roadmap.
JSON shape:
{
  "feasibility": number,
  "feasibilityExplanation": string,
  "innovation": number,
  "innovationExplanation": string,
  "complexity": "low"|"medium"|"high",
  "complexityExplanation": string,
  "technologies": [{"name": string, "why": string}],
  "risks": [{"description": string, "severity": "low"|"medium"|"high", "mitigation": string}],
  "improvements": [string],
  "roadmap": [{"step": number, "title": string, "details": string, "estimatedDays": number}]
}`;

  const userPrompt = `حلّل فكرة مشروع التخرج التالية:
عنوان الفكرة: ${body.ideaTitle}
الوصف: ${body.ideaDescription}
المشكلة: ${body.problem || "غير محددة"}
الجمهور المستهدف: ${body.audience || "غير محدد"}
الموارد المتاحة: ${body.resources || "غير محددة"}
حجم الفريق: ${body.teamSize || "غير محدد"}
مدة المشروع: ${body.duration || "غير محدد"} أسبوع
التقنيات المفضلة: ${body.technologies || "غير محددة"}

أعطِ تقييماً موضوعياً ومفصلاً مع أرقام وخطوات قابلة للتنفيذ.`;

  const result = await callAIJson(systemPrompt, userPrompt);

  if (!result) {
    return NextResponse.json({ error: "AI analysis failed. Please retry." }, { status: 500 });
  }

  // Persist
  const analysis = await db.ideaAnalysis.create({
    data: {
      userId: user.id,
      projectId: body.projectId || null,
      ideaTitle: body.ideaTitle,
      ideaDescription: body.ideaDescription,
      feasibility: result.feasibility,
      innovation: result.innovation,
      complexity: result.complexity,
      resultJson: JSON.stringify(result),
    },
  });

  return NextResponse.json({ analysis, result });
}

// Multi-Agent Project Preparation Pipeline — the heart of GradMate AI's
// cooperative agent system.
//
// A Coordinator agent runs four specialist agents IN SEQUENCE, passing each
// agent's OUTPUT as the next agent's INPUT (agent-to-agent handoff):
//
//   1. Idea Analyzer     → feasibility, innovation, complexity, risks
//   2. Planner           → reads the analysis, produces phases + tasks
//   3. Task Distributor  → reads the plan's tasks, assigns them to members
//   4. Defense Simulator → reads everything, generates expected defense
//                          questions from the ACTUAL analysis + plan
//
// This is real cooperation: each agent's prompt embeds the previous agents'
// structured outputs, and the final report is a synthesis of all of them.
// Every step persists its artifacts to the database so any agent (or the
// student) can consume them later.

import { db } from "@/lib/db";
import { callAI, callAIJson } from "@/lib/ai";

export interface PipelineStepStatus {
  id: "analyzer" | "planner" | "distributor" | "defense";
  name: string;
  nameEn: string;
  status: "pending" | "running" | "done" | "failed";
  inputFrom: string[]; // which agents' outputs this agent consumed
  outputSummary?: string;
  error?: string;
  durationMs?: number;
}

export interface PipelineResult {
  runId: string;
  steps: PipelineStepStatus[];
  analysis?: any;
  plan?: any;
  distribution?: any;
  defense?: any;
  finalReport?: string;
}

// ---------------------------------------------------------------------------
// Step 1 — Idea Analyzer Agent
// ---------------------------------------------------------------------------
async function runAnalyzerAgent(
  project: any,
  members: any[],
  existingTasks: any[]
): Promise<any> {
  const systemPrompt = `You are GradMate AI's Idea Analyzer Agent, an expert in academic graduation projects.
Analyze the student's project idea and produce a STRUCTURED assessment as JSON.
Respond in Arabic (unless the input is English). Be specific and practical.
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

  const userPrompt = `حلّل فكرة مشروع التخرج التالي:
عنوان الفكرة: ${project.name}
الوصف: ${project.description}
المشكلة: ${project.problemStatement || "غير محددة"}
الأهداف: ${project.objectives || "غير محددة"}
الجمهور المستهدف: ${project.targetUsers || "غير محدد"}
التقنيات: ${project.technologies || "غير محددة"}
حجم الفريق: ${members.length}
المدة: ${project.durationWeeks || "غير محددة"} أسبوع
المهام الموجودة حالياً: ${existingTasks.length}

أعطِ تقييماً موضوعياً ومفصلاً مع أرقام وخطوات قابلة للتنفيذ.`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) throw new Error("Idea Analyzer agent failed");

  // Persist — later agents (idea-discuss, assistant) read this record.
  await db.ideaAnalysis.create({
    data: {
      userId: project.ownerId,
      projectId: project.id,
      ideaTitle: project.name,
      ideaDescription: project.description,
      feasibility: result.feasibility,
      innovation: result.innovation,
      complexity: result.complexity,
      resultJson: JSON.stringify(result),
    },
  });
  return result;
}

// ---------------------------------------------------------------------------
// Step 2 — Planner Agent (consumes the Idea Analyzer's output)
// ---------------------------------------------------------------------------
async function runPlannerAgent(
  project: any,
  members: any[],
  analysis: any
): Promise<any> {
  const systemPrompt = `You are GradMate AI's Planning Agent, an expert in academic project scheduling.
IMPORTANT: You are part of a multi-agent pipeline. The Idea Analyzer Agent has ALREADY analyzed this project.
Its structured assessment (feasibility, complexity, risks, roadmap) is provided below as YOUR INPUT.
Build the timeline BASED ON that assessment: respect the complexity verdict, schedule mitigation for the
identified risks, and expand the analyzer's roadmap into dated phases.
Generate a realistic, structured project timeline divided into phases and milestones.
Consider: project duration, team size, technical complexity, and dependencies.
Respond in Arabic (unless the input is English).
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
  "estimatedTasks": [{"title": string, "phase": string, "estimatedDays": number, "requiredSkills": string, "priority": "low"|"medium"|"high", "estimatedHours": number}],
  "criticalPath": [string],
  "summary": string
}`;

  const analyzerInput = {
    feasibility: analysis.feasibility,
    innovation: analysis.innovation,
    complexity: analysis.complexity,
    technologies: analysis.technologies?.map((t: any) => t.name),
    risks: analysis.risks,
    roadmap: analysis.roadmap?.map((r: any) => r.title),
  };

  const userPrompt = `أنشئ خطة زمنية ذكية للمشروع التالي:

【مخرجات وكيل تحليل الفكرة — استخدامها كأساس للخطة】
${JSON.stringify(analyzerInput, null, 2)}

اسم المشروع: ${project.name}
الوصف: ${project.description}
التقنيات: ${project.technologies || "غير محدد"}
تاريخ البدء: ${project.startDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}
المدة: ${project.durationWeeks || 12} أسبوع
عدد أعضاء الفريق: ${members.length}
مهارات الفريق: ${members.map((m) => `${m.user.name} (${m.skills || "غير محددة"})`).join(", ")}

ابنِ الخطة فوق تحليل الوكيل السابق — لا تتجاهله، وتفاعل مع مخاطره ومعالمه.`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) throw new Error("Planner agent failed");

  // Persist phases — replacing any previous pipeline-generated phases.
  if (result.phases) {
    await db.timelinePhase.deleteMany({ where: { projectId: project.id } });
    await Promise.all(
      result.phases.map((p: any, idx: number) =>
        db.timelinePhase.create({
          data: {
            projectId: project.id,
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

  // Persist the estimated tasks as real Task records (unassigned, status todo)
  // so the Task Distributor agent — and the student's Smart Tasks view — can
  // consume them.
  if (result.estimatedTasks?.length) {
    await db.task.deleteMany({
      where: { projectId: project.id, status: "todo", assigneeId: null },
    });
    await Promise.all(
      result.estimatedTasks.map((t: any) =>
        db.task.create({
          data: {
            projectId: project.id,
            title: t.title,
            description: `المرحلة: ${t.phase || "عامة"} — من خطة وكيل التخطيط`,
            priority: t.priority || "medium",
            status: "todo",
            estimatedHours: t.estimatedHours || null,
            requiredSkills: t.requiredSkills || null,
            createdById: project.ownerId,
          },
        })
      )
    );
  }
  return result;
}

// ---------------------------------------------------------------------------
// Step 3 — Task Distributor Agent (consumes the Planner's tasks + team data)
// ---------------------------------------------------------------------------
async function runDistributorAgent(
  project: any,
  members: any[],
  plan: any
): Promise<any> {
  // Read back the tasks the Planner agent just created (true handoff: the
  // distributor works on the planner's persisted artifacts, not its own copy).
  const tasks = await db.task.findMany({
    where: { projectId: project.id, status: "todo" },
  });

  const systemPrompt = `You are GradMate AI's Smart Task Distribution Agent, part of a multi-agent pipeline.
The Planning Agent has ALREADY generated the project plan and its estimated tasks (your input below).
Assign each task to the most suitable team member based on: skills match, experience, availability,
current workload, and the planner's phase sequencing. Never auto-overwrite existing assignments — only suggest.
Respond in Arabic (unless the input is English).
JSON shape:
{
  "assignments": [
    {
      "taskTitle": string,
      "recommendedMemberName": string,
      "matchingSkills": [string],
      "estimatedEffort": string,
      "reason": string,
      "confidenceScore": number
    }
  ],
  "summary": string,
  "warnings": [string]
}`;

  const userPrompt = `وزّع المهام التالية (المولّدة من وكيل التخطيط) على أعضاء الفريق:

【خطة وكيل التخطيط — المهام داخل مراحلها】
${JSON.stringify(
    tasks.map((t) => ({
      title: t.title,
      requiredSkills: t.requiredSkills,
      priority: t.priority,
      estimatedHours: t.estimatedHours,
    })),
    null,
    2
  )}

【المراحل الزمنية من الخطة】
${JSON.stringify(plan?.phases?.map((p: any) => ({ title: p.title, dates: `${p.startDate} → ${p.endDate}` })), null, 2)}

أعضاء الفريق:
${JSON.stringify(
    members.map((m) => ({
      name: m.user.name,
      skills: (m.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      experience: m.experience,
      availability: `${m.availability} ساعة/أسبوع`,
      currentLoad: tasks.filter((t) => t.assigneeId === m.userId).length,
    })),
    null,
    2
  )}

أعطِ توصية إسناد لكل مهمة مع توضيح السبب.`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) throw new Error("Task Distributor agent failed");
  return result;
}

// ---------------------------------------------------------------------------
// Step 4 — Defense Simulator Agent (consumes ALL previous outputs)
// ---------------------------------------------------------------------------
async function runDefenseAgent(
  project: any,
  members: any[],
  analysis: any,
  plan: any,
  distribution: any
): Promise<any> {
  const systemPrompt = `You are GradMate AI's Defense Preparation Agent, the final agent in a multi-agent pipeline.
You receive the COMPLETE preparation dossier assembled by the previous agents:
the Idea Analyzer's assessment, the Planner's timeline, and the Task Distributor's assignments.
Generate the questions the graduation committee is MOST LIKELY to ask, grounded in the ACTUAL
dossier content (e.g. question why a specific technology was recommended, or probe the weakest risk).
Respond in Arabic (unless the input is English).
JSON shape:
{
  "questions": [
    {
      "question": string,
      "category": "technical"|"academic"|"managerial",
      "basedOn": string,  // which agent's output this question derives from
      "modelAnswer": string,
      "tips": string
    }
  ],
  "overallAdvice": string
}`;

  const dossier = {
    analysis: {
      feasibility: analysis.feasibility,
      innovation: analysis.innovation,
      complexity: analysis.complexity,
      technologies: analysis.technologies?.map((t: any) => t.name),
      risks: analysis.risks,
    },
    plan: {
      phases: plan?.phases?.map((p: any) => p.title),
      criticalPath: plan?.criticalPath,
    },
    distribution: distribution?.assignments?.map((a: any) => ({
      task: a.taskTitle,
      member: a.recommendedMemberName,
    })),
    team: members.map((m) => m.user.name),
  };

  const userPrompt = `أعدّ أسئلة المناقشة المتوقعة بناءً على الملف الكامل التالي (مخرجات الوكلاء الثلاثة السابقين):

${JSON.stringify(dossier, null, 2)}

اسم المشروع: ${project.name}

اسأل عن نقاط الضعف الحقيقية في الملف، وكل تقنية اختارها وكيل التحليل، والغريب في توزيع المهام.`;

  const result = await callAIJson(systemPrompt, userPrompt);
  if (!result) throw new Error("Defense agent failed");

  // Persist as a defense session (mode: mixed) so it appears in the student's
  // defense-simulator history too.
  await db.defenseSession.create({
    data: {
      projectId: project.id,
      userId: project.ownerId,
      mode: "mixed",
      duration: 30,
      transcriptJson: JSON.stringify(result),
    },
  });
  return result;
}

// ---------------------------------------------------------------------------
// Coordinator — orchestrates the pipeline
// ---------------------------------------------------------------------------
export async function runProjectPrepPipeline(
  project: any,
  members: any[],
  existingTasks: any[]
): Promise<PipelineResult> {
  const steps: PipelineStepStatus[] = [
    { id: "analyzer", name: "وكيل تحليل الفكرة", nameEn: "Idea Analyzer", status: "pending", inputFrom: [] },
    { id: "planner", name: "وكيل التخطيط", nameEn: "Planner", status: "pending", inputFrom: ["analyzer"] },
    { id: "distributor", name: "وكيل توزيع المهام", nameEn: "Task Distributor", status: "pending", inputFrom: ["planner", "analyzer"] },
    { id: "defense", name: "وكيل إعداد المناقشة", nameEn: "Defense Prep", status: "pending", inputFrom: ["analyzer", "planner", "distributor"] },
  ];
  const runId = `prep-${Date.now()}`;
  let analysis: any, plan: any, distribution: any, defense: any;

  // Agent 1: Analyzer — works from raw project data.
  steps[0].status = "running";
  let t0 = Date.now();
  analysis = await runAnalyzerAgent(project, members, existingTasks);
  steps[0].status = "done";
  steps[0].durationMs = Date.now() - t0;
  steps[0].outputSummary = `قابلية التنفيذ: ${analysis.feasibility}/100 | الابتكار: ${analysis.innovation}/100 | التعقيد: ${analysis.complexity}`;

  // Agent 2: Planner — consumes the analyzer's output.
  steps[1].status = "running";
  t0 = Date.now();
  plan = await runPlannerAgent(project, members, analysis);
  steps[1].status = "done";
  steps[1].durationMs = Date.now() - t0;
  steps[1].outputSummary = `${plan.phases?.length || 0} مراحل | ${plan.estimatedTasks?.length || 0} مهام مقترحة | المسار الحرج: ${(plan.criticalPath || []).slice(0, 2).join("، ") || "—"}`;

  // Agent 3: Distributor — consumes the planner's persisted tasks.
  steps[2].status = "running";
  t0 = Date.now();
  distribution = await runDistributorAgent(project, members, plan);
  steps[2].status = "done";
  steps[2].durationMs = Date.now() - t0;
  steps[2].outputSummary = `${distribution.assignments?.length || 0} إسناد | ${distribution.warnings?.length || 0} تحذيرات`;

  // Agent 4: Defense — consumes everything.
  steps[3].status = "running";
  t0 = Date.now();
  defense = await runDefenseAgent(project, members, analysis, plan, distribution);
  steps[3].status = "done";
  steps[3].durationMs = Date.now() - t0;
  steps[3].outputSummary = `${defense.questions?.length || 0} أسئلة متوقعة`;

  // Final synthesis — a plain-language report weaving all agents' outputs.
  const finalReport = await callAI(
    `You are GradMate AI's Coordinator Agent. Four specialist agents just finished preparing a graduation project.
Write a concise final summary for the student in Arabic (or English if the input is English), 250-400 words,
that explicitly mentions what each agent contributed and how the outputs built on each other.
No markdown fences, plain text with short paragraphs.`,
    `مخرجات الوكلاء:
1) محلل الفكرة: ${JSON.stringify(steps[0].outputSummary)} — تقنيات مقترحة: ${analysis.technologies?.map((t: any) => t.name).join(", ")}
2) المخطط: ${JSON.stringify(steps[1].outputSummary)}
3) موزع المهام: ${JSON.stringify(steps[2].outputSummary)}
4) إعداد المناقشة: ${JSON.stringify(steps[3].outputSummary)}

مشروع: ${project.name}`
  );

  return { runId, steps, analysis, plan, distribution, defense, finalReport };
}

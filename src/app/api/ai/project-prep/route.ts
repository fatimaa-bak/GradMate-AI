import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { runProjectPrepPipeline } from "@/lib/agents/project-prep";

// POST /api/ai/project-prep — run the full multi-agent pipeline:
// analyzer → planner → distributor → defense, each consuming the previous
// agent's output. Returns the step statuses, all outputs, and the final
// synthesis report.
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
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const members = await db.membership.findMany({
    where: { projectId },
    include: { user: { omit: { passwordHash: true } } },
  });
  const existingTasks = await db.task.findMany({ where: { projectId } });

  // The pipeline can take a while (4 sequential AI calls) — extend the
  // serverless function timeout budget as far as the platform allows.
  const result = await runProjectPrepPipeline(project, members, existingTasks);

  // Log the pipeline run in the project's activity feed.
  await db.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: "ai_pipeline_run",
      details: JSON.stringify({
        runId: result.runId,
        steps: result.steps.map((s) => ({ id: s.id, status: s.status, ms: s.durationMs })),
      }),
    },
  }).catch(() => {}); // non-fatal if the activity log table is absent

  return NextResponse.json(result);
}

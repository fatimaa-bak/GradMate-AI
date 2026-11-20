// فحص شامل لقاعدة بيانات GradMate AI عبر Prisma (نفس عميل التطبيق)
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("============================================================");
  console.log(" فحص قاعدة البيانات — GradMate AI");
  console.log("============================================================\n");

  // 1. الاتصال (SELECT 1)
  await db.$queryRaw`SELECT 1`;
  console.log("[1] اتصال Prisma بقاعدة البيانات: ناجح ✓");
  console.log("    DATABASE_URL = " + (process.env.DATABASE_URL || "(غير محدد!)"));

  // 2. عدد الصفوف في كل جدول من جداول الـ schema الـ13
  const counts = {
    User: await db.user.count(),
    Project: await db.project.count(),
    Membership: await db.membership.count(),
    Task: await db.task.count(),
    TaskComment: await db.taskComment.count(),
    TimelinePhase: await db.timelinePhase.count(),
    ProjectFile: await db.projectFile.count(),
    Notification: await db.notification.count(),
    ActivityLog: await db.activityLog.count(),
    IdeaAnalysis: await db.ideaAnalysis.count(),
    Conversation: await db.conversation.count(),
    ChatMessage: await db.chatMessage.count(),
    DefenseSession: await db.defenseSession.count(),
  };
  console.log("\n[2] الجداول (13) وعدد الصفوف:");
  for (const [t, c] of Object.entries(counts)) {
    console.log(`    ${t.padEnd(15)} ${c}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`    ${"-".repeat(28)}\n    الإجمالي: ${total} صف`);

  // 3. سلامة العلاقات: مستخدم تجريبي -> عضوية -> مشروع
  const demo = await db.user.findUnique({
    where: { email: "demo@gradmate.ai" },
    include: {
      memberships: { include: { project: { include: { _count: { select: { tasks: true, members: true, timelinePhases: true } } } } } },
    },
  });
  if (!demo) {
    console.log("\n[3] المستخدم التجريبي غير موجود ✗");
  } else {
    console.log(`\n[3] المستخدم التجريبي: ${demo.email} (${demo.name}) ✓`);
    for (const m of demo.memberships) {
      const p = m.project;
      console.log(`    مشروع: "${p.name}" | حالة: ${p.status} | أعضاء: ${p._count.members} | مهام: ${p._count.tasks} | مراحل: ${p._count.timelinePhases}`);
      console.log(`    عضويتي: ${m.role} | التخصص: ${p.specialization || "-"} | التقنيات: ${p.technologies || "-"}`);
    }
  }

  // 4. توزيع حالات المهام (يهم وكيل توزيع المهام)
  const tasks = await db.task.findMany({ select: { status: true, assigneeId: true } });
  const byStatus = {};
  for (const t of tasks) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  const unassigned = tasks.filter((t) => !t.assigneeId).length;
  console.log(`\n[4] حالات المهام: ${JSON.stringify(byStatus)} | غير مُسندة: ${unassigned}`);

  // 5. بيانات أنتجها الوكلاء في الجلسة السابقة (دليل أن الوكلاء يكتبون فعلاً)
  const lastAnalysis = await db.ideaAnalysis.findFirst({ orderBy: { createdAt: "desc" } });
  console.log(`\n[5] آخر تحليل فكرة (Idea Analyzer): ${lastAnalysis ? `feasibility=${lastAnalysis.feasibility}, innovation=${lastAnalysis.innovation}, complexity=${lastAnalysis.complexity}` : "لا يوجد"}`);
  const lastDefense = await db.defenseSession.findFirst({ orderBy: { createdAt: "desc" } });
  console.log(`    آخر جلسة محاكاة (Defense Simulator): ${lastDefense ? `mode=${lastDefense.mode}, رسائل=${JSON.parse(lastDefense.transcriptJson).length}` : "لا يوجد"}`);
  const convs = await db.conversation.findMany({ include: { _count: { select: { messages: true } } } });
  console.log(`    محادثات المساعد (AI Assistant): ${convs.length} (رسائل: ${convs.map(c => c._count.messages).join(", ") || "0"})`);

  // 6. فحص سلامة الملف (PRAGMA quick_check عبر raw)
  const check = await db.$queryRawUnsafe("PRAGMA quick_check");
  console.log(`\n[6] سلامة ملف SQLite: ${JSON.stringify(check)}`);

  console.log("\n============================================================");
  console.log(" النتيجة: قاعدة البيانات شغالة ومربوطة بالتطبيق ✓");
  console.log("============================================================");
}

main()
  .catch((e) => {
    console.error("فشل الفحص:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

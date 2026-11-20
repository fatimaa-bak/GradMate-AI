// Seed script — GradMate AI
// Run: bun run scripts/seed.ts
// Creates demo user + Smart Attendance System project with team and tasks.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding GradMate AI database...");

  // Wipe (dev only)
  await db.taskComment.deleteMany();
  await db.chatMessage.deleteMany();
  await db.conversation.deleteMany();
  await db.ideaAnalysis.deleteMany();
  await db.defenseSession.deleteMany();
  await db.activityLog.deleteMany();
  await db.notification.deleteMany();
  await db.projectFile.deleteMany();
  await db.timelinePhase.deleteMany();
  await db.task.deleteMany();
  await db.membership.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("gradmate123", 10);

  // Demo user
  const demoUser = await db.user.create({
    data: {
      email: "demo@gradmate.ai",
      name: "أحمد محمد",
      passwordHash,
      university: "جامعة الملك سعود",
      faculty: "كلية الحاسبات والمعلومات",
      department: "علوم الحاسب",
    },
  });

  // Team members (as users for auth simplicity)
  const member2 = await db.user.create({
    data: {
      email: "sara@gradmate.ai",
      name: "سارة العلي",
      passwordHash,
      university: "جامعة الملك سعود",
      faculty: "كلية الحاسبات والمعلومات",
      department: "علوم الحاسب",
    },
  });
  const member3 = await db.user.create({
    data: {
      email: "khalid@gradmate.ai",
      name: "خالد الحربي",
      passwordHash,
      university: "جامعة الملك سعود",
      faculty: "كلية الحاسبات والمعلومات",
      department: "هندسة البرمجيات",
    },
  });
  const member4 = await db.user.create({
    data: {
      email: "noura@gradmate.ai",
      name: "نورة القحطاني",
      passwordHash,
      university: "جامعة الملك سعود",
      faculty: "كلية الحاسبات والمعلومات",
      department: "علوم الحاسب",
    },
  });

  // Project: Smart Attendance System (test data)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 35); // 5 weeks ago
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 49); // ~7 weeks from now → 12 weeks total

  const project = await db.project.create({
    data: {
      name: "Smart Attendance System",
      description: "نظام ذكي لتسجيل حضور الطلاب باستخدام التعرف على الوجوه",
      category: "تطبيق ذكاء اصطناعي",
      specialization: "علوم الحاسب",
      problemStatement:
        "تكمن المشكلة في بطء عمليات تسجيل الحضور اليدوي واحتمالية غش الطلاب عبر تسجيل حضور زملائهم، مما يؤثر على دقة متابعة الانتظام الأكاديمي.",
      objectives:
        "بناء نظام آلي يعتمد على التعرف على الوجوه لتسجيل حضور الطلاب داخل القاعات الدراسية بدقة وسرعة، مع توفير لوحة تحكم للأساتذة وإشعارات فورية.",
      targetUsers: "الطلاب والأساتذة وإدارات القاعات في الجامعات",
      technologies: "Python, OpenCV, face_recognition, React, FastAPI, PostgreSQL",
      status: "in_progress",
      currentPhase: "تطوير النموذج",
      startDate,
      endDate,
      durationWeeks: 12,
      academicYear: "2025-2026",
      ownerId: demoUser.id,
      supervisorName: "د. عبدالله السالم",
    },
  });

  // Memberships
  await db.membership.createMany({
    data: [
      { userId: demoUser.id, projectId: project.id, role: "owner", skills: "Python,React,FastAPI,إدارة مشاريع", experience: "advanced", availability: 25 },
      { userId: member2.id, projectId: project.id, role: "member", skills: "OpenCV,Python,تصور البيانات", experience: "intermediate", availability: 20 },
      { userId: member3.id, projectId: project.id, role: "member", skills: "React,TypeScript,UI/UX", experience: "intermediate", availability: 22 },
      { userId: member4.id, projectId: project.id, role: "member", skills: "PostgreSQL,FastAPI,اختبار", experience: "beginner", availability: 18 },
    ],
  });

  // Tasks
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  await db.task.createMany({
    data: [
      { projectId: project.id, title: "جمع وتحضير مجموعة بيانات الوجوه", description: "تجميع صور لـ 50 طالباً من زوايا متعددة وتنظيفها", assigneeId: member2.id, priority: "high", status: "completed", startDate: new Date(today.getTime() - 30 * day), dueDate: new Date(today.getTime() - 14 * day), estimatedHours: 20, progress: 100, createdById: demoUser.id },
      { projectId: project.id, title: "بناء نموذج التعرف على الوجوه", description: "تدريب نموذج باستخدام face_recognition ومقارنته مع MTCNN", assigneeId: demoUser.id, priority: "urgent", status: "in_progress", startDate: new Date(today.getTime() - 14 * day), dueDate: new Date(today.getTime() + 7 * day), estimatedHours: 30, progress: 65, createdById: demoUser.id },
      { projectId: project.id, title: "تصميم واجهة لوحة التحكم", description: "واجهة React للأستاذ لعرض الحضور وإرسال الإشعارات", assigneeId: member3.id, priority: "medium", status: "in_progress", startDate: new Date(today.getTime() - 10 * day), dueDate: new Date(today.getTime() + 10 * day), estimatedHours: 25, progress: 40, createdById: demoUser.id },
      { projectId: project.id, title: "تصميم قاعدة البيانات", description: "نموذج بيانات للطلاب والمحاضرات وسجلات الحضور", assigneeId: member4.id, priority: "high", status: "completed", startDate: new Date(today.getTime() - 28 * day), dueDate: new Date(today.getTime() - 18 * day), estimatedHours: 12, progress: 100, createdById: demoUser.id },
      { projectId: project.id, title: "بناء API لتسجيل الحضور", description: "نقاط نهاية FastAPI لاستقبال الصور وحفظ السجلات", assigneeId: demoUser.id, priority: "high", status: "todo", startDate: new Date(today.getTime() + 3 * day), dueDate: new Date(today.getTime() + 14 * day), estimatedHours: 18, progress: 0, createdById: demoUser.id },
      { projectId: project.id, title: "دمج الكاميرا مع النموذج", description: "التقاط إطار من كاميرا القاعة وتمريره للنموذج", assigneeId: member2.id, priority: "medium", status: "todo", startDate: new Date(today.getTime() + 7 * day), dueDate: new Date(today.getTime() + 18 * day), estimatedHours: 15, progress: 0, createdById: demoUser.id },
      { projectId: project.id, title: "كتابة تقرير المرحلة الأولى", description: "توثيق منهجية بناء النموذج والنتائج الأولية", assigneeId: member4.id, priority: "low", status: "overdue", startDate: new Date(today.getTime() - 21 * day), dueDate: new Date(today.getTime() - 3 * day), estimatedHours: 8, progress: 30, createdById: demoUser.id },
      { projectId: project.id, title: "اختبار دقة النظام", description: "اختبار على مجموعة اختبار مستقلة وحساب الدقة والاستدعاء", assigneeId: member3.id, priority: "high", status: "todo", startDate: new Date(today.getTime() + 14 * day), dueDate: new Date(today.getTime() + 25 * day), estimatedHours: 16, progress: 0, createdById: demoUser.id },
      { projectId: project.id, title: "إعداد عرض المناقشة", description: "تحضير العرض التقديمي النهائي والعرض التجريبي", assigneeId: demoUser.id, priority: "urgent", status: "todo", startDate: new Date(today.getTime() + 21 * day), dueDate: new Date(today.getTime() + 35 * day), estimatedHours: 20, progress: 0, createdById: demoUser.id },
    ],
  });

  // Timeline phases
  await db.timelinePhase.createMany({
    data: [
      { projectId: project.id, title: "التحليل والتخطيط", description: "تحليل المتطلبات وتصميم النظام", startDate: new Date(startDate.getTime()), endDate: new Date(startDate.getTime() + 14 * day), progress: 100, order: 0 },
      { projectId: project.id, title: "بناء النموذج", description: "جمع البيانات وتدريب نموذج التعرف", startDate: new Date(startDate.getTime() + 14 * day), endDate: new Date(startDate.getTime() + 42 * day), progress: 60, order: 1 },
      { projectId: project.id, title: "تطوير التطبيق", description: "بناء الواجهات وAPI وقاعدة البيانات", startDate: new Date(startDate.getTime() + 42 * day), endDate: new Date(startDate.getTime() + 70 * day), progress: 25, order: 2, isMilestone: false },
      { projectId: project.id, title: "الاختبار والتكامل", description: "اختبار النظام ودمج المكونات", startDate: new Date(startDate.getTime() + 70 * day), endDate: new Date(startDate.getTime() + 77 * day), progress: 0, order: 3, isMilestone: true },
      { projectId: project.id, title: "المناقشة والتسليم", description: "إعداد العرض والوثائق النهائية", startDate: new Date(startDate.getTime() + 77 * day), endDate: new Date(endDate.getTime()), progress: 0, order: 4, isMilestone: true },
    ],
  });

  // Notifications
  await db.notification.createMany({
    data: [
      { userId: demoUser.id, projectId: project.id, type: "deadline", title: "موعد نهائي قريب", body: "مهمة «بناء نموذج التعرف على الوجوه» تستحق خلال 7 أيام", read: false },
      { userId: demoUser.id, projectId: project.id, type: "task", title: "مهمة متأخرة", body: "تقرير المرحلة الأولى متأخر. يُنصح بإعادة التوزيع.", read: false },
      { userId: demoUser.id, projectId: project.id, type: "ai", title: "توصية ذكية", body: "عبء العمل على أحمد مرتفع. فكّر في إعادة توزيع مهمتين.", read: false },
      { userId: demoUser.id, projectId: project.id, type: "team", title: "تحديث الفريق", body: "أكملت سارة جمع البيانات بنجاح", read: true },
    ],
  });

  // Activity log
  await db.activityLog.createMany({
    data: [
      { projectId: project.id, userId: member2.id, action: "completed_task", details: "أكملت سارة مهمة «جمع وتحضير مجموعة بيانات الوجوه»" },
      { projectId: project.id, userId: demoUser.id, action: "updated_project", details: "تم تحديث تقدم المشروع إلى 45%" },
      { projectId: project.id, userId: member3.id, action: "started_task", details: "بدأ خالد بتصميم لوحة التحكم" },
      { projectId: project.id, userId: member4.id, action: "completed_task", details: "أكملت نورة تصميم قاعدة البيانات" },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo user: demo@gradmate.ai / gradmate123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

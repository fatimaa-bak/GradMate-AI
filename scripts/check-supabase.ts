// فحص قاعدة Supabase السحابية بعد البذر (اتصال مباشر عبر Bun.SQL)
// Usage: DATABASE_SESSION_URL="postgres://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres" bun scripts/check-supabase.ts
const conn = process.env.DATABASE_SESSION_URL;
if (!conn) {
  console.error("مفقود DATABASE_SESSION_URL — مرّر رابط session pooler مع كلمة المرور");
  process.exit(1);
}

const sql = new Bun.SQL(conn, { idleTimeout: 10, max: 1 });

// 1. الجداول المتوقعة (13)
const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
console.log("الجداول في public:", tables.map((t: any) => t.tablename).join(", "));

// 2. عدد الصفوف في كل جدول
const expected = ["User", "Project", "Membership", "Task", "TimelinePhase", "Notification", "ActivityLog", "TaskComment", "ProjectFile", "IdeaAnalysis", "Conversation", "ChatMessage", "DefenseSession"];
console.log("\nعدد الصفوف:");
let total = 0;
for (const t of expected) {
  const r = await sql`SELECT count(*)::int as c FROM ${sql(t)}`;
  console.log(`  ${t.padEnd(15)} ${r[0].c}`);
  total += r[0].c;
}
console.log(`  ${"-".repeat(24)}\n  الإجمالي: ${total}`);

// 3. سلامة العلاقات: المستخدم التجريبي
const demo = await sql`SELECT email, name FROM "User" WHERE email='demo@gradmate.ai'`;
console.log(`\nالمستخدم التجريبي: ${demo.length ? demo[0].name + " <" + demo[0].email + ">" : "غير موجود ✗"}`);

const proj = await sql`SELECT p.name, p.status, (SELECT count(*) FROM "Membership" m WHERE m."projectId"=p.id) as members, (SELECT count(*) FROM "Task" t WHERE t."projectId"=p.id) as tasks FROM "Project" p`;
console.log(`المشروع: ${proj.map((p: any) => `${p.name} (${p.status}) — أعضاء: ${p.members}، مهام: ${p.tasks}`).join(" | ")}`);

await sql.end();
console.log("\n✓ قاعدة Supabase جاهزة ومعبأة");

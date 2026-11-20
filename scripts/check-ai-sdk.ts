// فحص مباشر للأداة الخارجية: z-ai-web-dev-sdk (مزوّد الذكاء الاصطناعي للوكلاء)
// يختبر: إنشاء العميل + استدعاء chat completion + استجابة JSON منضبطة
import ZAI from "z-ai-web-dev-sdk";

async function main() {
  console.log("============================================================");
  console.log(" فحص الأداة الخارجية — z-ai-web-dev-sdk");
  console.log("============================================================\n");

  // 1. إنشاء العميل (الاعتمادات تُضبط تلقائياً في البيئة)
  const t0 = Date.now();
  const zai = await ZAI.create();
  console.log(`[1] ZAI.create(): ناجح ✓ (${Date.now() - t0}ms)`);

  // 2. استدعاء نص عادي (مثل وكيل المساعد/محاكي المناقشة)
  const t1 = Date.now();
  const resp = await zai.chat.completions.create({
    messages: [
      { role: "system", content: "أجب بإيجاز شديد." },
      { role: "user", content: "قل جملة واحدة فقط: الذكاء الاصطناعي في التعليم" },
    ],
    temperature: 0.5,
    max_tokens: 100,
  });
  const text = resp.choices?.[0]?.message?.content || "";
  console.log(`[2] استدعاء نصي: ناجح ✓ (${Date.now() - t1}ms) | نموذج: ${resp.model || "غير معلن"}`);
  console.log(`    الرد: ${text.slice(0, 150)}`);

  // 3. استدعاء JSON منضبط (مثل idea-analyzer/planner/team-analyzer)
  const t2 = Date.now();
  const resp2 = await zai.chat.completions.create({
    messages: [
      { role: "system", content: 'You MUST respond with ONLY valid JSON, no markdown fences. Shape: {"ok": boolean, "language": string}' },
      { role: "user", content: 'اختبر الاتصال: أعد {"ok": true, "language": "arabic"}' },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });
  let raw2 = (resp2.choices?.[0]?.message?.content || "").trim();
  raw2 = raw2.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  let parsed = null;
  try { parsed = JSON.parse(raw2); } catch {}
  console.log(`[3] استدعاء JSON: ${parsed ? "ناجح ✓" : "فشل التحليل ✗"} (${Date.now() - t2}ms)`);
  console.log(`    الرد: ${JSON.stringify(parsed) || raw2.slice(0, 150)}`);

  const allOk = text.length > 0 && parsed !== null;
  console.log(`\n============================================================`);
  console.log(` النتيجة: ${allOk ? "الأداة الخارجية مربوطة وتعمل ✓" : "يوجد خلل — راجع الأخطاء أعلاه ✗"}`);
  console.log(`============================================================`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("فشل الاتصال بالأداة الخارجية:", e?.message || e);
  process.exit(1);
});

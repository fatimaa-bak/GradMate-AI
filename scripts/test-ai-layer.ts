// اختبار طبقة الذكاء الاصطناعي الجديدة (src/lib/ai.ts)
// الحالات: بدون مفتاح (ZAI) | مفتاح وهمي (يصل جوجل ثم يسقط إلى ZAI) | JSON mode
import { callAI, callAIJson } from "../src/lib/ai";

async function main() {
  console.log("============================================================");
  console.log(" اختبار طبقة AI — Gemini + ZAI fallback");
  console.log("============================================================\n");

  // 1) بدون مفتاح → يجب أن يذهب لـ ZAI مباشرة
  delete process.env.GEMINI_API_KEY;
  console.log("[1] بدون GEMINI_API_KEY (المسار: ZAI)");
  const t1 = await callAI("أجب بإيجاز شديد.", "ما هو اثنان زائد اثنان؟", { max_tokens: 50 });
  console.log(`    الرد: ${t1.slice(0, 120)}`);
  console.log(`    ${t1.includes("Demo fallback") ? "✗ وصل للـ fallback!" : "✓ رد حقيقي من مزوّد"}\n`);

  // 2) مفتاح وهمي → يجب أن يصل جوجل، يفشل، ثم يسقط إلى ZAI
  process.env.GEMINI_API_KEY = "DUMMY_KEY_FOR_REACHABILITY_TEST";
  console.log("[2] GEMINI_API_KEY وهمي (المسار: Gemini يفشل → ZAI)");
  const t2 = await callAI("أجب بإيجاز شديد.", "اذكر اسم كوكب واحد فقط.", { max_tokens: 50 });
  console.log(`    الرد: ${t2.slice(0, 120)}`);
  console.log(`    ${t2.includes("Demo fallback") ? "✗ وصل للـ fallback!" : "✓ سقط بنجاح إلى ZAI"}\n`);

  // 3) JSON mode عبر callAIJson (يجب أن يرجع كائن JSON صالح)
  console.log("[3] callAIJson (المسار: ZAI، استدعاء JSON)");
  const t3 = await callAIJson<{ ok: boolean; items: string[] }>(
    'أعد JSON فقط بالشكل: {"ok": true, "items": ["س", "ص"]}',
    "اختبر: أعد JSON يحتوي ok=true و items من عنصرين"
  );
  console.log(`    النتيجة: ${JSON.stringify(t3)?.slice(0, 160)}`);
  console.log(`    ${t3 && typeof t3 === "object" ? "✓ JSON صالح" : "✗ فشل التحليل"}\n`);

  const ok = !t1.includes("Demo fallback") && !t2.includes("Demo fallback") && t3 && typeof t3 === "object";
  console.log("============================================================");
  console.log(` النتيجة: ${ok ? "الطبقة الجديدة تعمل والسلسلة سليمة ✓" : "يوجد خلل ✗"}`);
  console.log("============================================================");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error("فشل الاختبار:", e); process.exit(1); });

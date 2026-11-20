// Server-side AI helper.
// Provider order: Google Gemini (if GEMINI_API_KEY is set) → z-ai-web-dev-sdk
// (auto-configured inside the Z.ai sandbox) → deterministic demo fallback.
// Never import this from client code.

const GEMINI_DEFAULT_MODEL = "gemini-4-hydrogen";

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; max_tokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  // 1) Google Gemini — production provider (REST, no SDK needed)
  if (process.env.GEMINI_API_KEY) {
    const text = await callGemini(systemPrompt, userPrompt, opts);
    if (text) return text;
    console.error("[ai] Gemini failed — falling back to z-ai-web-dev-sdk");
  }

  // 2) z-ai-web-dev-sdk — works inside the Z.ai sandbox without any key
  try {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const resp = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.max_tokens ?? 1800,
    });
    const content = resp.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackAI(userPrompt);
    }
    return content;
  } catch (e) {
    console.error("AI call failed:", e);
    return fallbackAI(userPrompt);
  }
}

// Structured JSON output
export async function callAIJson<T = any>(
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  const raw = await callAI(
    systemPrompt + "\n\nYou MUST respond with ONLY valid JSON (no markdown fences, no prose, no commentary).",
    userPrompt,
    // JSON agents need room for the full structured shape (avoids truncated output)
    { max_tokens: 2400, jsonMode: true }
  );
  try {
    return extractJson<T>(raw);
  } catch (e) {
    console.error("AI JSON parse failed:", e, "\nRAW:", raw);
    return null;
  }
}

// Google Gemini REST call (generateContent). Returns null on any failure so
// callers can fall back to the next provider.
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; max_tokens?: number; jsonMode?: boolean }
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
  const makeBody = (withJsonMode: boolean) => ({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.max_tokens ?? 1800,
      // Native JSON mode — Gemini then returns strictly valid JSON
      ...(withJsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });

  try {
    const t0 = Date.now();
    let res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(makeBody(!!opts.jsonMode)),
      signal: AbortSignal.timeout(60_000),
    });

    // Some model/config combos reject responseMimeType — retry once without it,
    // but only when the error is actually about the mime type (not auth/geo errors)
    if (!res.ok && opts.jsonMode && res.status === 400) {
      const errBody = await res.text();
      if (/mime|responseMimeType/i.test(errBody)) {
        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(makeBody(false)),
          signal: AbortSignal.timeout(60_000),
        });
      } else {
        console.error(`[ai] Gemini HTTP ${res.status} (${model}):`, errBody.slice(0, 300));
        return null;
      }
    }

    // Transient rate-limit / server errors — one retry after a short pause
    if (!res.ok && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(makeBody(!!opts.jsonMode)),
        signal: AbortSignal.timeout(60_000),
      });
    }

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300);
      console.error(`[ai] Gemini HTTP ${res.status} (${model}):`, errText);
      return null;
    }

    const data: any = await res.json();
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || [])
      .map((p: any) => p?.text || "")
      .join("")
      .trim();
    if (!text) {
      console.error(`[ai] Gemini empty response (finishReason: ${candidate?.finishReason || "unknown"})`);
      return null;
    }
    console.log(`[ai] gemini ok (${model}, ${Date.now() - t0}ms)`);
    return text;
  } catch (e) {
    console.error("[ai] Gemini request failed:", e);
    return null;
  }
}

// Robust JSON extractor — handles markdown fences, leading/trailing prose, code blocks
function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();
  // Remove markdown fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  // Try direct parse first
  try { return JSON.parse(text) as T; } catch {}
  // Find first { or [ and last matching } or ]
  const firstBrace = text.search(/[{\[]/);
  if (firstBrace === -1) return null;
  const opener = text[firstBrace];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastClose = -1;
  for (let i = firstBrace; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === opener) depth++;
    else if (c === closer) {
      depth--;
      if (depth === 0) { lastClose = i; break; }
    }
  }
  if (lastClose === -1) return null;
  const jsonStr = text.slice(firstBrace, lastClose + 1);
  try { return JSON.parse(jsonStr) as T; } catch (e) {
    console.error("JSON extract failed:", e, "\nSTR:", jsonStr.slice(0, 300));
    return null;
  }
}

// Deterministic fallback if no AI provider is reachable (keeps UI functional)
function fallbackAI(userPrompt: string): string {
  return JSON.stringify({
    note: "Demo fallback response — no AI provider available. Set GEMINI_API_KEY for real AI generation.",
    echo: userPrompt.slice(0, 200),
  });
}

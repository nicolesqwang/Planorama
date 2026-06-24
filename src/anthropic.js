// Direct browser → Anthropic API calls for the Finances and Smart Scheduler features.
// NOTE: this exposes VITE_ANTHROPIC_KEY in the bundled JS — fine for a portfolio demo,
// not for production. Move this to a server function before shipping to real users.

const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;
const MODEL = "claude-sonnet-4-6";

// Anthropic blocks plain browser fetches by default; this header is the documented
// opt-in for client-side calls (without it every request gets CORS-rejected).
const BROWSER_HEADERS = {
  "Content-Type": "application/json",
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

// Strip colorful pictograph emoji from AI output so it stays consistent with the
// app's monochrome-symbol aesthetic (✦ ✿ ❀ ☽ ♡ etc. are fine and left alone).
const COLOR_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2300}-\u{23FF}]/gu;
export function stripColorEmoji(text) {
  return (text || "").replace(COLOR_EMOJI, "").replace(/[ \t]{2,}/g, " ").trim();
}

export async function askClaude(systemPrompt, userMessage, maxTokens = 1000) {
  if (!API_KEY) {
    throw new Error("Missing VITE_ANTHROPIC_KEY — add your Anthropic API key to .env to use this feature.");
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { ...BROWSER_HEADERS, "x-api-key": API_KEY },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// Parses Claude's reply as JSON, tolerating stray markdown code fences.
export function parseClaudeJSON(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

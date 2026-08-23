const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    revision: process.env.GEMINI_API_REVISION || "2026-05-20"
  };
}

export async function callGeminiStructured({
  systemInstruction,
  input,
  schema,
  generationConfig = null,
  timeoutMs = 55000
}) {
  const { apiKey, model, revision } = getGeminiConfig();
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured.");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
      "Api-Revision": revision
    },
    body: JSON.stringify({
      model,
      store: false,
      system_instruction: systemInstruction,
      input,
      ...(generationConfig ? { generation_config: generationConfig } : {}),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema
      }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Gemini request failed with status ${response.status}.`;
    const error = new Error(message);
    error.code = payload?.error?.status || `HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    const error = new Error("Gemini returned no structured text output.");
    error.code = "EMPTY_MODEL_OUTPUT";
    throw error;
  }

  try {
    return JSON.parse(stripCodeFence(outputText));
  } catch (parseError) {
    const error = new Error("Gemini returned output that could not be parsed as JSON.");
    error.code = "INVALID_MODEL_JSON";
    error.cause = parseError;
    throw error;
  }
}

function extractOutputText(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.output_text === "string") return payload.output_text;

  const chunks = [];
  for (const step of payload.steps || []) {
    if (step?.type !== "model_output") continue;
    for (const content of step.content || []) {
      if (content?.type === "text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("");
}

function stripCodeFence(value) {
  const trimmed = String(value).trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

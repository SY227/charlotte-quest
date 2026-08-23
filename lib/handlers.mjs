import { ANALYSIS_SCHEMA, QUESTION_BATCH_SCHEMA } from "./schemas.mjs";
import {
  ANALYSIS_SYSTEM_PROMPT,
  QUESTION_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildQuestionPrompt
} from "./prompts.mjs";
import { callGeminiStructured, getGeminiConfig } from "./gemini.mjs";
import {
  generateFallbackQuestions,
  validateAndNormalizeQuestion
} from "../shared/question-engine.js";

const MAX_IMAGES = 8;
const MAX_INLINE_BYTES_ESTIMATE = 18 * 1024 * 1024;

export async function analyzeHomeworkPayload(body) {
  const images = Array.isArray(body?.images) ? body.images.slice(0, MAX_IMAGES) : [];
  if (!images.length) {
    return errorResult(400, "NO_IMAGES", "Add at least one homework photo.");
  }

  let estimatedBytes = 0;
  const imageInputs = [];
  for (const image of images) {
    const data = cleanBase64(image?.data);
    const mimeType = normalizeMimeType(image?.mimeType);
    if (!data) continue;
    estimatedBytes += Math.floor((data.length * 3) / 4);
    imageInputs.push({ type: "image", data, mime_type: mimeType });
  }

  if (!imageInputs.length) {
    return errorResult(400, "INVALID_IMAGES", "The selected images could not be read.");
  }

  if (estimatedBytes > MAX_INLINE_BYTES_ESTIMATE) {
    return errorResult(
      413,
      "IMAGES_TOO_LARGE",
      "The images are still too large. Try fewer photos or crop them more tightly."
    );
  }

  try {
    const result = await callGeminiStructured({
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      input: [
        { type: "text", text: buildAnalysisPrompt({ imageCount: imageInputs.length }) },
        ...imageInputs
      ],
      schema: ANALYSIS_SCHEMA
    });

    return {
      status: 200,
      body: {
        ok: true,
        model: getGeminiConfig().model,
        pack: normalizeAnalysisPack(result)
      }
    };
  } catch (error) {
    return geminiErrorResult(error, "I couldn't analyze those pages yet. Please try again.");
  }
}

export async function generateQuestionsPayload(body) {
  const pack = body?.pack && typeof body.pack === "object" ? body.pack : null;
  const selectedConcepts = Array.isArray(body?.selectedConcepts)
    ? body.selectedConcepts.map(String).slice(0, 20)
    : [];
  const count = clampInteger(body?.count, 1, 12, 10);
  const startingIndex = clampInteger(body?.startingIndex, 0, 500, 0);
  const avoidFingerprints = Array.isArray(body?.avoidFingerprints)
    ? body.avoidFingerprints.map(String).slice(-100)
    : [];
  const performanceSummary = body?.performanceSummary || null;

  if (!pack) {
    return errorResult(400, "NO_LEARNING_PACK", "Choose or analyze a learning set first.");
  }

  try {
    const result = await callGeminiStructured({
      systemInstruction: QUESTION_SYSTEM_PROMPT,
      input: buildQuestionPrompt({
        pack,
        selectedConcepts,
        count,
        startingIndex,
        avoidFingerprints,
        performanceSummary
      }),
      schema: QUESTION_BATCH_SCHEMA,
      generationConfig: { thinking_level: "low" }
    });

    const questions = normalizeQuestionBatch(result?.questions, count, {
      pack,
      selectedConcepts,
      startingIndex,
      avoidFingerprints
    });

    return {
      status: 200,
      body: {
        ok: true,
        source: "gemini",
        model: getGeminiConfig().model,
        questions
      }
    };
  } catch (error) {
    const fallback = generateFallbackQuestions({
      pack,
      conceptIds: selectedConcepts,
      count,
      seed: `${pack.id || "pack"}:${Date.now()}`,
      startingIndex,
      avoidFingerprints,
      difficulty: 2
    });

    if (fallback.length) {
      return {
        status: 200,
        body: {
          ok: true,
          source: "fallback",
          warning:
            error?.code === "MISSING_API_KEY"
              ? "Gemini is not configured, so the built-in Grade 3 practice engine was used."
              : "Gemini was temporarily unavailable, so the built-in Grade 3 practice engine was used.",
          questions: fallback
        }
      };
    }

    return geminiErrorResult(error, "I couldn't build the next questions yet. Please try again.");
  }
}

export function healthPayload() {
  const config = getGeminiConfig();
  return {
    status: 200,
    body: {
      ok: true,
      configured: Boolean(config.apiKey),
      model: config.model
    }
  };
}

function normalizeQuestionBatch(rawQuestions, count, context) {
  const used = new Set(context.avoidFingerprints || []);
  const normalized = [];

  for (const rawQuestion of Array.isArray(rawQuestions) ? rawQuestions : []) {
    const question = validateAndNormalizeQuestion(
      rawQuestion,
      `gemini-${context.startingIndex + normalized.length + 1}`
    );
    if (!question || used.has(question.fingerprint)) continue;
    used.add(question.fingerprint);
    normalized.push(question);
    if (normalized.length >= count) break;
  }

  if (normalized.length < count) {
    const fillers = generateFallbackQuestions({
      pack: context.pack,
      conceptIds: context.selectedConcepts,
      count: count - normalized.length,
      seed: `${context.pack.id || "pack"}:fill:${Date.now()}`,
      startingIndex: context.startingIndex + normalized.length,
      avoidFingerprints: [...used],
      difficulty: 2
    });
    normalized.push(...fillers);
  }

  return normalized.slice(0, count);
}

function normalizeAnalysisPack(raw) {
  const concepts = uniqueById(
    (Array.isArray(raw?.concepts) ? raw.concepts : [])
      .slice(0, 12)
      .map((concept, index) => ({
        id: slugify(concept?.id || concept?.name || `concept-${index + 1}`),
        name: safeText(concept?.name, 80, `Concept ${index + 1}`),
        childFriendlyName: safeText(concept?.childFriendlyName, 90, concept?.name || "New skill"),
        description: safeText(concept?.description, 260, "Practice this skill with new examples."),
        icon: safeEmoji(concept?.icon),
        confidence: clampNumber(concept?.confidence, 0, 1, 0.75),
        selectedByDefault: concept?.selectedByDefault !== false
      }))
  );

  const practiceNeeds = (Array.isArray(raw?.practiceNeeds) ? raw.practiceNeeds : [])
    .slice(0, 8)
    .map((need, index) => ({
      conceptId: findConceptId(need?.conceptId, concepts),
      title: safeText(need?.title, 100, `Practice focus ${index + 1}`),
      observation: safeText(need?.observation, 300, "This concept deserves a little more practice."),
      practicalApproach: safeText(
        need?.practicalApproach,
        300,
        "Break the problem into small steps and check what each number means."
      )
    }));

  const strengths = (Array.isArray(raw?.strengths) ? raw.strengths : [])
    .slice(0, 6)
    .map((strength, index) => ({
      title: safeText(strength?.title, 100, `Strength ${index + 1}`),
      detail: safeText(strength?.detail, 260, "The visible work shows progress with this skill.")
    }));

  const mix = normalizeMix(raw?.recommendedQuestionMix, concepts, practiceNeeds);

  return {
    id: slugify(raw?.id || `charlotte-pack-${Date.now()}`),
    createdAt: new Date().toISOString(),
    source: "uploaded-homework",
    subject: safeText(raw?.subject, 60, "School Practice"),
    title: safeText(raw?.title, 100, "Charlotte's New Practice Quest"),
    shortTitle: safeText(raw?.shortTitle, 60, raw?.title || "New Practice"),
    gradeFit: safeText(raw?.gradeFit, 80, "Grade 3"),
    summaryForParent: redactPersonalInfo(
      safeText(raw?.summaryForParent, 700, "The pages show several connected Grade 3 skills to practice.")
    ),
    childIntro: redactPersonalInfo(
      safeText(raw?.childIntro, 240, "Let's practice the ideas from your schoolwork with some fresh questions.")
    ),
    strengths,
    practiceNeeds,
    reusableStrategy: (Array.isArray(raw?.reusableStrategy) ? raw.reusableStrategy : [])
      .slice(0, 6)
      .map((step) => safeText(step, 180, ""))
      .filter(Boolean),
    concepts: concepts.length
      ? concepts
      : [
          {
            id: "grade3-review",
            name: "Grade 3 review",
            childFriendlyName: "Today's school skill",
            description: "Practice the main idea shown in the uploaded pages.",
            icon: "⭐",
            confidence: 0.6,
            selectedByDefault: true
          }
        ],
    vocabulary: (Array.isArray(raw?.vocabulary) ? raw.vocabulary : [])
      .slice(0, 12)
      .map((item) => ({
        term: safeText(item?.term, 70, ""),
        meaning: safeText(item?.meaning, 220, "")
      }))
      .filter((item) => item.term && item.meaning),
    uncertainNotes: (Array.isArray(raw?.uncertainNotes) ? raw.uncertainNotes : [])
      .slice(0, 6)
      .map((note) => redactPersonalInfo(safeText(note, 300, "")))
      .filter(Boolean),
    recommendedQuestionMix: mix
  };
}

function normalizeMix(rawMix, concepts, practiceNeeds) {
  const available = new Set(concepts.map((concept) => concept.id));
  const result = [];
  for (const item of Array.isArray(rawMix) ? rawMix : []) {
    const conceptId = findConceptId(item?.conceptId, concepts);
    if (!available.has(conceptId) || result.some((entry) => entry.conceptId === conceptId)) continue;
    result.push({ conceptId, weight: clampInteger(item?.weight, 1, 100, 10) });
  }

  for (const need of practiceNeeds) {
    if (available.has(need.conceptId) && !result.some((entry) => entry.conceptId === need.conceptId)) {
      result.push({ conceptId: need.conceptId, weight: 20 });
    }
  }

  for (const concept of concepts) {
    if (!result.some((entry) => entry.conceptId === concept.id)) {
      result.push({ conceptId: concept.id, weight: 10 });
    }
  }
  return result.slice(0, 12);
}

function cleanBase64(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
}

function normalizeMimeType(value) {
  const mime = String(value || "image/jpeg").toLowerCase();
  if (["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mime)) return mime;
  return "image/jpeg";
}

function safeText(value, maxLength, fallback) {
  const text = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback || "").slice(0, maxLength);
}

function safeEmoji(value) {
  const text = String(value || "⭐").trim();
  return text ? [...text].slice(0, 2).join("") : "⭐";
}

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `pack-${Date.now()}`;
}

function findConceptId(value, concepts) {
  const requested = slugify(value || "");
  if (concepts.some((concept) => concept.id === requested)) return requested;
  const partial = concepts.find(
    (concept) => concept.id.includes(requested) || requested.includes(concept.id)
  );
  return partial?.id || concepts[0]?.id || "grade3-review";
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function redactPersonalInfo(value) {
  return String(value)
    .replace(/Charlotte\s+Yam/gi, "Charlotte")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "the worksheet date")
    .replace(/\b(student|school|teacher)\s*(id|number|name)?\s*[:#-]\s*[^,.]+/gi, "$1 information");
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function errorResult(status, code, message) {
  return { status, body: { ok: false, code, message } };
}

function geminiErrorResult(error, fallbackMessage) {
  const status = error?.code === "MISSING_API_KEY" ? 503 : error?.status || 502;
  return {
    status,
    body: {
      ok: false,
      code: error?.code || "GEMINI_ERROR",
      message:
        error?.code === "MISSING_API_KEY"
          ? "Add GEMINI_API_KEY to .env.local before analyzing new homework."
          : fallbackMessage,
      detail: process.env.NODE_ENV === "development" ? String(error?.message || "") : undefined
    }
  };
}

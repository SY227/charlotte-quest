import { CHARLOTTE_SAMPLE_PACK } from "./shared/sample-pack.js";
import {
  generateFallbackQuestions,
  isAnswerCorrect,
  validateAndNormalizeQuestion
} from "./shared/question-engine.js";
import { ANALYSIS_SCHEMA, QUESTION_BATCH_SCHEMA } from "./lib/schemas.mjs";
import { healthPayload } from "./lib/handlers.mjs";

const questions = generateFallbackQuestions({
  pack: CHARLOTTE_SAMPLE_PACK,
  conceptIds: CHARLOTTE_SAMPLE_PACK.concepts.map((concept) => concept.id),
  count: 50,
  seed: "charlotte-check",
  difficulty: 2
});

if (questions.length !== 50) throw new Error(`Expected 50 questions, received ${questions.length}.`);
if (new Set(questions.map((question) => question.fingerprint)).size !== 50) {
  throw new Error("Question fingerprints are not unique.");
}
for (const [index, question] of questions.entries()) {
  const normalized = validateAndNormalizeQuestion(question, `question-${index + 1}`);
  if (!normalized) throw new Error(`Question ${index + 1} failed validation.`);
  if (!isAnswerCorrect(normalized, normalized.answer.value)) {
    throw new Error(`Question ${index + 1} did not accept its own answer.`);
  }
  if (normalized.validation.operation === "multiply") {
    const expected = normalized.validation.factorA * normalized.validation.factorB;
    if (normalized.validation.product !== expected) {
      throw new Error(`Question ${index + 1} has incorrect multiplication validation.`);
    }
  }
}
if (!ANALYSIS_SCHEMA.properties?.concepts) throw new Error("Analysis schema is incomplete.");
if (!QUESTION_BATCH_SCHEMA.properties?.questions) throw new Error("Question schema is incomplete.");
if (!healthPayload().body.ok) throw new Error("Health handler failed.");
console.log(`Checks passed: ${questions.length} validated questions across ${new Set(questions.map((q) => q.conceptId)).size} concepts.`);

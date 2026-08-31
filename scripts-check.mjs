import fs from "node:fs";

import {
  CHARLOTTE_SAMPLE_PACK
} from "./shared/sample-pack.js";

import {
  isAnswerCorrect,
  validateAndNormalizeQuestion
} from "./shared/question-engine.js";

import {
  ANALYSIS_SCHEMA,
  QUESTION_BATCH_SCHEMA
} from "./lib/schemas.mjs";

import {
  QUESTION_SYSTEM_PROMPT
} from "./lib/prompts.mjs";

import {
  healthPayload
} from "./lib/handlers.mjs";

const requiredConcepts = [
  "understand-question",
  "number-meaning",
  "choose-operation",
  "find-total",
  "find-each",
  "find-groups",
  "equation-from-story",
  "answer-labels"
];

const conceptIds = new Set(
  CHARLOTTE_SAMPLE_PACK.concepts.map(
    (concept) => concept.id
  )
);

for (const id of requiredConcepts) {
  if (!conceptIds.has(id)) {
    throw new Error(
      `Missing word-comprehension concept: ${id}`
    );
  }
}

if (
  CHARLOTTE_SAMPLE_PACK.concepts.some(
    (concept) =>
      ["arrays", "rows-columns"].includes(concept.id)
  )
) {
  throw new Error(
    "Graphic-focused concepts are still in the default pack."
  );
}

const questionSchema =
  QUESTION_BATCH_SCHEMA
    .properties
    .questions
    .items;

const allowedTypes =
  questionSchema
    .properties
    .type
    .enum;

for (
  const forbidden of [
    "array_total",
    "array_dimension",
    "groups_total"
  ]
) {
  if (allowedTypes.includes(forbidden)) {
    throw new Error(
      `Graphic question type still allowed: ${forbidden}`
    );
  }
}

const visualKinds =
  questionSchema
    .properties
    .visual
    .properties
    .kind
    .enum;

if (
  visualKinds.length !== 1 ||
  visualKinds[0] !== "none"
) {
  throw new Error(
    "Question schema still allows graphic visuals."
  );
}

const testQuestion =
  validateAndNormalizeQuestion({
    id: "word-test",
    conceptId: "find-each",
    conceptName: "How many in each?",
    type: "number_input",
    prompt:
      "Mia has 30 pencils. She puts them equally into 5 boxes. How many pencils go in each box?",
    directions:
      "Find what the story asks.",
    choices: [],
    answer: {
      kind: "number",
      value: "6",
      acceptedValues: ["6"]
    },
    visual: {
      kind: "array",
      rows: 5,
      columns: 6,
      groups: 5,
      itemsPerGroup: 6,
      itemEmoji: "✏️",
      highlight: "groups",
      caption: "This should be removed"
    },
    strategy: {
      title: "Understand the story",
      steps: [
        {
          title: "Find the total",
          text: "There are 30 pencils in all."
        },
        {
          title: "Find the groups",
          text: "There are 5 boxes."
        },
        {
          title: "Find what is missing",
          text: "We need pencils in each box."
        },
        {
          title: "Divide",
          text: "30 ÷ 5 = 6."
        }
      ],
      deeperExplanation:
        "The total and number of boxes are known. Divide to find how many are in each.",
      transferTip:
        "Ask what is missing before choosing the math."
    },
    answerSentence:
      "6 pencils in each box",
    difficulty: 2,
    fingerprint:
      "word-test:find-each:30:5",
    validation: {
      operation: "divide",
      factorA: 30,
      factorB: 5,
      product: 6,
      unit: "pencils"
    }
  });

if (!testQuestion) {
  throw new Error(
    "Word-problem question failed validation."
  );
}

if (
  testQuestion.visual.kind !== "none" ||
  testQuestion.visual.rows !== 0 ||
  testQuestion.visual.columns !== 0 ||
  testQuestion.visual.groups !== 0 ||
  testQuestion.visual.itemsPerGroup !== 0 ||
  testQuestion.visual.highlight !== "none" ||
  testQuestion.visual.caption !== ""
) {
  throw new Error(
    "Graphic content was not stripped from the normalized question."
  );
}

if (
  !isAnswerCorrect(
    testQuestion,
    "6"
  )
) {
  throw new Error(
    "Word-problem answer validation failed."
  );
}

if (
  !QUESTION_SYSTEM_PROMPT.includes(
    "Every scored question MUST be based on a short written story or situation."
  )
) {
  throw new Error(
    "Gemini prompt does not enforce word-comprehension questions."
  );
}

if (
  !QUESTION_SYSTEM_PROMPT.includes(
    'visual.kind="none"'
  )
) {
  throw new Error(
    "Gemini prompt does not explicitly disable visuals."
  );
}

if (
  !ANALYSIS_SCHEMA
    .properties
    .generationGuidance
) {
  throw new Error(
    "Analysis schema is incomplete."
  );
}

const handlerSource =
  fs.readFileSync(
    "./lib/handlers.mjs",
    "utf8"
  );

if (
  handlerSource.includes(
    "generateFallbackQuestions"
  )
) {
  throw new Error(
    "Fixed-question fallback is present."
  );
}

if (
  !healthPayload().body.ok
) {
  throw new Error(
    "Health handler failed."
  );
}

console.log(
  "Checks passed: Gemini-only Grade 3 word-comprehension practice with no graphic math questions."
);

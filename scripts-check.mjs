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
  "choose-operation",
  "equal-groups",
  "divide-find-each",
  "divide-find-groups",
  "fact-family",
  "arrays"
];

const conceptIds =
  new Set(
    CHARLOTTE_SAMPLE_PACK.concepts.map(
      (concept) => concept.id
    )
  );

for (
  const id of
  requiredConcepts
) {
  if (!conceptIds.has(id)) {
    throw new Error(
      `Missing default concept: ${id}`
    );
  }
}

if (
  !CHARLOTTE_SAMPLE_PACK
    .generationGuidance
    ?.problemStructures
    ?.length
) {
  throw new Error(
    "Default concept blueprint is missing generation guidance."
  );
}

const multiplyQuestion =
  validateAndNormalizeQuestion({
    id: "multiply-check",
    conceptId: "equal-groups",
    conceptName: "Find the total",
    type: "number_input",
    prompt:
      "There are 6 bags with 5 apples in each. How many apples are there?",
    directions:
      "Find the total.",
    choices: [],
    answer: {
      kind: "number",
      value: "30",
      acceptedValues: [
        "30"
      ]
    },
    visual: {
      kind: "none",
      rows: 0,
      columns: 0,
      groups: 0,
      itemsPerGroup: 0,
      itemEmoji: "🍎",
      highlight: "none",
      caption: ""
    },
    strategy: {
      title:
        "Find the total",
      steps: [
        {
          title:
            "Find groups",
          text:
            "There are 6 groups."
        },
        {
          title:
            "Find each",
          text:
            "There are 5 in each."
        },
        {
          title:
            "Multiply",
          text:
            "6 × 5 = 30."
        }
      ],
      deeperExplanation:
        "Multiply groups by how many are in each.",
      transferTip:
        "Need the total? Multiply."
    },
    answerSentence:
      "30 apples",
    difficulty: 2,
    fingerprint:
      "test:multiply:6:5",
    validation: {
      operation:
        "multiply",
      factorA: 6,
      factorB: 5,
      product: 30,
      unit: "apples"
    }
  });

if (!multiplyQuestion) {
  throw new Error(
    "Multiplication validation failed."
  );
}

if (
  !isAnswerCorrect(
    multiplyQuestion,
    "30"
  )
) {
  throw new Error(
    "Multiplication answer check failed."
  );
}

const divideQuestion =
  validateAndNormalizeQuestion({
    id: "divide-check",
    conceptId:
      "divide-find-groups",
    conceptName:
      "How many groups?",
    type: "number_input",
    prompt:
      "There are 30 apples with 5 in each bag. How many bags are there?",
    directions:
      "Find the groups.",
    choices: [],
    answer: {
      kind: "number",
      value: "6",
      acceptedValues: [
        "6"
      ]
    },
    visual: {
      kind: "none",
      rows: 0,
      columns: 0,
      groups: 0,
      itemsPerGroup: 0,
      itemEmoji: "🍎",
      highlight: "none",
      caption: ""
    },
    strategy: {
      title:
        "Find the groups",
      steps: [
        {
          title:
            "Find total",
          text:
            "There are 30 in all."
        },
        {
          title:
            "Find each",
          text:
            "There are 5 in each."
        },
        {
          title:
            "Divide",
          text:
            "30 ÷ 5 = 6."
        }
      ],
      deeperExplanation:
        "Divide the total by how many are in each group.",
      transferTip:
        "Have the total? Divide."
    },
    answerSentence:
      "6 bags",
    difficulty: 2,
    fingerprint:
      "test:divide:30:5",
    validation: {
      operation:
        "divide",
      factorA: 30,
      factorB: 5,
      product: 6,
      unit: "bags"
    }
  });

if (!divideQuestion) {
  throw new Error(
    "Division validation failed."
  );
}

if (
  divideQuestion.validation.product !==
  6
) {
  throw new Error(
    "Division quotient validation failed."
  );
}

if (
  !isAnswerCorrect(
    divideQuestion,
    "6"
  )
) {
  throw new Error(
    "Division answer check failed."
  );
}

const operationEnum =
  QUESTION_BATCH_SCHEMA
    .properties
    .questions
    .items
    .properties
    .validation
    .properties
    .operation
    .enum;

if (
  !operationEnum.includes(
    "divide"
  )
) {
  throw new Error(
    "Question schema does not support division."
  );
}

if (
  !ANALYSIS_SCHEMA
    .properties
    .generationGuidance
) {
  throw new Error(
    "Analysis schema is missing generation guidance."
  );
}

if (
  !QUESTION_SYSTEM_PROMPT.includes(
    "There is no fixed question bank."
  )
) {
  throw new Error(
    "Gemini prompt does not enforce fresh question generation."
  );
}

const appSource =
  fs.readFileSync(
    "./js/app.js",
    "utf8"
  );

const handlerSource =
  fs.readFileSync(
    "./lib/handlers.mjs",
    "utf8"
  );

if (
  appSource.includes(
    "generateFallbackQuestions"
  ) ||
  handlerSource.includes(
    "generateFallbackQuestions"
  )
) {
  throw new Error(
    "A fixed-question fallback still exists."
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
  "Checks passed: concept-derived Gemini practice, multiplication, division, and no fixed-question fallback."
);

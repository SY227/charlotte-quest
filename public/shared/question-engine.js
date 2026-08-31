const CONCEPT_NAMES = {
  "choose-operation": "Multiply or divide?",
  "equal-groups": "Find the total",
  "divide-find-each": "How many in each?",
  "divide-find-groups": "How many groups?",
  "fact-family": "Related facts",
  "arrays": "Rows and arrays",
  "facts-2-5-10": "2s, 5s, and 10s",
  "answer-labels": "What did you count?",
  "rows-columns": "Rows and columns",
  "word-to-equation": "Story to equation",
  "commutative-property": "Switching factors"
};

const SUPPORTED_TYPES = new Set([
  "multiple_choice",
  "number_input",
  "equation_choice",
  "array_total",
  "array_dimension",
  "groups_total",
  "unit_choice",
  "true_false"
]);

const SUPPORTED_VISUALS = new Set([
  "none",
  "array",
  "groups"
]);

export function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[,.!?]/g, "")
    .replace(/\s+/g, " ");
}

export function isAnswerCorrect(question, submittedValue) {
  const submitted = normalizeAnswer(submittedValue);

  if (!submitted) {
    return false;
  }

  const accepted = [
    question?.answer?.value,
    ...(question?.answer?.acceptedValues || [])
  ]
    .map(normalizeAnswer)
    .filter(Boolean);

  return accepted.includes(submitted);
}

export function validateAndNormalizeQuestion(
  question,
  fallbackId = "question"
) {
  if (!question || typeof question !== "object") {
    return null;
  }

  const operation = [
    "multiply",
    "divide",
    "none"
  ].includes(question?.validation?.operation)
    ? question.validation.operation
    : "none";

  const normalized = {
    id: String(question.id || fallbackId),
    conceptId: String(
      question.conceptId || "choose-operation"
    ),
    conceptName: String(
      question.conceptName ||
      CONCEPT_NAMES[question.conceptId] ||
      "Math practice"
    ),
    type: SUPPORTED_TYPES.has(question.type)
      ? question.type
      : "multiple_choice",
    prompt: String(
      question.prompt || "Solve the problem."
    ),
    directions: String(
      question.directions || "Do one step at a time."
    ),
    choices: Array.isArray(question.choices)
      ? question.choices
          .slice(0, 5)
          .map((choice, index) => ({
            id: String(
              choice?.id || `choice-${index + 1}`
            ),
            label: String(choice?.label ?? "")
          }))
          .filter((choice) => choice.label)
      : [],
    answer: {
      kind: [
        "choice",
        "number",
        "text"
      ].includes(question?.answer?.kind)
        ? question.answer.kind
        : "choice",
      value: String(
        question?.answer?.value ?? ""
      ),
      acceptedValues: Array.isArray(
        question?.answer?.acceptedValues
      )
        ? question.answer.acceptedValues
            .map(String)
            .slice(0, 8)
        : []
    },
    visual: {
      kind: SUPPORTED_VISUALS.has(
        question?.visual?.kind
      )
        ? question.visual.kind
        : "none",
      rows: clampInteger(
        question?.visual?.rows,
        0,
        12
      ),
      columns: clampInteger(
        question?.visual?.columns,
        0,
        12
      ),
      groups: clampInteger(
        question?.visual?.groups,
        0,
        10
      ),
      itemsPerGroup: clampInteger(
        question?.visual?.itemsPerGroup,
        0,
        10
      ),
      itemEmoji: String(
        question?.visual?.itemEmoji || "⭐"
      ).slice(0, 8),
      highlight: [
        "none",
        "rows",
        "columns",
        "groups"
      ].includes(question?.visual?.highlight)
        ? question.visual.highlight
        : "none",
      caption: String(
        question?.visual?.caption || ""
      )
    },
    strategy: {
      title: String(
        question?.strategy?.title ||
        "Work it out"
      ),
      steps: Array.isArray(
        question?.strategy?.steps
      )
        ? question.strategy.steps
            .slice(0, 5)
            .map((step, index) => ({
              title: String(
                step?.title ||
                `Step ${index + 1}`
              ),
              text: String(step?.text || "")
            }))
            .filter((step) => step.text)
        : [],
      deeperExplanation: String(
        question?.strategy?.deeperExplanation ||
        "Find what is missing. Then choose the operation."
      ),
      transferTip: String(
        question?.strategy?.transferTip ||
        "Use the same steps next time."
      )
    },
    answerSentence: String(
      question.answerSentence ||
      question?.answer?.value ||
      ""
    ),
    difficulty:
      clampInteger(
        question.difficulty,
        1,
        3
      ) || 2,
    fingerprint: String(
      question.fingerprint ||
      `${question.conceptId || "concept"}:${question.prompt || fallbackId}`
    ),
    validation: {
      operation,
      factorA: clampInteger(
        question?.validation?.factorA,
        0,
        400
      ),
      factorB: clampInteger(
        question?.validation?.factorB,
        0,
        20
      ),
      product: clampInteger(
        question?.validation?.product,
        0,
        400
      ),
      unit: String(
        question?.validation?.unit || ""
      )
    }
  };

  if (
    normalized.validation.operation ===
    "multiply"
  ) {
    normalized.validation.product =
      normalized.validation.factorA *
      normalized.validation.factorB;

    if (
      normalized.answer.kind === "number"
    ) {
      normalized.answer.value = String(
        normalized.validation.product
      );

      normalized.answer.acceptedValues = [
        ...new Set([
          ...normalized.answer.acceptedValues,
          normalized.answer.value
        ])
      ];
    }
  }

  if (
    normalized.validation.operation ===
    "divide"
  ) {
    if (
      normalized.validation.factorB <= 0
    ) {
      return null;
    }

    const quotient =
      normalized.validation.factorA /
      normalized.validation.factorB;

    if (!Number.isInteger(quotient)) {
      return null;
    }

    normalized.validation.product =
      quotient;

    if (
      normalized.answer.kind === "number"
    ) {
      normalized.answer.value =
        String(quotient);

      normalized.answer.acceptedValues = [
        ...new Set([
          ...normalized.answer.acceptedValues,
          normalized.answer.value
        ])
      ];
    }
  }

  if (
    normalized.answer.kind === "choice"
  ) {
    if (
      !normalized.choices.some(
        (choice) =>
          choice.id ===
          normalized.answer.value
      )
    ) {
      return null;
    }
  } else if (!normalized.answer.value) {
    return null;
  }

  if (
    !normalized.prompt ||
    normalized.strategy.steps.length < 2
  ) {
    return null;
  }

  return normalized;
}

function clampInteger(
  value,
  min,
  max
) {
  const number =
    Number.parseInt(value, 10);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(
    min,
    Math.min(max, number)
  );
}

export const SUPPORTED_CONCEPT_IDS =
  Object.keys(CONCEPT_NAMES);

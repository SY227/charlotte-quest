const OBJECTS = [
  { singular: "moon berry", plural: "moon berries", emoji: "🫐", container: "basket", containers: "baskets" },
  { singular: "star crystal", plural: "star crystals", emoji: "💎", container: "pouch", containers: "pouches" },
  { singular: "story book", plural: "story books", emoji: "📘", container: "shelf", containers: "shelves" },
  { singular: "sunflower", plural: "sunflowers", emoji: "🌻", container: "garden row", containers: "garden rows" },
  { singular: "apple", plural: "apples", emoji: "🍎", container: "basket", containers: "baskets" },
  { singular: "pencil", plural: "pencils", emoji: "✏️", container: "box", containers: "boxes" },
  { singular: "cupcake", plural: "cupcakes", emoji: "🧁", container: "tray", containers: "trays" },
  { singular: "shell", plural: "shells", emoji: "🐚", container: "bucket", containers: "buckets" },
  { singular: "leaf badge", plural: "leaf badges", emoji: "🍃", container: "team", containers: "teams" },
  { singular: "spark token", plural: "spark tokens", emoji: "⭐", container: "pack", containers: "packs" }
];

const CONCEPT_NAMES = {
  "equal-groups": "Equal groups",
  arrays: "Arrays",
  "rows-columns": "Rows and columns",
  "word-to-equation": "Story to equation",
  "commutative-property": "Switching factors",
  "answer-labels": "Answer labels"
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

function shuffle(random, items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function numberBetween(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function factorRange(difficulty) {
  if (difficulty <= 1) return [2, 5];
  if (difficulty >= 3) return [4, 10];
  return [2, 9];
}

function makeChoices(random, correctLabel, distractorLabels) {
  const unique = [...new Set(distractorLabels.filter((label) => label !== correctLabel))].slice(0, 3);
  const labels = shuffle(random, [correctLabel, ...unique]).slice(0, 4);
  return labels.map((label, index) => ({ id: `choice-${index + 1}`, label }));
}

function choiceAnswer(choices, correctLabel) {
  const match = choices.find((choice) => choice.label === correctLabel);
  return {
    kind: "choice",
    value: match?.id || choices[0]?.id || "choice-1",
    acceptedValues: []
  };
}

function emptyVisual() {
  return {
    kind: "none",
    rows: 0,
    columns: 0,
    groups: 0,
    itemsPerGroup: 0,
    itemEmoji: "⭐",
    highlight: "none",
    caption: ""
  };
}

function baseQuestion({ id, conceptId, prompt, directions, type, choices, answer, visual, strategy, answerSentence, difficulty, fingerprint, validation }) {
  return {
    id,
    conceptId,
    conceptName: CONCEPT_NAMES[conceptId] || "Multiplication",
    type,
    prompt,
    directions,
    choices: choices || [],
    answer,
    visual: visual || emptyVisual(),
    strategy,
    answerSentence,
    difficulty,
    fingerprint,
    validation: validation || {
      operation: "none",
      factorA: 0,
      factorB: 0,
      product: 0,
      unit: ""
    }
  };
}

function equalGroupsQuestion(random, index, difficulty) {
  const [min, max] = factorRange(difficulty);
  const groups = numberBetween(random, min, Math.min(max, difficulty === 1 ? 5 : 8));
  const perGroup = numberBetween(random, min, max);
  const item = pick(random, OBJECTS);
  const total = groups * perGroup;
  const useVisual = random() > 0.4;
  const fingerprint = `equal-groups:${groups}:${perGroup}:${item.plural}:${useVisual}`;

  return baseQuestion({
    id: `fallback-${index}-${hashString(fingerprint)}`,
    conceptId: "equal-groups",
    type: "number_input",
    prompt: `There are ${groups} ${item.containers}. Each ${item.container} has ${perGroup} ${item.plural}. How many ${item.plural} are there in all?`,
    directions: "Find the groups. Count how many are in each.",
    answer: { kind: "number", value: String(total), acceptedValues: [String(total)] },
    visual: useVisual
      ? {
          kind: "groups",
          rows: 0,
          columns: 0,
          groups,
          itemsPerGroup: perGroup,
          itemEmoji: item.emoji,
          highlight: "groups",
          caption: `${groups} equal groups with ${perGroup} in each group`
        }
      : emptyVisual(),
    strategy: {
      title: "Use groups × in each group",
      steps: [
        { title: "Find the groups", text: `There are ${groups} ${item.containers}, so there are ${groups} groups.` },
        { title: "Find how many in each", text: `Each ${item.container} has ${perGroup} ${item.plural}.` },
        { title: "Multiply", text: `${groups} × ${perGroup} = ${total}.` },
        { title: "Label the answer", text: `The question asks for ${item.plural}, so the answer is ${total} ${item.plural}.` }
      ],
      deeperExplanation: `Each group has ${perGroup}. There are ${groups} groups, so multiply ${groups} × ${perGroup}.`,
      transferTip: "Ask: How many groups? How many in each?"
    },
    answerSentence: `${total} ${item.plural}`,
    difficulty,
    fingerprint,
    validation: { operation: "multiply", factorA: groups, factorB: perGroup, product: total, unit: item.plural }
  });
}

function arrayTotalQuestion(random, index, difficulty) {
  const [min, max] = factorRange(difficulty);
  const rows = numberBetween(random, min, Math.min(max, 8));
  const columns = numberBetween(random, min, max);
  const total = rows * columns;
  const item = pick(random, OBJECTS);
  const fingerprint = `array-total:${rows}:${columns}:${item.emoji}`;

  return baseQuestion({
    id: `fallback-${index}-${hashString(fingerprint)}`,
    conceptId: "arrays",
    type: "number_input",
    prompt: `How many ${item.plural} are in this array?`,
    directions: "Count the rows. Count one row. Then multiply.",
    answer: { kind: "number", value: String(total), acceptedValues: [String(total)] },
    visual: {
      kind: "array",
      rows,
      columns,
      groups: 0,
      itemsPerGroup: 0,
      itemEmoji: item.emoji,
      highlight: "none",
      caption: `${rows} rows with ${columns} in each row`
    },
    strategy: {
      title: "Read the array",
      steps: [
        { title: "Count the rows", text: `There are ${rows} rows going across.` },
        { title: "Count one row", text: `There are ${columns} ${item.plural} in each row.` },
        { title: "Multiply", text: `${rows} rows × ${columns} in each row = ${total}.` }
      ],
      deeperExplanation: `Each row has ${columns}. There are ${rows} rows, so ${rows} × ${columns} = ${total}.`,
      transferTip: "Say: rows first, then how many in each row."
    },
    answerSentence: `${total} ${item.plural}`,
    difficulty,
    fingerprint,
    validation: { operation: "multiply", factorA: rows, factorB: columns, product: total, unit: item.plural }
  });
}

function rowsColumnsQuestion(random, index, difficulty) {
  const [min, max] = factorRange(difficulty);
  let rows = numberBetween(random, min, Math.min(max, 8));
  let columns = numberBetween(random, min, max);
  if (rows === columns) columns = columns === max ? columns - 1 : columns + 1;
  const askRows = random() > 0.5;
  const correct = askRows ? rows : columns;
  const other = askRows ? columns : rows;
  const item = pick(random, OBJECTS);
  const labels = [String(correct), String(other), String(Math.max(1, correct - 1)), String(correct + 1)];
  const choices = makeChoices(random, String(correct), labels);
  const fingerprint = `rows-columns:${rows}:${columns}:${askRows ? "rows" : "columns"}`;

  return baseQuestion({
    id: `fallback-${index}-${hashString(fingerprint)}`,
    conceptId: "rows-columns",
    type: "multiple_choice",
    prompt: `How many ${askRows ? "rows" : "columns"} are in this array?`,
    directions: askRows ? "A row goes across." : "A column goes up and down.",
    choices,
    answer: choiceAnswer(choices, String(correct)),
    visual: {
      kind: "array",
      rows,
      columns,
      groups: 0,
      itemsPerGroup: 0,
      itemEmoji: item.emoji,
      highlight: askRows ? "rows" : "columns",
      caption: askRows ? "Trace across to see each row" : "Trace up and down to see each column"
    },
    strategy: {
      title: askRows ? "Rows go across" : "Columns go up and down",
      steps: [
        {
          title: "Find the direction",
          text: askRows ? "Move left to right. That is one row." : "Move top to bottom. That is one column."
        },
        {
          title: `Count the ${askRows ? "rows" : "columns"}`,
          text: `There are ${correct} ${askRows ? "rows" : "columns"}.`
        },
        {
          title: "Check the other way",
          text: `The ${other} counts ${askRows ? "columns" : "rows"}.`
        }
      ],
      deeperExplanation: `Rows and columns go different ways. Count the way the question asks.`,
      transferTip: "Rows go across. Columns go up and down."
    },
    answerSentence: `${correct} ${askRows ? "rows" : "columns"}`,
    difficulty,
    fingerprint,
    validation: { operation: "none", factorA: rows, factorB: columns, product: rows * columns, unit: askRows ? "rows" : "columns" }
  });
}

function wordToEquationQuestion(random, index, difficulty) {
  const [min, max] = factorRange(difficulty);
  const groups = numberBetween(random, min, Math.min(max, 8));
  const perGroup = numberBetween(random, min, max);
  const item = pick(random, OBJECTS);
  const total = groups * perGroup;
  const correctLabel = `${groups} × ${perGroup} = ${total}`;
  const distractors = [
    `${groups} + ${perGroup} = ${groups + perGroup}`,
    `${perGroup} − ${groups} = ${Math.abs(perGroup - groups)}`,
    `${total} × ${groups} = ${total * groups}`,
    `${groups} × ${groups} = ${groups * groups}`
  ];
  const choices = makeChoices(random, correctLabel, distractors);
  const fingerprint = `word-equation:${groups}:${perGroup}:${item.plural}`;

  return baseQuestion({
    id: `fallback-${index}-${hashString(fingerprint)}`,
    conceptId: "word-to-equation",
    type: "multiple_choice",
    prompt: `A quest team has ${groups} packs. Each pack holds ${perGroup} ${item.plural}. Which equation finds the total number of ${item.plural}?`,
    directions: "Find the groups. Find how many are in each.",
    choices,
    answer: choiceAnswer(choices, correctLabel),
    visual: emptyVisual(),
    strategy: {
      title: "Turn the story into an equation",
      steps: [
        { title: "Find the groups", text: `${groups} packs means ${groups} groups.` },
        { title: "Find how many in each", text: `There are ${perGroup} ${item.plural} in every pack.` },
        { title: "Multiply", text: `${groups} groups × ${perGroup} in each group = ${total}.` }
      ],
      deeperExplanation: `“Each” means every group has the same number. Multiply groups × how many in each.`,
      transferTip: "First ask what each number means. Then multiply."
    },
    answerSentence: `${groups} × ${perGroup} = ${total}`,
    difficulty,
    fingerprint,
    validation: { operation: "multiply", factorA: groups, factorB: perGroup, product: total, unit: item.plural }
  });
}

function commutativeQuestion(random, index, difficulty) {
  const [min, max] = factorRange(difficulty);
  let a = numberBetween(random, min, max);
  let b = numberBetween(random, min, max);
  if (a === b) b = b === max ? b - 1 : b + 1;
  const product = a * b;
  const correctLabel = `${b} × ${a} = ${product}`;
  const choices = makeChoices(random, correctLabel, [
    `${a} + ${b} = ${a + b}`,
    `${a} × ${a} = ${a * a}`,
    `${b} × ${b} = ${b * b}`,
    `${b} × ${a} = ${product + 1}`
  ]);
  const fingerprint = `commutative:${a}:${b}`;

  return baseQuestion({
    id: `fallback-${index}-${hashString(fingerprint)}`,
    conceptId: "commutative-property",
    type: "multiple_choice",
    prompt: `Which equation shows the same total as ${a} × ${b} = ${product}?`,
    directions: "Switch the two numbers. Keep the same answer.",
    choices,
    answer: choiceAnswer(choices, correctLabel),
    visual: {
      kind: "array",
      rows: a,
      columns: b,
      groups: 0,
      itemsPerGroup: 0,
      itemEmoji: "⭐",
      highlight: "none",
      caption: `${a} rows of ${b} can also be seen as ${b} columns of ${a}`
    },
    strategy: {
      title: "Switch the factors",
      steps: [
        { title: "Find the factors", text: `The factors are ${a} and ${b}.` },
        { title: "Switch their order", text: `${a} × ${b} becomes ${b} × ${a}.` },
        { title: "Keep the product", text: `Both equations equal ${product}.` }
      ],
      deeperExplanation: `The order can switch. ${a} × ${b} and ${b} × ${a} have the same answer.`,
      transferTip: "You can switch the numbers, but rows and columns still have directions."
    },
    answerSentence: `${b} × ${a} = ${product}`,
    difficulty,
    fingerprint,
    validation: { operation: "multiply", factorA: a, factorB: b, product, unit: "objects" }
  });
}

function answerLabelsQuestion(random, index, difficulty) {
  const [min, max] = factorRange(difficulty);
  const groups = numberBetween(random, min, Math.min(max, 8));
  const perGroup = numberBetween(random, min, max);
  const item = pick(random, OBJECTS);
  const total = groups * perGroup;
  const askFullSentence = random() > 0.45;
  const correctLabel = askFullSentence ? `${total} ${item.plural}` : item.plural;
  const distractors = askFullSentence
    ? [
        `${total} ${item.containers}`,
        `${groups} ${item.plural}`,
        `${perGroup} ${item.plural}`,
        `${total} groups`
      ]
    : [item.containers, "groups", "rows", "boxes"];
  const choices = makeChoices(random, correctLabel, distractors);
  const fingerprint = `answer-label:${groups}:${perGroup}:${item.plural}:${askFullSentence}`;

  return baseQuestion({
    id: `fallback-${index}-${hashString(fingerprint)}`,
    conceptId: "answer-labels",
    type: "multiple_choice",
    prompt: askFullSentence
      ? `There are ${groups} ${item.containers} with ${perGroup} ${item.plural} in each. Which is the best complete answer?`
      : `There are ${groups} ${item.containers} with ${perGroup} ${item.plural} in each. The question asks, “How many ${item.plural} are there in all?” What should the answer be labeled?`,
    directions: "Read what the question asks you to count.",
    choices,
    answer: choiceAnswer(choices, correctLabel),
    visual: emptyVisual(),
    strategy: {
      title: "Name what you counted",
      steps: [
        { title: "Find the total", text: `${groups} × ${perGroup} = ${total}.` },
        { title: "Read the last line", text: `It asks how many ${item.plural}, not how many ${item.containers}.` },
        { title: "Finish the answer", text: `Write ${total} ${item.plural}.` }
      ],
      deeperExplanation: `The groups are not always the answer label. Read what the question asks you to count.`,
      transferTip: "Find the words after “How many.” Use those words in your answer."
    },
    answerSentence: `${total} ${item.plural}`,
    difficulty,
    fingerprint,
    validation: { operation: "multiply", factorA: groups, factorB: perGroup, product: total, unit: item.plural }
  });
}

const GENERATORS = {
  "equal-groups": equalGroupsQuestion,
  arrays: arrayTotalQuestion,
  "rows-columns": rowsColumnsQuestion,
  "word-to-equation": wordToEquationQuestion,
  "commutative-property": commutativeQuestion,
  "answer-labels": answerLabelsQuestion
};

function weightedConcept(random, pack, allowedConcepts) {
  const allowed = allowedConcepts.length ? allowedConcepts : Object.keys(GENERATORS);
  const mix = Array.isArray(pack?.recommendedQuestionMix) ? pack.recommendedQuestionMix : [];
  const weighted = allowed.map((conceptId) => ({
    conceptId,
    weight: Math.max(1, mix.find((item) => item.conceptId === conceptId)?.weight || 10)
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.conceptId;
  }
  return weighted[weighted.length - 1]?.conceptId || "equal-groups";
}

export function generateFallbackQuestions({
  pack,
  conceptIds = [],
  count = 10,
  seed = `${Date.now()}`,
  startingIndex = 0,
  difficulty = 2,
  avoidFingerprints = []
} = {}) {
  const safeCount = Math.max(1, Math.min(Number(count) || 10, 50));
  const allowed = conceptIds.filter((id) => GENERATORS[id]);
  const random = mulberry32(hashString(`${seed}:${startingIndex}:${safeCount}`));
  const used = new Set(avoidFingerprints);
  const questions = [];
  let attempts = 0;

  while (questions.length < safeCount && attempts < safeCount * 30) {
    attempts += 1;
    const conceptId = weightedConcept(random, pack, allowed);
    const generator = GENERATORS[conceptId] || equalGroupsQuestion;
    const localDifficulty = Math.max(1, Math.min(3, difficulty + (random() > 0.82 ? 1 : 0) - (random() > 0.88 ? 1 : 0)));
    const question = generator(random, startingIndex + questions.length + attempts, localDifficulty);
    if (used.has(question.fingerprint)) continue;
    used.add(question.fingerprint);
    questions.push(question);
  }

  return questions;
}

export function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[,.!?]/g, "")
    .replace(/\s+/g, " ");
}

export function isAnswerCorrect(question, submittedValue) {
  const submitted = normalizeAnswer(submittedValue);
  if (!submitted) return false;
  const accepted = [question?.answer?.value, ...(question?.answer?.acceptedValues || [])]
    .map(normalizeAnswer)
    .filter(Boolean);
  return accepted.includes(submitted);
}

export function validateAndNormalizeQuestion(question, fallbackId = "question") {
  if (!question || typeof question !== "object") return null;
  const supportedTypes = new Set(["multiple_choice", "number_input", "equation_choice", "array_total", "array_dimension", "groups_total", "unit_choice", "true_false"]);
  const supportedVisuals = new Set(["none", "array", "groups"]);
  const normalized = {
    id: String(question.id || fallbackId),
    conceptId: String(question.conceptId || "equal-groups"),
    conceptName: String(question.conceptName || CONCEPT_NAMES[question.conceptId] || "Multiplication"),
    type: supportedTypes.has(question.type) ? question.type : "multiple_choice",
    prompt: String(question.prompt || "Solve the problem."),
    directions: String(question.directions || "Do one step at a time."),
    choices: Array.isArray(question.choices)
      ? question.choices.slice(0, 5).map((choice, index) => ({
          id: String(choice?.id || `choice-${index + 1}`),
          label: String(choice?.label ?? "")
        })).filter((choice) => choice.label)
      : [],
    answer: {
      kind: ["choice", "number", "text"].includes(question?.answer?.kind) ? question.answer.kind : "choice",
      value: String(question?.answer?.value ?? ""),
      acceptedValues: Array.isArray(question?.answer?.acceptedValues)
        ? question.answer.acceptedValues.map((value) => String(value)).slice(0, 8)
        : []
    },
    visual: {
      kind: supportedVisuals.has(question?.visual?.kind) ? question.visual.kind : "none",
      rows: clampInteger(question?.visual?.rows, 0, 12),
      columns: clampInteger(question?.visual?.columns, 0, 12),
      groups: clampInteger(question?.visual?.groups, 0, 10),
      itemsPerGroup: clampInteger(question?.visual?.itemsPerGroup, 0, 10),
      itemEmoji: String(question?.visual?.itemEmoji || "⭐").slice(0, 8),
      highlight: ["none", "rows", "columns", "groups"].includes(question?.visual?.highlight) ? question.visual.highlight : "none",
      caption: String(question?.visual?.caption || "")
    },
    strategy: {
      title: String(question?.strategy?.title || "Work it out step by step"),
      steps: Array.isArray(question?.strategy?.steps)
        ? question.strategy.steps.slice(0, 5).map((step, index) => ({
            title: String(step?.title || `Step ${index + 1}`),
            text: String(step?.text || "")
          })).filter((step) => step.text)
        : [],
      deeperExplanation: String(question?.strategy?.deeperExplanation || "Find the equal groups. Then write the multiplication."),
      transferTip: String(question?.strategy?.transferTip || "Use the same steps next time.")
    },
    answerSentence: String(question.answerSentence || question?.answer?.value || ""),
    difficulty: clampInteger(question.difficulty, 1, 3) || 2,
    fingerprint: String(question.fingerprint || `${question.conceptId || "concept"}:${hashString(JSON.stringify(question))}`),
    validation: {
      operation: question?.validation?.operation === "multiply" ? "multiply" : "none",
      factorA: clampInteger(question?.validation?.factorA, 0, 20),
      factorB: clampInteger(question?.validation?.factorB, 0, 20),
      product: clampInteger(question?.validation?.product, 0, 400),
      unit: String(question?.validation?.unit || "")
    }
  };

  if (normalized.validation.operation === "multiply") {
    normalized.validation.product = normalized.validation.factorA * normalized.validation.factorB;
    if (normalized.answer.kind === "number") {
      normalized.answer.value = String(normalized.validation.product);
      normalized.answer.acceptedValues = [...new Set([...normalized.answer.acceptedValues, normalized.answer.value])];
    }
  }

  if (normalized.answer.kind === "choice") {
    if (!normalized.choices.some((choice) => choice.id === normalized.answer.value)) return null;
  } else if (!normalized.answer.value) {
    return null;
  }

  if (!normalized.prompt || normalized.strategy.steps.length < 2) return null;
  return normalized;
}

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

export const SUPPORTED_CONCEPT_IDS = Object.keys(GENERATORS);

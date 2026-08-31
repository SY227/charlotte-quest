export const CHARLOTTE_SAMPLE_PACK = {
  id: "charlotte-grade3-multiply-divide-blueprint-2026-08-30",
  createdAt: "2026-08-30T00:00:00.000Z",
  source: "built-in",
  subject: "Math",
  title: "Multiply & Divide Adventure",
  shortTitle: "Multiply & Divide",
  gradeFit: "Grade 3",
  summaryForParent:
    "Charlotte's newer homework connects multiplication and division. The main skill is finding what is missing: the total, the number of groups, or how many are in each group.",
  childIntro:
    "Find what is missing. Then multiply or divide.",
  strengths: [
    {
      title: "Builds equations",
      detail: "She turns many stories into the right math."
    },
    {
      title: "Uses equal groups",
      detail: "She understands many groups and rows."
    },
    {
      title: "Knows many facts",
      detail: "She works well with many 2s and 5s facts."
    }
  ],
  practiceNeeds: [
    {
      conceptId: "choose-operation",
      title: "Multiply or divide?",
      observation: "Similar stories can need different operations.",
      practicalApproach: "Find what is missing before choosing the operation."
    },
    {
      conceptId: "divide-find-each",
      title: "Find how many in each",
      observation: "The total and number of groups are known.",
      practicalApproach: "Total ÷ groups = how many in each."
    },
    {
      conceptId: "divide-find-groups",
      title: "Find how many groups",
      observation: "The total and group size are known.",
      practicalApproach: "Total ÷ how many in each = groups."
    },
    {
      conceptId: "fact-family",
      title: "Use related facts",
      observation: "Multiplication and division describe the same groups.",
      practicalApproach: "Use multiplication to check a division answer."
    }
  ],
  reusableStrategy: [
    "Find what is missing.",
    "Need the total? Multiply.",
    "Have the total? Divide.",
    "Check with the other operation."
  ],
  concepts: [
    {
      id: "choose-operation",
      name: "Choose the operation",
      childFriendlyName: "Multiply or divide?",
      description: "Find what is missing first.",
      icon: "🧭",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "equal-groups",
      name: "Multiplication equal groups",
      childFriendlyName: "Find the total",
      description: "Groups × in each = total.",
      icon: "✨",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "divide-find-each",
      name: "Division find each",
      childFriendlyName: "How many in each?",
      description: "Total ÷ groups = in each.",
      icon: "🍎",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "divide-find-groups",
      name: "Division find groups",
      childFriendlyName: "How many groups?",
      description: "Total ÷ in each = groups.",
      icon: "🧺",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "fact-family",
      name: "Multiplication division facts",
      childFriendlyName: "Facts that work together",
      description: "Multiply and divide using the same numbers.",
      icon: "🔁",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "arrays",
      name: "Arrays and unknowns",
      childFriendlyName: "Rows and arrays",
      description: "Use rows to multiply or divide.",
      icon: "🔲",
      confidence: 0.98,
      selectedByDefault: true
    },
    {
      id: "facts-2-5-10",
      name: "Fluency with 2s 5s and 10s",
      childFriendlyName: "2s, 5s, and 10s",
      description: "Build fast and accurate number facts.",
      icon: "⚡",
      confidence: 0.97,
      selectedByDefault: true
    },
    {
      id: "answer-labels",
      name: "Answer labels",
      childFriendlyName: "What did you count?",
      description: "Answer with the thing the question asks for.",
      icon: "🏷️",
      confidence: 0.96,
      selectedByDefault: true
    }
  ],
  vocabulary: [
    {
      term: "total",
      meaning: "How many there are in all."
    },
    {
      term: "equal groups",
      meaning: "Groups with the same number in each."
    },
    {
      term: "multiply",
      meaning: "Find the total from equal groups."
    },
    {
      term: "divide",
      meaning: "Find a missing part of equal groups."
    },
    {
      term: "pair",
      meaning: "A group of 2."
    },
    {
      term: "row",
      meaning: "A line that goes across."
    }
  ],
  uncertainNotes: [],
  recommendedQuestionMix: [
    {
      conceptId: "choose-operation",
      weight: 22
    },
    {
      conceptId: "divide-find-each",
      weight: 18
    },
    {
      conceptId: "divide-find-groups",
      weight: 18
    },
    {
      conceptId: "equal-groups",
      weight: 15
    },
    {
      conceptId: "fact-family",
      weight: 12
    },
    {
      conceptId: "arrays",
      weight: 7
    },
    {
      conceptId: "facts-2-5-10",
      weight: 5
    },
    {
      conceptId: "answer-labels",
      weight: 3
    }
  ],
  generationGuidance: {
    problemStructures: [
      "Groups and how many in each are known. Find the total with multiplication.",
      "The total and number of groups are known. Find how many are in each group with division.",
      "The total and how many are in each group are known. Find the number of groups with division.",
      "Decide whether multiplication or division fits before calculating.",
      "Connect one multiplication fact to related division facts.",
      "Use arrays where the total, rows, or number in each row may be unknown.",
      "Sometimes use multiplication first and then compare two amounts."
    ],
    factEmphasis: [
      "Use 2s and 5s often.",
      "Use 10s regularly.",
      "Mix in other Grade 3 multiplication facts.",
      "Use only whole-number division with no remainders."
    ],
    contextIdeas: [
      "chairs and tables",
      "school supplies",
      "books and shelves",
      "fruit and baskets",
      "friends sharing objects",
      "rows of plants",
      "pairs of objects",
      "coins and cents",
      "tickets",
      "photos",
      "friendly quest objects",
      "stars and crystals"
    ],
    avoidPatterns: [
      "Never copy wording from the source homework.",
      "Never reuse the source homework numbers as a set.",
      "Do not make every question look the same.",
      "Do not teach keyword tricks.",
      "Do not ask only calculation questions.",
      "Do not introduce remainders yet."
    ]
  }
};

export function cloneSamplePack() {
  return JSON.parse(JSON.stringify(CHARLOTTE_SAMPLE_PACK));
}

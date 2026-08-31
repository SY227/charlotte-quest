export const CHARLOTTE_SAMPLE_PACK = {
  id: "charlotte-grade3-word-comprehension-2026-08-30",
  createdAt: "2026-08-30T00:00:00.000Z",
  source: "built-in",
  subject: "Math",
  title: "Math Story Adventure",
  shortTitle: "Math Stories",
  gradeFit: "Grade 3",
  summaryForParent:
    "Charlotte's homework now mixes multiplication and division inside word problems. Practice should focus on understanding what each number means, what the question asks, and which operation fits.",
  childIntro:
    "Read the story. Find what it asks. Then do the math.",
  strengths: [
    {
      title: "Finds many answers",
      detail: "She solves many multiplication and division facts correctly."
    },
    {
      title: "Writes equations",
      detail: "She often turns a story into an equation."
    },
    {
      title: "Uses answer labels",
      detail: "She often writes what the answer counts."
    }
  ],
  practiceNeeds: [
    {
      conceptId: "understand-question",
      title: "What is it asking?",
      observation: "The important first step is knowing what must be found.",
      practicalApproach: "Read the last question. Say what you need to find."
    },
    {
      conceptId: "number-meaning",
      title: "What do numbers mean?",
      observation: "Each number has a job in the story.",
      practicalApproach: "Say what each number stands for before doing math."
    },
    {
      conceptId: "choose-operation",
      title: "Multiply or divide?",
      observation: "Similar stories can need different operations.",
      practicalApproach: "Find what is missing. Then choose multiply or divide."
    },
    {
      conceptId: "find-each",
      title: "Find how many in each",
      observation: "Sometimes the total and number of groups are given.",
      practicalApproach: "Total ÷ groups = how many in each."
    },
    {
      conceptId: "find-groups",
      title: "Find how many groups",
      observation: "Sometimes the total and group size are given.",
      practicalApproach: "Total ÷ how many in each = number of groups."
    }
  ],
  reusableStrategy: [
    "Read the whole story.",
    "Find what it asks.",
    "Say what each number means.",
    "Choose the math and solve."
  ],
  concepts: [
    {
      id: "understand-question",
      name: "Understand the question",
      childFriendlyName: "What do I find?",
      description: "Know what the story asks for.",
      icon: "🔎",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "number-meaning",
      name: "Understand the numbers",
      childFriendlyName: "What do numbers mean?",
      description: "Know what each number means in the story.",
      icon: "🔢",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "choose-operation",
      name: "Choose the operation",
      childFriendlyName: "Multiply or divide?",
      description: "Choose the math after understanding the story.",
      icon: "🧭",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "find-total",
      name: "Find the total",
      childFriendlyName: "Find how many in all",
      description: "Groups × how many in each = total.",
      icon: "⭐",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "find-each",
      name: "Find how many in each",
      childFriendlyName: "How many in each?",
      description: "Total ÷ groups = how many in each.",
      icon: "🍎",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "find-groups",
      name: "Find number of groups",
      childFriendlyName: "How many groups?",
      description: "Total ÷ how many in each = groups.",
      icon: "📦",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "equation-from-story",
      name: "Story to equation",
      childFriendlyName: "Pick the equation",
      description: "Choose the equation that matches the story.",
      icon: "✏️",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "answer-labels",
      name: "Answer labels",
      childFriendlyName: "What did I count?",
      description: "Answer with the thing the question asks for.",
      icon: "🏷️",
      confidence: 0.98,
      selectedByDefault: true
    }
  ],
  vocabulary: [
    {
      term: "total",
      meaning: "How many there are in all."
    },
    {
      term: "each",
      meaning: "How many are in one group."
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
    }
  ],
  uncertainNotes: [],
  recommendedQuestionMix: [
    {
      conceptId: "understand-question",
      weight: 18
    },
    {
      conceptId: "number-meaning",
      weight: 14
    },
    {
      conceptId: "choose-operation",
      weight: 18
    },
    {
      conceptId: "find-total",
      weight: 12
    },
    {
      conceptId: "find-each",
      weight: 12
    },
    {
      conceptId: "find-groups",
      weight: 12
    },
    {
      conceptId: "equation-from-story",
      weight: 10
    },
    {
      conceptId: "answer-labels",
      weight: 4
    }
  ],
  generationGuidance: {
    problemStructures: [
      "Read a short story and identify what the question asks for.",
      "Identify what a number represents in the story.",
      "Decide whether multiplication or division fits the situation.",
      "Groups and how many in each are known. Find the total.",
      "The total and number of groups are known. Find how many are in each.",
      "The total and how many are in each are known. Find the number of groups.",
      "Choose the equation that correctly represents the story.",
      "Solve a word problem and use the correct answer label.",
      "Compare two simple amounts after finding one amount first."
    ],
    factEmphasis: [
      "Use 2s and 5s often.",
      "Use 10s regularly.",
      "Mix other Grade 3 multiplication facts.",
      "Use only division with whole-number answers.",
      "Math facts support comprehension rather than being the main task."
    ],
    contextIdeas: [
      "friends sharing objects",
      "school supplies",
      "books and shelves",
      "chairs and tables",
      "fruit and baskets",
      "flowers and vases",
      "photos in rows",
      "pairs of objects",
      "coins and cents",
      "tickets",
      "pages in letters",
      "items on shelves",
      "friendly adventure objects"
    ],
    avoidPatterns: [
      "Never copy wording from the source homework.",
      "Never reuse the source homework as fixed questions.",
      "Never create picture-counting questions.",
      "Never create array graphics.",
      "Never create groups-of-dots graphics.",
      "Never create visual math diagrams.",
      "Never create bare arithmetic fact questions.",
      "Never teach keyword tricks.",
      "Never introduce division with remainders.",
      "Do not make every question ask for the final answer."
    ]
  }
};

export function cloneSamplePack() {
  return JSON.parse(JSON.stringify(CHARLOTTE_SAMPLE_PACK));
}

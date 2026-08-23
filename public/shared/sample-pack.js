export const CHARLOTTE_SAMPLE_PACK = {
  id: "charlotte-grade3-multiplication-arrays",
  createdAt: "2026-08-23T00:00:00.000Z",
  source: "built-in",
  subject: "Math",
  title: "Multiplication & Array Adventure",
  shortTitle: "Multiplication & Arrays",
  gradeFit: "Grade 3",
  summaryForParent:
    "Charlotte is learning multiplication with groups, arrays, rows, columns, and story problems. She often finds the right total. Let’s practice rows versus columns and naming what she counted.",
  childIntro:
    "Let’s find the groups, count each group, and multiply.",
  strengths: [
    {
      title: "Finds the total",
      detail: "She gets many multiplication answers right."
    },
    {
      title: "Uses pictures",
      detail: "She uses dots and groups to help."
    },
    {
      title: "Can switch numbers",
      detail: "She sees that 4 × 5 and 5 × 4 match."
    }
  ],
  practiceNeeds: [
    {
      conceptId: "rows-columns",
      title: "Rows versus columns",
      observation:
        "Rows go across. Columns go up and down.",
      practicalApproach:
        "Count the rows first. Then count how many are in each row."
    },
    {
      conceptId: "answer-labels",
      title: "Name what is being counted",
      observation:
        "The number can be right, but the label can be wrong.",
      practicalApproach:
        "Read the last line. Write the thing you counted."
    },
    {
      conceptId: "word-to-equation",
      title: "Turn the story into multiplication",
      observation:
        "Find the two numbers before you multiply.",
      practicalApproach:
        "Ask: How many groups? How many in each group? Then multiply."
    }
  ],
  reusableStrategy: [
    "Find the groups.",
    "Find how many are in each group.",
    "Multiply.",
    "Write what you counted."
  ],
  concepts: [
    {
      id: "equal-groups",
      name: "Equal groups",
      childFriendlyName: "Equal groups",
      description:
        "Count the groups. Count how many are in each group.",
      icon: "🧺",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "arrays",
      name: "Arrays",
      childFriendlyName: "Arrays",
      description:
        "Use rows and columns to multiply.",
      icon: "✨",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "rows-columns",
      name: "Rows and columns",
      childFriendlyName: "Rows and columns",
      description:
        "Rows go across. Columns go up and down.",
      icon: "↔️",
      confidence: 0.99,
      selectedByDefault: true
    },
    {
      id: "word-to-equation",
      name: "Word problem to equation",
      childFriendlyName: "Story problems",
      description:
        "Find the groups and how many are in each. Then multiply.",
      icon: "📖",
      confidence: 0.98,
      selectedByDefault: true
    },
    {
      id: "commutative-property",
      name: "Commutative property",
      childFriendlyName: "Switch the numbers",
      description:
        "4 × 5 and 5 × 4 have the same answer.",
      icon: "🔁",
      confidence: 0.98,
      selectedByDefault: true
    },
    {
      id: "answer-labels",
      name: "Answer labels",
      childFriendlyName: "What did you count?",
      description:
        "Write the thing you counted, like rabbits or pencils.",
      icon: "🏷️",
      confidence: 0.96,
      selectedByDefault: true
    }
  ],
  vocabulary: [
    { term: "factor", meaning: "A number being multiplied." },
    { term: "product", meaning: "The answer to a multiplication problem." },
    { term: "row", meaning: "A line that goes across." },
    { term: "column", meaning: "A line that goes up and down." },
    { term: "array", meaning: "Objects arranged in equal rows and columns." }
  ],
  uncertainNotes: [],
  recommendedQuestionMix: [
    { conceptId: "rows-columns", weight: 24 },
    { conceptId: "word-to-equation", weight: 20 },
    { conceptId: "answer-labels", weight: 18 },
    { conceptId: "equal-groups", weight: 16 },
    { conceptId: "arrays", weight: 14 },
    { conceptId: "commutative-property", weight: 8 }
  ]
};

export function cloneSamplePack() {
  return JSON.parse(JSON.stringify(CHARLOTTE_SAMPLE_PACK));
}

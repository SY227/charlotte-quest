const stringArray = {
  type: "array",
  items: {
    type: "string"
  }
};

export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    source: {
      type: "string",
      enum: [
        "uploaded-homework"
      ]
    },
    subject: {
      type: "string"
    },
    title: {
      type: "string"
    },
    shortTitle: {
      type: "string"
    },
    gradeFit: {
      type: "string"
    },
    summaryForParent: {
      type: "string"
    },
    childIntro: {
      type: "string"
    },
    strengths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string"
          },
          detail: {
            type: "string"
          }
        },
        required: [
          "title",
          "detail"
        ]
      }
    },
    practiceNeeds: {
      type: "array",
      items: {
        type: "object",
        properties: {
          conceptId: {
            type: "string"
          },
          title: {
            type: "string"
          },
          observation: {
            type: "string"
          },
          practicalApproach: {
            type: "string"
          }
        },
        required: [
          "conceptId",
          "title",
          "observation",
          "practicalApproach"
        ]
      }
    },
    reusableStrategy: {
      type: "array",
      items: {
        type: "string"
      }
    },
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string"
          },
          childFriendlyName: {
            type: "string"
          },
          description: {
            type: "string"
          },
          icon: {
            type: "string"
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          selectedByDefault: {
            type: "boolean"
          }
        },
        required: [
          "id",
          "name",
          "childFriendlyName",
          "description",
          "icon",
          "confidence",
          "selectedByDefault"
        ]
      }
    },
    vocabulary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: {
            type: "string"
          },
          meaning: {
            type: "string"
          }
        },
        required: [
          "term",
          "meaning"
        ]
      }
    },
    uncertainNotes:
      stringArray,
    recommendedQuestionMix: {
      type: "array",
      items: {
        type: "object",
        properties: {
          conceptId: {
            type: "string"
          },
          weight: {
            type: "integer",
            minimum: 1,
            maximum: 100
          }
        },
        required: [
          "conceptId",
          "weight"
        ]
      }
    },
    generationGuidance: {
      type: "object",
      properties: {
        problemStructures:
          stringArray,
        factEmphasis:
          stringArray,
        contextIdeas:
          stringArray,
        avoidPatterns:
          stringArray
      },
      required: [
        "problemStructures",
        "factEmphasis",
        "contextIdeas",
        "avoidPatterns"
      ]
    }
  },
  required: [
    "id",
    "source",
    "subject",
    "title",
    "shortTitle",
    "gradeFit",
    "summaryForParent",
    "childIntro",
    "strengths",
    "practiceNeeds",
    "reusableStrategy",
    "concepts",
    "vocabulary",
    "uncertainNotes",
    "recommendedQuestionMix",
    "generationGuidance"
  ]
};

const questionSchema = {
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    conceptId: {
      type: "string"
    },
    conceptName: {
      type: "string"
    },
    type: {
      type: "string",
      enum: [
        "multiple_choice",
        "number_input",
        "equation_choice",
        "unit_choice",
        "true_false"
      ]
    },
    prompt: {
      type: "string"
    },
    directions: {
      type: "string"
    },
    choices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          label: {
            type: "string"
          }
        },
        required: [
          "id",
          "label"
        ]
      }
    },
    answer: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: [
            "choice",
            "number",
            "text"
          ]
        },
        value: {
          type: "string"
        },
        acceptedValues:
          stringArray
      },
      required: [
        "kind",
        "value",
        "acceptedValues"
      ]
    },
    visual: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: [
            "none"
          ]
        },
        rows: {
          type: "integer",
          minimum: 0,
          maximum: 0
        },
        columns: {
          type: "integer",
          minimum: 0,
          maximum: 0
        },
        groups: {
          type: "integer",
          minimum: 0,
          maximum: 0
        },
        itemsPerGroup: {
          type: "integer",
          minimum: 0,
          maximum: 0
        },
        itemEmoji: {
          type: "string"
        },
        highlight: {
          type: "string",
          enum: [
            "none"
          ]
        },
        caption: {
          type: "string"
        }
      },
      required: [
        "kind",
        "rows",
        "columns",
        "groups",
        "itemsPerGroup",
        "itemEmoji",
        "highlight",
        "caption"
      ]
    },
    strategy: {
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string"
              },
              text: {
                type: "string"
              }
            },
            required: [
              "title",
              "text"
            ]
          }
        },
        deeperExplanation: {
          type: "string"
        },
        transferTip: {
          type: "string"
        }
      },
      required: [
        "title",
        "steps",
        "deeperExplanation",
        "transferTip"
      ]
    },
    answerSentence: {
      type: "string"
    },
    difficulty: {
      type: "integer",
      minimum: 1,
      maximum: 3
    },
    fingerprint: {
      type: "string"
    },
    validation: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: [
            "multiply",
            "divide",
            "none"
          ]
        },
        factorA: {
          type: "integer",
          minimum: 0,
          maximum: 400
        },
        factorB: {
          type: "integer",
          minimum: 0,
          maximum: 20
        },
        product: {
          type: "integer",
          minimum: 0,
          maximum: 400
        },
        unit: {
          type: "string"
        }
      },
      required: [
        "operation",
        "factorA",
        "factorB",
        "product",
        "unit"
      ]
    }
  },
  required: [
    "id",
    "conceptId",
    "conceptName",
    "type",
    "prompt",
    "directions",
    "choices",
    "answer",
    "visual",
    "strategy",
    "answerSentence",
    "difficulty",
    "fingerprint",
    "validation"
  ]
};

export const QUESTION_BATCH_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items:
        questionSchema
    }
  },
  required: [
    "questions"
  ]
};

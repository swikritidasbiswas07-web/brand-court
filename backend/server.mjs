import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(
  express.json({
    limit: "5mb",
  })
);


// ======================================================
// GEMINI
// ======================================================

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "\n❌ GEMINI_API_KEY missing from backend/.env"
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.6-flash";


// ======================================================
// HELPERS
// ======================================================

function getErrorMessage(error) {
  if (!error) {
    return "Unknown error";
  }

  if (
    typeof error.message ===
    "string"
  ) {
    return error.message;
  }

  try {
    return JSON.stringify(
      error
    );
  } catch {
    return String(error);
  }
}


function withTimeout(
  promise,
  milliseconds = 12000
) {
  return Promise.race([
    promise,

    new Promise(
      (_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `AI request timed out after ${
                milliseconds / 1000
              } seconds.`
            )
          );
        }, milliseconds);
      }
    ),
  ]);
}


async function generateStructured(
  prompt,
  schema
) {
  console.log(
    `🤖 Calling ${MODEL}...`
  );

  const response =
    await withTimeout(
      ai.models.generateContent({
        model: MODEL,

        contents: prompt,

        config: {
          responseMimeType:
            "application/json",

          responseSchema:
            schema,
        },
      }),
      12000
    );

  if (!response?.text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  const data =
    JSON.parse(
      response.text.trim()
    );

  console.log(
    "✓ Structured AI response received"
  );

  return data;
}


// ======================================================
// ROOT / TEST
// ======================================================

app.get("/", (req, res) => {
  res.send(
    "Brand Court backend is running."
  );
});


app.get(
  "/api/test-ai",
  async (req, res) => {
    try {
      const response =
        await withTimeout(
          ai.models.generateContent({
            model: MODEL,

            contents:
              "Reply exactly: Brand Court AI is connected.",
          }),
          12000
        );

      return res.json({
        success: true,

        modelUsed:
          MODEL,

        response:
          response.text?.trim(),
      });

    } catch (error) {
      return res
        .status(503)
        .json({
          success: false,

          error:
            getErrorMessage(
              error
            ),
        });
    }
  }
);


// ======================================================
// EVIDENCE SCHEMA
// ======================================================

const evidenceSchema = {
  type: "object",

  properties: {
    caseSummary: {
      type: "object",

      properties: {
        productType: {
          type: "string",
        },

        coreProblem: {
          type: "string",
        },

        audience: {
          type: "string",
        },

        proposedValue: {
          type: "string",
        },
      },

      required: [
        "productType",
        "coreProblem",
        "audience",
        "proposedValue",
      ],
    },

    known: {
      type: "array",

      items: {
        type: "object",

        properties: {
          label: {
            type: "string",
          },

          statement: {
            type: "string",
          },
        },

        required: [
          "label",
          "statement",
        ],
      },
    },

    assumptions: {
      type: "array",

      items: {
        type: "object",

        properties: {
          label: {
            type: "string",
          },

          statement: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "label",
          "statement",
          "reason",
        ],
      },
    },

    unknowns: {
      type: "array",

      items: {
        type: "object",

        properties: {
          label: {
            type: "string",
          },

          question: {
            type: "string",
          },
        },

        required: [
          "label",
          "question",
        ],
      },
    },
  },

  required: [
    "caseSummary",
    "known",
    "assumptions",
    "unknowns",
  ],
};


// ======================================================
// EVIDENCE FALLBACK
// ======================================================

function buildEvidenceFallback(
  idea,
  answers
) {
  return {
    caseSummary: {
      productType:
        "Founder-defined product or service concept",

      coreProblem:
        answers.alternative,

      audience:
        answers.audience,

      proposedValue:
        answers.difference,
    },

    known: [
      {
        label:
          "Founder Idea",

        statement:
          idea,
      },

      {
        label:
          "Intended Audience",

        statement:
          answers.audience,
      },

      {
        label:
          "Current Behaviour",

        statement:
          answers.alternative,
      },

      {
        label:
          "Proposed Difference",

        statement:
          answers.difference,
      },
    ],

    assumptions: [
      {
        label:
          "Problem Importance",

        statement:
          "The stated problem matters enough for the intended audience to consider another solution.",

        reason:
          "No direct audience validation has been supplied.",
      },

      {
        label:
          "Value Relevance",

        statement:
          "The proposed difference is meaningful enough to influence user choice.",

        reason:
          "The proposed value currently comes from founder testimony rather than validated audience evidence.",
      },

      {
        label:
          "Adoption",

        statement:
          "The intended audience would change or supplement its current behaviour to use the solution.",

        reason:
          "Actual adoption behaviour has not yet been observed.",
      },
    ],

    unknowns: [
      {
        label:
          "Decision Criteria",

        question:
          "What matters most when the intended audience decides whether to use this solution?",
      },

      {
        label:
          "Trust",

        question:
          "What would make the audience trust this solution?",
      },

      {
        label:
          "Usage Context",

        question:
          "When would the audience be most likely to use this solution?",
      },
    ],
  };
}


// ======================================================
// EVIDENCE ENDPOINT
// ======================================================

app.post(
  "/api/analyze-evidence",
  async (req, res) => {
    const {
      idea,
      answers,
    } = req.body;

    if (
      !idea?.trim() ||
      !answers?.audience?.trim() ||
      !answers?.alternative?.trim() ||
      !answers?.difference?.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            "Idea and all founder interview answers are required.",
        });
    }

    console.log(
      "\n=============================="
    );

    console.log(
      "⚖ EVIDENCE MATRIX"
    );

    console.log(
      "=============================="
    );

    try {
      const prompt = `
You are the Evidence Analyst inside BRAND//COURT.

The founder may be building any type of product,
service, organisation, startup, platform,
community, marketplace, creator project,
or business concept.

Do not assume an industry.

Separate the founder's input into:

1. KNOWN
2. ASSUMED
3. UNKNOWN


========================================
FOUNDER IDEA
========================================

${idea}


TARGET AUDIENCE:

${answers.audience}


CURRENT BEHAVIOUR / ALTERNATIVE:

${answers.alternative}


PROPOSED DIFFERENCE:

${answers.difference}


========================================
CASE SUMMARY
========================================

Create a concise neutral summary containing:

- product type
- core problem
- audience
- proposed value


========================================
KNOWN
========================================

Generate 3 to 5 items.

Every known item must be directly supported
by founder testimony.


========================================
ASSUMED
========================================

Generate 3 to 5 important assumptions.

For every assumption explain why it remains
unverified.


========================================
UNKNOWN
========================================

Generate 3 to 5 strategically important
questions that remain unanswered.


========================================
RULES
========================================

Never invent:

- statistics
- market research
- competitors
- validated customer behaviour
- customer preferences
- product functionality
- external evidence

Plausible but unsupported information belongs
under ASSUMED.

Missing strategically important information
belongs under UNKNOWN.
`;

      const data =
        await generateStructured(
          prompt,
          evidenceSchema
        );

      return res.json({
        success: true,

        provisional: false,

        modelUsed:
          MODEL,

        ...data,
      });

    } catch (error) {
      console.error(
        "⚠ Evidence AI unavailable:"
      );

      console.error(
        getErrorMessage(
          error
        )
      );

      return res.json({
        success: true,

        provisional: true,

        modelUsed:
          "founder-evidence-fallback",

        ...buildEvidenceFallback(
          idea,
          answers
        ),
      });
    }
  }
);


// ======================================================
// BRAND DNA SCHEMA
// ======================================================

const dnaSchema = {
  type: "object",

  properties: {
    purpose: {
      type: "string",
    },

    audienceTruth: {
      type: "string",
    },

    corePromise: {
      type: "string",
    },

    personality: {
      type: "array",

      items: {
        type: "object",

        properties: {
          trait: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "trait",
          "reason",
        ],
      },
    },

    antiPersonality: {
      type: "array",

      items: {
        type: "object",

        properties: {
          trait: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "trait",
          "reason",
        ],
      },
    },

    principles: {
      type: "array",

      items: {
        type: "object",

        properties: {
          title: {
            type: "string",
          },

          rule: {
            type: "string",
          },
        },

        required: [
          "title",
          "rule",
        ],
      },
    },
  },

  required: [
    "purpose",
    "audienceTruth",
    "corePromise",
    "personality",
    "antiPersonality",
    "principles",
  ],
};


// ======================================================
// DNA FALLBACK
// ======================================================

function buildDnaFallback(
  evidence
) {
  return {
    purpose:
      `Create a clearer and more useful way to address: ${evidence.caseSummary.coreProblem}`,

    audienceTruth:
      `The intended audience is ${evidence.caseSummary.audience}. Deeper motivations remain unverified.`,

    corePromise:
      evidence.caseSummary
        .proposedValue,

    personality: [
      {
        trait:
          "Clear",

        reason:
          "The usefulness of the solution should be immediately understandable.",
      },

      {
        trait:
          "Useful",

        reason:
          "Practical value should come before branding theatrics.",
      },

      {
        trait:
          "Approachable",

        reason:
          "The audience should feel able to understand and engage with the solution.",
      },
    ],

    antiPersonality: [
      {
        trait:
          "Overpromising",

        reason:
          "The brand should not present unverified outcomes as guarantees.",
      },

      {
        trait:
          "Needlessly Complex",

        reason:
          "Complex messaging would obscure the stated value.",
      },
    ],

    principles: [
      {
        title:
          "Evidence before claims",

        rule:
          "Never convert an assumption into a customer truth without validation.",
      },

      {
        title:
          "Clarity before cleverness",

        rule:
          "The audience should understand the product before being asked to admire the branding.",
      },

      {
        title:
          "Value before hype",

        rule:
          "Communicate genuine usefulness rather than exaggerated innovation language.",
      },
    ],
  };
}


// ======================================================
// BRAND DNA ENDPOINT
// ======================================================

app.post(
  "/api/generate-brand-dna",
  async (req, res) => {
    const {
      idea,
      answers,
      evidence,
    } = req.body;

    if (
      !idea ||
      !answers ||
      !evidence?.caseSummary
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            "Idea, interview and Evidence Board are required.",
        });
    }

    console.log(
      "\n=============================="
    );

    console.log(
      "🧬 BRAND DNA"
    );

    console.log(
      "=============================="
    );

    try {
      const known =
        evidence.known
          ?.map(
            (item) =>
              `- ${item.label}: ${item.statement}`
          )
          .join("\n") ||
        "None";

      const assumptions =
        evidence.assumptions
          ?.map(
            (item) =>
              `- ${item.label}: ${item.statement}`
          )
          .join("\n") ||
        "None";

      const unknowns =
        evidence.unknowns
          ?.map(
            (item) =>
              `- ${item.label}: ${item.question}`
          )
          .join("\n") ||
        "None";

      const prompt = `
You are the Brand DNA Strategist inside BRAND//COURT.

Create the internal strategic identity of the brand.

Do NOT create:

- brand names
- taglines
- logos
- colours
- typography


========================================
IDEA
========================================

${idea}


========================================
CASE SUMMARY
========================================

Product:
${evidence.caseSummary.productType}

Problem:
${evidence.caseSummary.coreProblem}

Audience:
${evidence.caseSummary.audience}

Proposed value:
${evidence.caseSummary.proposedValue}


========================================
KNOWN
========================================

${known}


========================================
ASSUMED
========================================

${assumptions}


========================================
UNKNOWN
========================================

${unknowns}


========================================
OUTPUT
========================================

Define:

1. Purpose
2. Audience truth
3. Core promise
4. 3 to 5 personality traits with reasoning
5. 2 to 4 anti-personality traits with reasoning
6. 3 to 5 operating principles

Build primarily from KNOWN information.

Do not turn assumptions into facts.
Do not silently answer unknowns.
`;

      const data =
        await generateStructured(
          prompt,
          dnaSchema
        );

      return res.json({
        success: true,

        provisional: false,

        modelUsed:
          MODEL,

        ...data,
      });

    } catch (error) {
      console.error(
        "⚠ Brand DNA AI unavailable:"
      );

      console.error(
        getErrorMessage(
          error
        )
      );

      return res.json({
        success: true,

        provisional: true,

        modelUsed:
          "evidence-fallback",

        ...buildDnaFallback(
          evidence
        ),
      });
    }
  }
);


// ======================================================
// STRATEGIC DIRECTIONS SCHEMA
// ======================================================

const directionsSchema = {
  type: "object",

  properties: {
    directions: {
      type: "array",

      items: {
        type: "object",

        properties: {
          name: {
            type: "string",
          },

          thesis: {
            type: "string",
          },

          positioning: {
            type: "string",
          },

          centralTension: {
            type: "string",
          },

          corePromise: {
            type: "string",
          },

          personalityEmphasis: {
            type: "array",

            items: {
              type: "string",
            },
          },

          messagingTerritory: {
            type: "string",
          },

          whyItWorks: {
            type: "string",
          },

          strategicRisk: {
            type: "string",
          },
        },

        required: [
          "name",
          "thesis",
          "positioning",
          "centralTension",
          "corePromise",
          "personalityEmphasis",
          "messagingTerritory",
          "whyItWorks",
          "strategicRisk",
        ],
      },
    },
  },

  required: [
    "directions",
  ],
};


// ======================================================
// DIRECTIONS FALLBACK
// ======================================================

function buildDirectionsFallback(
  evidence,
  dna
) {
  return {
    directions: [
      {
        name:
          "UTILITY FIRST",

        thesis:
          "Make the clearest practical value of the product the centre of the brand.",

        positioning:
          `Position the brand around delivering ${dna.corePromise}`,

        centralTension:
          evidence.caseSummary
            .coreProblem,

        corePromise:
          dna.corePromise,

        personalityEmphasis: [
          "Clear",
          "Useful",
          "Direct",
        ],

        messagingTerritory:
          "Make the benefit immediately understandable.",

        whyItWorks:
          "This direction lets practical usefulness lead the story.",

        strategicRisk:
          "The brand could become useful but emotionally forgettable.",
      },

      {
        name:
          "CONFIDENCE FIRST",

        thesis:
          "Build the brand around reducing uncertainty for the intended audience.",

        positioning:
          `Position the solution as a dependable way for ${evidence.caseSummary.audience} to approach the stated problem.`,

        centralTension:
          "Understanding a solution does not automatically create enough confidence to adopt it.",

        corePromise:
          dna.corePromise,

        personalityEmphasis: [
          "Reassuring",
          "Human",
          "Dependable",
        ],

        messagingTerritory:
          "Turn uncertainty into confidence.",

        whyItWorks:
          "This route focuses on the emotional barrier between recognising a problem and adopting a solution.",

        strategicRisk:
          "Trust language can become generic without supporting evidence.",
      },

      {
        name:
          "CHARACTER FIRST",

        thesis:
          "Use the Brand DNA to create a recognisable strategic point of view.",

        positioning:
          "Position the brand as a distinctive alternative to the audience's current behaviour.",

        centralTension:
          evidence.caseSummary
            .coreProblem,

        corePromise:
          dna.corePromise,

        personalityEmphasis:
          dna.personality
            ?.slice(0, 3)
            .map(
              (item) =>
                item.trait
            ) || [
            "Distinctive",
            "Focused",
            "Human",
          ],

        messagingTerritory:
          "Own a recognisable way of framing the problem.",

        whyItWorks:
          "The route uses brand character to improve memorability without abandoning utility.",

        strategicRisk:
          "Distinctiveness could become style without substance.",
      },
    ],
  };
}


// ======================================================
// DIRECTIONS ENDPOINT
// ======================================================

app.post(
  "/api/generate-directions",
  async (req, res) => {
    const {
      idea,
      evidence,
      brandDna,
    } = req.body;

    if (
      !idea ||
      !evidence?.caseSummary ||
      !brandDna?.purpose
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            "Idea, Evidence Board and Brand DNA are required.",
        });
    }

    console.log(
      "\n=============================="
    );

    console.log(
      "🧭 STRATEGIC DIRECTIONS"
    );

    console.log(
      "=============================="
    );

    try {
      const personality =
        brandDna.personality
          ?.map(
            (item) =>
              `${item.trait}: ${item.reason}`
          )
          .join("\n") ||
        "";

      const principles =
        brandDna.principles
          ?.map(
            (item) =>
              `${item.title}: ${item.rule}`
          )
          .join("\n") ||
        "";

      const prompt = `
You are the Strategic Direction Architect inside BRAND//COURT.

Create EXACTLY THREE strategically different
positioning routes for the same brand.

These are NOT visual themes.

They are three different strategic ways for the
same product to occupy a place in the audience's mind.


========================================
IDEA
========================================

${idea}


========================================
CASE
========================================

Product:
${evidence.caseSummary.productType}

Problem:
${evidence.caseSummary.coreProblem}

Audience:
${evidence.caseSummary.audience}

Value:
${evidence.caseSummary.proposedValue}


========================================
BRAND DNA
========================================

Purpose:
${brandDna.purpose}

Audience truth:
${brandDna.audienceTruth}

Core promise:
${brandDna.corePromise}

Personality:
${personality}

Principles:
${principles}


========================================
EACH DIRECTION NEEDS
========================================

- internal strategic name
- thesis
- positioning
- central tension
- core promise
- 2 to 4 personality traits
- messaging territory
- why it works
- strategic risk

The three directions must meaningfully differ.

Do not invent market research, competitors,
customer evidence or unsupported functionality.
`;

      const data =
        await generateStructured(
          prompt,
          directionsSchema
        );

      if (
        !Array.isArray(
          data.directions
        ) ||
        data.directions.length !== 3
      ) {
        throw new Error(
          "AI did not return exactly three strategic directions."
        );
      }

      return res.json({
        success: true,

        provisional: false,

        modelUsed:
          MODEL,

        ...data,
      });

    } catch (error) {
      console.error(
        "⚠ Strategy AI unavailable:"
      );

      console.error(
        getErrorMessage(
          error
        )
      );

      return res.json({
        success: true,

        provisional: true,

        modelUsed:
          "strategy-fallback",

        ...buildDirectionsFallback(
          evidence,
          brandDna
        ),
      });
    }
  }
);


// ======================================================
// TRIAL SCHEMA
// ======================================================

const trialAgentSchema = {
  type: "object",

  properties: {
    headline: {
      type: "string",
    },

    perspective: {
      type: "string",
    },

    objections: {
      type: "array",

      items: {
        type: "string",
      },
    },

    crossExamination: {
      type: "string",
    },

    conditionForApproval: {
      type: "string",
    },
  },

  required: [
    "headline",
    "perspective",
    "objections",
    "crossExamination",
    "conditionForApproval",
  ],
};


const trialSchema = {
  type: "object",

  properties: {
    agents: {
      type: "object",

      properties: {
        customer: {
          ...trialAgentSchema,
        },

        skeptic: {
          ...trialAgentSchema,
        },

        strategist: {
          ...trialAgentSchema,
        },

        operator: {
          ...trialAgentSchema,
        },
      },

      required: [
        "customer",
        "skeptic",
        "strategist",
        "operator",
      ],
    },

    courtFinding: {
      type: "object",

      properties: {
        classification: {
          type: "string",
        },

        summary: {
          type: "string",
        },

        strongestElement: {
          type: "string",
        },

        weakestElement: {
          type: "string",
        },

        preserve: {
          type: "array",

          items: {
            type: "string",
          },
        },

        requiredRevisions: {
          type: "array",

          items: {
            type: "string",
          },
        },
      },

      required: [
        "classification",
        "summary",
        "strongestElement",
        "weakestElement",
        "preserve",
        "requiredRevisions",
      ],
    },
  },

  required: [
    "agents",
    "courtFinding",
  ],
};


// ======================================================
// TRIAL FALLBACK
// ======================================================

function buildTrialFallback(
  evidence,
  direction
) {
  return {
    agents: {
      customer: {
        headline:
          "I understand the promise, but I still need a reason to care.",

        perspective:
          "The route communicates a direction, but actual user motivation remains partly unverified.",

        objections: [
          "The problem may not be important enough to trigger adoption.",
          "The proposed value has not yet been tested with real users.",
        ],

        crossExamination:
          "What specific moment would make a member of the intended audience actively choose this solution?",

        conditionForApproval:
          "Show evidence that the stated value matters strongly enough to change current behaviour.",
      },

      skeptic: {
        headline:
          "The strategy is carrying assumptions that still need proof.",

        perspective:
          "Several parts of the positioning depend on beliefs about user response rather than confirmed evidence.",

        objections: [
          "Audience willingness to adopt remains unverified.",
          "The messaging territory may imply emotional responses that have not been validated.",
        ],

        crossExamination:
          "Which part of this positioning is supported by evidence, and which part is still a hypothesis?",

        conditionForApproval:
          "Clearly separate validated claims from hypotheses before strengthening the messaging.",
      },

      strategist: {
        headline:
          "The direction has a usable core, but it needs sharper ownership.",

        perspective:
          "The selected route is coherent with the Brand DNA but must be specific enough to guide future branding decisions.",

        objections: [
          "The positioning may still be broad enough for many unrelated brands to claim.",
          "The central tension should remain tightly connected to the founder's actual evidence.",
        ],

        crossExamination:
          "What strategic idea does this direction own that the other two directions do not?",

        conditionForApproval:
          "Make the positioning distinct enough that future naming and messaging can be judged against it.",
      },

      operator: {
        headline:
          "A promise is only useful if the product can repeatedly deliver it.",

        perspective:
          "The selected direction must remain within the capabilities the founder can realistically support.",

        objections: [
          "Some implied benefits may depend on functionality or adoption that has not yet been demonstrated.",
          "Brand language must not promise more than the product can operationally deliver.",
        ],

        crossExamination:
          "What must consistently work in the actual product for this promise to remain credible?",

        conditionForApproval:
          "Tie the brand promise to capabilities that can be delivered consistently.",
      },
    },

    courtFinding: {
      classification:
        "REVISION REQUIRED",

      summary:
        "The strategic direction is coherent enough to continue, but important assumptions should be resolved before stronger claims are built around it.",

      strongestElement:
        direction.corePromise,

      weakestElement:
        "The current direction still depends on unvalidated audience response.",

      preserve: [
        direction.corePromise,
        direction.messagingTerritory,
      ],

      requiredRevisions: [
        "Separate validated value from speculative audience response.",
        "Sharpen the positioning territory.",
        "Make sure the promise stays within demonstrated product capability.",
      ],
    },
  };
}


// ======================================================
// BRAND COURT TRIAL ENDPOINT
// ======================================================

app.post(
  "/api/run-trial",
  async (req, res) => {
    const {
      idea,
      evidence,
      brandDna,
      direction,
    } = req.body;

    if (
      !idea ||
      !evidence?.caseSummary ||
      !brandDna?.purpose ||
      !direction?.name
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            "Idea, Evidence Board, Brand DNA and selected direction are required.",
        });
    }

    console.log(
      "\n=============================="
    );

    console.log(
      "⚖ BRAND COURT TRIAL"
    );

    console.log(
      "=============================="
    );

    try {
      const known =
        evidence.known
          ?.map(
            (item) =>
              `- ${item.label}: ${item.statement}`
          )
          .join("\n") ||
        "";

      const assumptions =
        evidence.assumptions
          ?.map(
            (item) =>
              `- ${item.label}: ${item.statement}`
          )
          .join("\n") ||
        "";

      const unknowns =
        evidence.unknowns
          ?.map(
            (item) =>
              `- ${item.label}: ${item.question}`
          )
          .join("\n") ||
        "";

      const prompt = `
You are the multi-agent trial engine inside BRAND//COURT.

A founder has chosen ONE strategic direction.

Pressure-test it from four perspectives:

1. CUSTOMER
2. SKEPTIC
3. STRATEGIST
4. OPERATOR


========================================
ORIGINAL IDEA
========================================

${idea}


========================================
CASE
========================================

Product:
${evidence.caseSummary.productType}

Core problem:
${evidence.caseSummary.coreProblem}

Audience:
${evidence.caseSummary.audience}

Proposed value:
${evidence.caseSummary.proposedValue}


========================================
KNOWN
========================================

${known}


========================================
ASSUMPTIONS
========================================

${assumptions}


========================================
UNKNOWNS
========================================

${unknowns}


========================================
BRAND DNA
========================================

Purpose:
${brandDna.purpose}

Audience truth:
${brandDna.audienceTruth}

Core promise:
${brandDna.corePromise}


========================================
SELECTED DIRECTION
========================================

Name:
${direction.name}

Thesis:
${direction.thesis}

Positioning:
${direction.positioning}

Central tension:
${direction.centralTension}

Core promise:
${direction.corePromise}

Messaging territory:
${direction.messagingTerritory}

Why it works:
${direction.whyItWorks}

Strategic risk:
${direction.strategicRisk}


========================================
CUSTOMER
========================================

Test:

- relevance
- clarity
- motivation
- behavioural change

Do not pretend this is actual customer research.


========================================
SKEPTIC
========================================

Attack:

- unsupported claims
- assumptions
- vague logic
- unresolved unknowns


========================================
STRATEGIST
========================================

Test:

- Brand DNA fit
- positioning clarity
- strategic distinctiveness
- contradictions


========================================
OPERATOR
========================================

Test:

- ability to deliver
- operational dependency
- unsupported functionality
- overpromising


========================================
FOR EACH AGENT
========================================

Return:

- headline
- perspective
- 2 to 4 objections
- cross-examination question
- condition for approval


========================================
COURT FINDING
========================================

Use ONLY one of these exact labels:

DEFENSIBLE
REVISION REQUIRED
HIGH-RISK

Also return:

- summary
- strongest element
- weakest element
- elements to preserve
- required revisions

Be demanding but fair.

Never invent evidence.
`;

      const data =
        await generateStructured(
          prompt,
          trialSchema
        );

      const validClassifications = [
        "DEFENSIBLE",
        "REVISION REQUIRED",
        "HIGH-RISK",
      ];

      if (
        !validClassifications.includes(
          data?.courtFinding
            ?.classification
        )
      ) {
        throw new Error(
          "Invalid court classification."
        );
      }

      console.log(
        "✓ Brand Court trial complete"
      );

      return res.json({
        success: true,

        provisional: false,

        modelUsed:
          MODEL,

        ...data,
      });

    } catch (error) {
      console.error(
        "⚠ Trial AI unavailable:"
      );

      console.error(
        getErrorMessage(
          error
        )
      );

      return res.json({
        success: true,

        provisional: true,

        modelUsed:
          "trial-fallback",

        ...buildTrialFallback(
          evidence,
          direction
        ),
      });
    }
  }
);


// ======================================================
// FINAL BRAND SYSTEM SCHEMA
// ======================================================

const finalSystemSchema = {
  type: "object",

  properties: {
    naming: {
      type: "object",

      properties: {
        primaryName: {
          type: "string",
        },

        rationale: {
          type: "string",
        },

        alternates: {
          type: "array",

          items: {
            type: "string",
          },
        },
      },

      required: [
        "primaryName",
        "rationale",
        "alternates",
      ],
    },

    finalCore: {
      type: "object",

      properties: {
        positioning: {
          type: "string",
        },

        purpose: {
          type: "string",
        },

        audience: {
          type: "string",
        },

        corePromise: {
          type: "string",
        },
      },

      required: [
        "positioning",
        "purpose",
        "audience",
        "corePromise",
      ],
    },

    messaging: {
      type: "object",

      properties: {
        primaryTagline: {
          type: "string",
        },

        alternateTaglines: {
          type: "array",

          items: {
            type: "string",
          },
        },

        oneLinePitch: {
          type: "string",
        },

        shortDescription: {
          type: "string",
        },

        elevatorPitch: {
          type: "string",
        },

        keyMessages: {
          type: "array",

          items: {
            type: "string",
          },
        },
      },

      required: [
        "primaryTagline",
        "alternateTaglines",
        "oneLinePitch",
        "shortDescription",
        "elevatorPitch",
        "keyMessages",
      ],
    },

    voice: {
      type: "object",

      properties: {
        definition: {
          type: "string",
        },

        tonePrinciples: {
          type: "array",

          items: {
            type: "string",
          },
        },

        soundsLike: {
          type: "array",

          items: {
            type: "string",
          },
        },

        neverSoundsLike: {
          type: "array",

          items: {
            type: "string",
          },
        },

        sampleCopy: {
          type: "string",
        },
      },

      required: [
        "definition",
        "tonePrinciples",
        "soundsLike",
        "neverSoundsLike",
        "sampleCopy",
      ],
    },

    identityDirection: {
      type: "object",

      properties: {
        visualPersonality: {
          type: "string",
        },

        colorDirection: {
          type: "array",

          items: {
            type: "string",
          },
        },

        typographyDirection: {
          type: "string",
        },

        graphicLanguage: {
          type: "string",
        },

        logoDirection: {
          type: "string",
        },
      },

      required: [
        "visualPersonality",
        "colorDirection",
        "typographyDirection",
        "graphicLanguage",
        "logoDirection",
      ],
    },

    launchSystem: {
      type: "object",

      properties: {
        homepageHero: {
          type: "string",
        },

        homepageSubhead: {
          type: "string",
        },

        primaryCTA: {
          type: "string",
        },

        socialBio: {
          type: "string",
        },

        launchAnnouncement: {
          type: "string",
        },
      },

      required: [
        "homepageHero",
        "homepageSubhead",
        "primaryCTA",
        "socialBio",
        "launchAnnouncement",
      ],
    },

    decisionTrace: {
      type: "object",

      properties: {
        courtInfluence: {
          type: "string",
        },

        preservedElements: {
          type: "array",

          items: {
            type: "string",
          },
        },

        revisionsApplied: {
          type: "array",

          items: {
            type: "string",
          },
        },

        knownRisks: {
          type: "array",

          items: {
            type: "string",
          },
        },
      },

      required: [
        "courtInfluence",
        "preservedElements",
        "revisionsApplied",
        "knownRisks",
      ],
    },
  },

  required: [
    "naming",
    "finalCore",
    "messaging",
    "voice",
    "identityDirection",
    "launchSystem",
    "decisionTrace",
  ],
};


// ======================================================
// FINAL SYSTEM FALLBACK
// ======================================================

function buildFinalSystemFallback(
  evidence,
  brandDna,
  direction,
  trial,
  founderDecision
) {
  const accepted =
    founderDecision ===
    "accept";

  return {
    naming: {
      primaryName:
        "Working Brand",

      rationale:
        "A final name requires further creative exploration. This fallback preserves the system flow without pretending that a validated name exists.",

      alternates: [
        "Working Concept",
        "Brand Prototype",
        "Launch Identity",
      ],
    },

    finalCore: {
      positioning:
        direction.positioning,

      purpose:
        brandDna.purpose,

      audience:
        evidence.caseSummary
          .audience,

      corePromise:
        direction.corePromise,
    },

    messaging: {
      primaryTagline:
        direction.messagingTerritory,

      alternateTaglines: [
        direction.corePromise,
        "A clearer way forward.",
        "Built around what matters.",
      ],

      oneLinePitch:
        `${evidence.caseSummary.productType} for ${evidence.caseSummary.audience}, built around ${direction.corePromise}.`,

      shortDescription:
        evidence.caseSummary
          .proposedValue,

      elevatorPitch:
        `The concept addresses ${evidence.caseSummary.coreProblem}. It is designed for ${evidence.caseSummary.audience} and is positioned around ${direction.corePromise}.`,

      keyMessages: [
        direction.corePromise,
        direction.messagingTerritory,
        brandDna.purpose,
      ],
    },

    voice: {
      definition:
        "Clear, useful, human and evidence-aware.",

      tonePrinciples: [
        "Explain before impressing.",
        "Use confident but supportable claims.",
        "Keep value concrete.",
      ],

      soundsLike: [
        "Clear",
        "Focused",
        "Useful",
      ],

      neverSoundsLike: [
        "Overhyped",
        "Unsubstantiated",
        "Needlessly complicated",
      ],

      sampleCopy:
        direction.messagingTerritory,
    },

    identityDirection: {
      visualPersonality:
        "Modern, focused and trustworthy with a clear information hierarchy.",

      colorDirection: [
        "One confident primary colour",
        "Neutral supporting palette",
        "One restrained accent",
      ],

      typographyDirection:
        "A highly readable contemporary sans-serif system with a distinctive display weight.",

      graphicLanguage:
        "Structured layouts, clean geometry and visual elements that reinforce clarity rather than decoration.",

      logoDirection:
        "A simple recognisable symbol or wordmark that remains legible at small digital sizes.",
    },

    launchSystem: {
      homepageHero:
        direction.messagingTerritory,

      homepageSubhead:
        evidence.caseSummary
          .proposedValue,

      primaryCTA:
        "Get Started",

      socialBio:
        `${direction.corePromise} for ${evidence.caseSummary.audience}.`,

      launchAnnouncement:
        `Introducing a new way to address ${evidence.caseSummary.coreProblem}, designed around ${direction.corePromise}.`,
    },

    decisionTrace: {
      courtInfluence:
        accepted
          ? "The founder accepted the court's revisions. Court pressure points influenced the final system."
          : "The founder preserved the original strategic vector despite the court's objections.",

      preservedElements:
        trial.courtFinding
          .preserve ||
        [
          direction.corePromise,
        ],

      revisionsApplied:
        accepted
          ? (
              trial.courtFinding
                .requiredRevisions ||
              []
            )
          : [],

      knownRisks:
        accepted
          ? [
              direction.strategicRisk,
            ]
          : [
              direction.strategicRisk,
              trial.courtFinding
                .weakestElement,
              ...(
                trial.courtFinding
                  .requiredRevisions ||
                []
              ),
            ],
    },
  };
}


// ======================================================
// FINAL BRAND SYSTEM ENDPOINT
// ======================================================

app.post(
  "/api/generate-final-system",
  async (req, res) => {
    const {
      idea,
      evidence,
      brandDna,
      direction,
      trial,
      founderDecision,
    } = req.body;

    if (
      !idea ||
      !evidence?.caseSummary ||
      !brandDna?.purpose ||
      !direction?.name ||
      !trial?.courtFinding ||
      ![
        "accept",
        "defend",
      ].includes(
        founderDecision
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            "Complete case history and a founder decision are required.",
        });
    }

    console.log(
      "\n=============================="
    );

    console.log(
      "🚀 FINAL BRAND SYSTEM"
    );

    console.log(
      "=============================="
    );

    try {
      const known =
        evidence.known
          ?.map(
            (item) =>
              `- ${item.label}: ${item.statement}`
          )
          .join("\n") ||
        "None";

      const assumptions =
        evidence.assumptions
          ?.map(
            (item) =>
              `- ${item.label}: ${item.statement}`
          )
          .join("\n") ||
        "None";

      const unknowns =
        evidence.unknowns
          ?.map(
            (item) =>
              `- ${item.label}: ${item.question}`
          )
          .join("\n") ||
        "None";

      const preserve =
        trial.courtFinding
          .preserve
          ?.map(
            (item) =>
              `- ${item}`
          )
          .join("\n") ||
        "None";

      const revisions =
        trial.courtFinding
          .requiredRevisions
          ?.map(
            (item) =>
              `- ${item}`
          )
          .join("\n") ||
        "None";

      const decisionInstruction =
        founderDecision ===
        "accept"
          ? `
The founder ACCEPTED THE COURT'S REVISIONS.

You must:

- preserve the strongest elements of the selected direction
- incorporate the court's required revisions
- avoid weakening the Brand DNA
- make the final system more defensible than the original vector
`
          : `
The founder chose to DEFEND THE ORIGINAL VECTOR.

You must:

- preserve the selected direction
- do NOT silently rewrite its strategic core
- continue to obey the Brand DNA
- retain court objections as KNOWN STRATEGIC RISKS
- do not pretend those risks were resolved
`;

      const prompt = `
You are the Final Brand System Architect inside BRAND//COURT.

You are now at:

STAGE 07 // DELIVER

The system has already:

DISCOVERED
VERIFIED
DEFINED
POSITIONED
CHALLENGED
and recorded a HUMAN FOUNDER DECISION.

Create one coherent, launch-ready brand system.


========================================
ORIGINAL IDEA
========================================

${idea}


========================================
CASE
========================================

Product:
${evidence.caseSummary.productType}

Problem:
${evidence.caseSummary.coreProblem}

Audience:
${evidence.caseSummary.audience}

Proposed value:
${evidence.caseSummary.proposedValue}


========================================
KNOWN
========================================

${known}


========================================
ASSUMED
========================================

${assumptions}


========================================
UNKNOWN
========================================

${unknowns}


========================================
BRAND DNA
========================================

Purpose:
${brandDna.purpose}

Audience truth:
${brandDna.audienceTruth}

Core promise:
${brandDna.corePromise}

Personality:

${
  brandDna.personality
    ?.map(
      (item) =>
        `- ${item.trait}: ${item.reason}`
    )
    .join("\n") ||
  "None"
}

Anti-personality:

${
  brandDna.antiPersonality
    ?.map(
      (item) =>
        `- ${item.trait}: ${item.reason}`
    )
    .join("\n") ||
  "None"
}

Operating principles:

${
  brandDna.principles
    ?.map(
      (item) =>
        `- ${item.title}: ${item.rule}`
    )
    .join("\n") ||
  "None"
}


========================================
SELECTED STRATEGIC VECTOR
========================================

Name:
${direction.name}

Thesis:
${direction.thesis}

Positioning:
${direction.positioning}

Central tension:
${direction.centralTension}

Core promise:
${direction.corePromise}

Messaging territory:
${direction.messagingTerritory}

Strategic risk:
${direction.strategicRisk}


========================================
COURT FINDING
========================================

Classification:
${trial.courtFinding.classification}

Summary:
${trial.courtFinding.summary}

Strongest element:
${trial.courtFinding.strongestElement}

Weakest element:
${trial.courtFinding.weakestElement}

PRESERVE:

${preserve}

REQUIRED REVISIONS:

${revisions}


========================================
FOUNDER DECISION
========================================

${founderDecision.toUpperCase()}

${decisionInstruction}


========================================
FINAL BRAND SYSTEM
========================================

1. NAMING

Create:

- one recommended brand name
- concise rationale
- exactly 3 alternate names


2. FINAL CORE

Produce:

- final positioning
- purpose
- audience
- core promise


3. MESSAGING SYSTEM

Create:

- primary tagline
- exactly 3 alternate taglines
- one-line pitch
- short brand description
- elevator pitch
- 3 to 5 key messages


4. VOICE SYSTEM

Define:

- overall voice
- 3 to 5 tone principles
- 3 to 5 things the brand sounds like
- 3 to 5 things it must never sound like
- one realistic piece of sample copy


5. VISUAL IDENTITY DIRECTION

Do NOT generate an image.

Describe:

- visual personality
- 3 to 5 colour-direction descriptions
- typography direction
- graphic language
- logo direction


6. LAUNCH SYSTEM

Create:

- homepage hero
- homepage subhead
- primary CTA
- social bio
- launch announcement


7. DECISION TRACE

Explain:

- how the founder's decision influenced the result
- what strategic elements were preserved
- what revisions were applied
- what strategic risks remain


========================================
RULES
========================================

Naming, messaging, voice, visual direction,
and launch copy must all come from the SAME strategy.

Do not invent:

- statistics
- market share
- competitors
- testimonials
- user research
- validated behavioural claims
- unsupported product functionality

Do not convert assumptions into facts.

Do not answer unresolved unknowns as if verified.

Prefer useful, precise branding over empty hype.
`;

      const data =
        await generateStructured(
          prompt,
          finalSystemSchema
        );

      if (
        !Array.isArray(
          data?.naming
            ?.alternates
        ) ||
        !Array.isArray(
          data?.messaging
            ?.alternateTaglines
        )
      ) {
        throw new Error(
          "Incomplete final brand system returned."
        );
      }

      console.log(
        "✓ Final brand system generated"
      );

      return res.json({
        success: true,

        provisional: false,

        modelUsed:
          MODEL,

        founderDecision,

        ...data,
      });

    } catch (error) {
      console.error(
        "⚠ Final system AI unavailable:"
      );

      console.error(
        getErrorMessage(
          error
        )
      );

      return res.json({
        success: true,

        provisional: true,

        modelUsed:
          "final-system-fallback",

        founderDecision,

        ...buildFinalSystemFallback(
          evidence,
          brandDna,
          direction,
          trial,
          founderDecision
        ),
      });
    }
  }
);


// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res
    .status(404)
    .json({
      success: false,

      error:
        "Brand Court route not found.",
    });
});


// ======================================================
// START
// ======================================================

app.listen(
  PORT,
  () => {
    console.log(
      "\n========================================"
    );

    console.log(
      "⚖  BRAND//COURT BACKEND"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Server:       http://localhost:${PORT}`
    );

    console.log(
      `AI Test:      http://localhost:${PORT}/api/test-ai`
    );

    console.log(
      "Evidence:     POST /api/analyze-evidence"
    );

    console.log(
      "Brand DNA:    POST /api/generate-brand-dna"
    );

    console.log(
      "Directions:   POST /api/generate-directions"
    );

    console.log(
      "Trial:        POST /api/run-trial"
    );

    console.log(
      "Final System: POST /api/generate-final-system"
    );

    console.log(
      "========================================\n"
    );
  }
);

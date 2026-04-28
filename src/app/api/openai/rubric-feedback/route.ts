import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { CanvasRubricCriterion } from "@/lib/canvas";

export const runtime = "nodejs";
export const maxDuration = 60;

type RubricFeedbackCriterion = {
  criterionId: string;
  ratingId: string;
  points: number;
  comments: string;
};

type RubricFeedback = {
  overallScore: number;
  generalFeedback: string;
  criteria: RubricFeedbackCriterion[];
};

type RequestBody = {
  essay?: string;
  assignmentName?: string;
  pointsPossible?: number;
  rubricCriteria?: CanvasRubricCriterion[];
};

const OPENAI_GRADING_MODEL = process.env.OPENAI_GRADING_MODEL || "gpt-5.5";
const OPENAI_REQUEST_TIMEOUT_MS = 55_000;
const GRADING_RULES_FILE = "rules for grading.md";

let cachedGradingRules:
  | {
      content: string;
      cacheKey: string;
    }
  | null = null;

const gradingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["overallScore", "generalFeedback", "criteria"],
  properties: {
    overallScore: {
      type: "number",
      description: "The sum of all criterion points.",
    },
    generalFeedback: {
      type: "string",
      maxLength: 180,
      description:
        "One short, natural, student-friendly overall comment. Maximum 25 words.",
    },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterionId", "ratingId", "points", "comments"],
        properties: {
          criterionId: {
            type: "string",
            description:
              "The exact criterion id from the provided Canvas rubric.",
          },
          ratingId: {
            type: "string",
            description:
              "The exact selected rating id from the provided ratings, or an empty string when assigning 0.0 for a missing or incomplete section.",
          },
          points: {
            type: "number",
            description: "The points assigned for this criterion.",
          },
          comments: {
            type: "string",
            maxLength: 160,
            description:
              "One short, natural, student-friendly sentence for this criterion. Maximum 20 words.",
          },
        },
      },
    },
  },
} as const;

function sanitizeRubricCriteria(criteria: CanvasRubricCriterion[]) {
  return criteria.map((criterion) => ({
    id: criterion.id,
    description: criterion.description ?? "",
    long_description: criterion.long_description ?? "",
    points: typeof criterion.points === "number" ? criterion.points : null,
    ratings: (criterion.ratings ?? []).map((rating) => ({
      id: rating.id,
      description: rating.description ?? "",
      long_description: rating.long_description ?? "",
      points: typeof rating.points === "number" ? rating.points : null,
    })),
  }));
}

function getTextFromOpenAIResponse(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: unknown;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function isRubricFeedback(value: unknown): value is RubricFeedback {
  if (!value || typeof value !== "object") {
    return false;
  }

  const feedback = value as RubricFeedback;

  return (
    typeof feedback.overallScore === "number" &&
    typeof feedback.generalFeedback === "string" &&
    Array.isArray(feedback.criteria) &&
    feedback.criteria.every(
      (criterion) =>
        typeof criterion.criterionId === "string" &&
        typeof criterion.ratingId === "string" &&
        typeof criterion.points === "number" &&
        typeof criterion.comments === "string",
    )
  );
}

function roundScore(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      error: {
        message: text.slice(0, 500),
      },
    };
  }
}

async function readGradingRules() {
  if (cachedGradingRules) {
    return cachedGradingRules;
  }

  const content = await readFile(path.join(process.cwd(), GRADING_RULES_FILE), "utf8");
  const cacheKey = `rubric-grading-rules-${createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 16)}`;

  cachedGradingRules = {
    content,
    cacheKey,
  };

  return cachedGradingRules;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "OPENAI_API_KEY is missing from the environment.",
        error: "MISSING_OPENAI_API_KEY",
      },
      { status: 500 },
    );
  }

  let body: RequestBody;

  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON request body.",
        error: "INVALID_JSON",
      },
      { status: 400 },
    );
  }

  const essay = body.essay?.trim();
  const rubricCriteria = body.rubricCriteria ?? [];

  if (!essay) {
    return NextResponse.json(
      {
        success: false,
        message: "Paste a student essay before generating feedback.",
        error: "MISSING_ESSAY",
      },
      { status: 400 },
    );
  }

  if (!Array.isArray(rubricCriteria) || rubricCriteria.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Select an assignment with a Canvas rubric first.",
        error: "MISSING_RUBRIC",
      },
      { status: 400 },
    );
  }

  const sanitizedRubric = sanitizeRubricCriteria(rubricCriteria);
  const rubricIds = new Set(sanitizedRubric.map((criterion) => criterion.id));
  let gradingRules: Awaited<ReturnType<typeof readGradingRules>>;

  try {
    gradingRules = await readGradingRules();
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Could not read ${GRADING_RULES_FILE}. AI grading requires Diego's calibration guide.`,
        error: "MISSING_GRADING_RULES",
        details: error instanceof Error ? error.message : "",
      },
      { status: 500 },
    );
  }

  const promptPayload = {
    assignmentName: body.assignmentName ?? "",
    pointsPossible:
      typeof body.pointsPossible === "number" ? body.pointsPossible : null,
    rubricCriteria: sanitizedRubric,
    essay,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_REQUEST_TIMEOUT_MS);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_GRADING_MODEL,
        reasoning: { effort: "high" },
        input: [
          {
            role: "system",
            content:
              "You are Diego Henao's AI grading assistant. You must follow Diego's grading calibration guide exactly. Use the Canvas rubric criteria and rating ids provided. If a required section is missing, clearly cut off, or only an unfinished sentence, assign 0.0 points for that criterion and use an empty ratingId. Feedback must sound like a real teacher writing quickly to a student: short, warm, direct, and natural. Avoid AI-sounding phrases like 'demonstrates', 'effectively', 'overall', 'robust', 'commendable', and 'further refinement'. Do not write long explanations. For each criterion comment, write one sentence with 8 to 20 words. For general feedback, write one sentence with 10 to 25 words.",
          },
          {
            role: "user",
            content: `Diego's grading calibration guide from ${GRADING_RULES_FILE}:\n\n${gradingRules.content}`,
          },
          {
            role: "user",
            content: `Evaluate this essay and return only the structured grading result. Keep comments brief and student-friendly, like Diego would write in Canvas.\n\n${JSON.stringify(
              promptPayload,
              null,
              2,
            )}`,
          },
        ],
        prompt_cache_key: gradingRules.cacheKey,
        text: {
          format: {
            type: "json_schema",
            name: "rubric_feedback",
            schema: gradingSchema,
            strict: true,
          },
        },
      }),
    }).finally(() => clearTimeout(timeout));

    const data = await readJsonResponse(response);

    if (!response.ok) {
      const errorMessage =
        data && typeof data === "object" && "error" in data
          ? JSON.stringify((data as { error: unknown }).error)
          : "OpenAI request failed.";

      return NextResponse.json(
        {
          success: false,
          message: "OpenAI could not generate rubric feedback.",
          error: "OPENAI_REQUEST_FAILED",
          details: errorMessage,
        },
        { status: response.status },
      );
    }

    const outputText = getTextFromOpenAIResponse(data);
    const parsed = JSON.parse(outputText) as unknown;

    if (!isRubricFeedback(parsed)) {
      throw new Error("OpenAI returned an unexpected feedback shape.");
    }

    const criteria = parsed.criteria
      .filter((criterion) => rubricIds.has(criterion.criterionId))
      .map((criterion) => ({
        ...criterion,
        points: roundScore(criterion.points),
      }));

    const overallScore = roundScore(
      criteria.reduce((total, criterion) => total + criterion.points, 0),
    );

    return NextResponse.json({
      success: true,
      model: OPENAI_GRADING_MODEL,
      reasoningEffort: "high",
      feedback: {
        ...parsed,
        overallScore,
        criteria,
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OpenAI took too long to generate rubric feedback. Try again, or use a shorter essay/rubric.",
          error: "OPENAI_TIMEOUT",
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate rubric feedback.",
        error: "RUBRIC_FEEDBACK_FAILED",
      },
      { status: 500 },
    );
  }
}

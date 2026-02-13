import { NextResponse } from "next/server";

type QuizActionResult = {
  success: boolean;
  message: string;
  quizId?: number;
  error?: string;
};

type CanvasQuestion = {
  question_name?: string;
  question_text?: string;
  question_type?: string;
  points_possible?: number;
  answers?: unknown[];
  [key: string]: unknown;
};

const CANVAS_BASE_URL = "https://canvas.instructure.com/api/v1";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiToken = body?.apiToken;
    const courseId = body?.courseId;
    const quizTitle = body?.quizTitle;
    const questions = body?.questions;

    if (!apiToken || !courseId || !quizTitle || !questions) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields. Please fill in all fields.",
          error: "MISSING_FIELDS",
        } satisfies QuizActionResult,
        { status: 400 },
      );
    }

    // questions can be either an array or a JSON string
    let parsedQuestions: CanvasQuestion[] = [];
    try {
      parsedQuestions =
        typeof questions === "string" ? JSON.parse(questions) : questions;

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Questions must be a non-empty array in JSON format.",
            error: "INVALID_QUESTIONS_FORMAT",
          } satisfies QuizActionResult,
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON format for questions. Please check your JSON syntax.",
          error: "JSON_PARSE_ERROR",
        } satisfies QuizActionResult,
        { status: 400 },
      );
    }

    // 1) Create quiz
    const quizData = {
      quiz: {
        title: quizTitle,
        description: quizTitle,
        published: false,
        allowed_attempts: 10,
      },
    };

    const quizResponse = await fetch(
      `${CANVAS_BASE_URL}/courses/${courseId}/quizzes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      },
    );

    const quizText = await quizResponse.text();

    if (!quizResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to create quiz. Status: ${quizResponse.status}. ${quizText}`,
          error: "QUIZ_CREATION_FAILED",
        } satisfies QuizActionResult,
        { status: quizResponse.status },
      );
    }

    const quizResult = JSON.parse(quizText);
    const quizId = quizResult?.id;

    if (!quizId) {
      return NextResponse.json(
        {
          success: false,
          message: "Quiz created but Canvas did not return a quiz id.",
          error: "MISSING_QUIZ_ID",
        } satisfies QuizActionResult,
        { status: 500 },
      );
    }

    // 2) Add questions
    let questionsAdded = 0;

    for (const q of parsedQuestions) {
      const questionResponse = await fetch(
        `${CANVAS_BASE_URL}/courses/${courseId}/quizzes/${quizId}/questions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: q }),
        },
      );

      const qText = await questionResponse.text();

      if (!questionResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `Quiz created but failed to add question ${
              questionsAdded + 1
            }. Status: ${questionResponse.status}. ${qText}`,
            error: "QUESTION_ADDITION_FAILED",
            quizId,
          } satisfies QuizActionResult,
          { status: questionResponse.status },
        );
      }

      questionsAdded++;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Quiz created successfully with ${questionsAdded} question(s)!`,
        quizId,
      } satisfies QuizActionResult,
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";

    return NextResponse.json(
      {
        success: false,
        message: `An unexpected error occurred: ${message}`,
        error: "UNEXPECTED_ERROR",
      } satisfies QuizActionResult,
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST JSON to this endpoint" });
}

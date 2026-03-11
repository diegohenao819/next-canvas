import { NextResponse } from "next/server";

import {
  exportCanvasQuiz,
  getCanvasErrorResponse,
} from "@/lib/canvas";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiToken?: string;
      canvasBaseUrl?: string;
      courseId?: string;
      quizId?: string;
      engine?: "classic" | "new";
    };

    if (!body.apiToken || !body.courseId || !body.quizId || !body.engine) {
      return NextResponse.json(
        {
          success: false,
          message: "API token, course id, quiz id and engine are required.",
          error: "MISSING_FIELDS",
        },
        { status: 400 },
      );
    }

    const exportedQuiz = await exportCanvasQuiz(
      {
        apiToken: body.apiToken,
        canvasBaseUrl: body.canvasBaseUrl,
      },
      body.courseId,
      body.quizId,
      body.engine,
    );

    return NextResponse.json({ success: true, export: exportedQuiz });
  } catch (error) {
    const canvasError = getCanvasErrorResponse(error);

    return NextResponse.json(
      {
        success: false,
        message: canvasError.message,
        error: "QUIZ_EXPORT_FAILED",
        details: canvasError.body,
      },
      { status: canvasError.status },
    );
  }
}

import { NextResponse } from "next/server";

import {
  getCanvasErrorResponse,
  listCanvasQuizzes,
} from "@/lib/canvas";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiToken?: string;
      canvasBaseUrl?: string;
      courseId?: string;
    };

    if (!body.apiToken || !body.courseId) {
      return NextResponse.json(
        {
          success: false,
          message: "API token and course id are required.",
          error: "MISSING_FIELDS",
        },
        { status: 400 },
      );
    }

    const result = await listCanvasQuizzes(
      {
        apiToken: body.apiToken,
        canvasBaseUrl: body.canvasBaseUrl,
      },
      body.courseId,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const canvasError = getCanvasErrorResponse(error);

    return NextResponse.json(
      {
        success: false,
        message: canvasError.message,
        error: "QUIZZES_FETCH_FAILED",
        details: canvasError.body,
      },
      { status: canvasError.status },
    );
  }
}

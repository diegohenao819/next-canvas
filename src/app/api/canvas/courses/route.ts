import { NextResponse } from "next/server";

import {
  getCanvasErrorResponse,
  listCanvasCourses,
} from "@/lib/canvas";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiToken?: string;
      canvasBaseUrl?: string;
    };

    if (!body.apiToken) {
      return NextResponse.json(
        {
          success: false,
          message: "API token is required.",
          error: "MISSING_API_TOKEN",
        },
        { status: 400 },
      );
    }

    const courses = await listCanvasCourses({
      apiToken: body.apiToken,
      canvasBaseUrl: body.canvasBaseUrl,
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    const canvasError = getCanvasErrorResponse(error);

    return NextResponse.json(
      {
        success: false,
        message: canvasError.message,
        error: "COURSES_FETCH_FAILED",
        details: canvasError.body,
      },
      { status: canvasError.status },
    );
  }
}

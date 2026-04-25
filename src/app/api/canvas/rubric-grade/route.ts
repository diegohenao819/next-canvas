import { NextResponse } from "next/server";

import {
  getCanvasErrorResponse,
  gradeCanvasSubmissionWithRubric,
  type RubricAssessmentCriterion,
} from "@/lib/canvas";

export async function POST(req: Request) {
  let body:
    | {
        apiToken?: string;
        canvasBaseUrl?: string;
        courseId?: string;
        assignmentId?: string;
        studentId?: string;
        postedGrade?: string;
        comment?: string;
        rubricAssessment?: RubricAssessmentCriterion[];
      }
    | undefined;

  try {
    body = (await req.json()) as NonNullable<typeof body>;

    if (!body.apiToken || !body.courseId || !body.assignmentId || !body.studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "API token, course id, assignment id and student id are required.",
          error: "MISSING_FIELDS",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.rubricAssessment)) {
      return NextResponse.json(
        {
          success: false,
          message: "Rubric assessment must be an array.",
          error: "INVALID_RUBRIC_ASSESSMENT",
        },
        { status: 400 },
      );
    }

    const result = await gradeCanvasSubmissionWithRubric(
      {
        apiToken: body.apiToken,
        canvasBaseUrl: body.canvasBaseUrl,
      },
      {
        courseId: body.courseId,
        assignmentId: body.assignmentId,
        studentId: body.studentId,
        postedGrade: body.postedGrade,
        comment: body.comment,
        rubricAssessment: body.rubricAssessment,
      },
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const canvasError = getCanvasErrorResponse(error);

    return NextResponse.json(
      {
        success: false,
        message: canvasError.message,
        error: "RUBRIC_GRADE_FAILED",
        details: canvasError.body,
        target: {
          courseId: typeof body?.courseId === "string" ? body.courseId : "",
          assignmentId:
            typeof body?.assignmentId === "string" ? body.assignmentId : "",
          studentId: typeof body?.studentId === "string" ? body.studentId : "",
          path:
            body?.courseId && body?.assignmentId && body?.studentId
              ? `/api/v1/courses/${body.courseId}/assignments/${body.assignmentId}/submissions/${body.studentId}`
              : "",
        },
      },
      { status: canvasError.status },
    );
  }
}

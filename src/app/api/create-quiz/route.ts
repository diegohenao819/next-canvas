import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { apiToken, courseId, quizTitle, questions } = await req.json();

    if (!apiToken || !courseId || !quizTitle || !questions) {
      return NextResponse.json(
        { ok: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    const canvasBaseUrl = "https://canvas.instructure.com/api/v1";

    // 1) Create quiz
    const quizData = {
      quiz: {
        title: quizTitle,
        description: quizTitle,
        published: false,
        allowed_attempts: 10
      }
    };

    const quizResponse = await fetch(
      `${canvasBaseUrl}/courses/${courseId}/quizzes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(quizData)
      }
    );

    const quizText = await quizResponse.text();
    if (!quizResponse.ok) {
      return NextResponse.json(
        { ok: false, error: "Error creating quiz", details: quizText },
        { status: quizResponse.status }
      );
    }

    const quizResult = JSON.parse(quizText);
    const quizId = quizResult.id;

    // 2) Add questions
    const parsedQuestions = Array.isArray(questions) ? questions : questions; // expect array
    for (const q of parsedQuestions) {
      const questionResponse = await fetch(
        `${canvasBaseUrl}/courses/${courseId}/quizzes/${quizId}/questions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ question: q })
        }
      );

      const qText = await questionResponse.text();
      if (!questionResponse.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "Error adding question",
            question: q?.question_name,
            details: qText
          },
          { status: questionResponse.status }
        );
      }
    }

    return NextResponse.json({ ok: true, quizId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// Optional: so GET doesn't confuse you during testing
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST JSON to this endpoint" });
}

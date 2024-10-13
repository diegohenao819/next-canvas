import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { apiToken, courseId, quizTitle, questions } = await request.json();

  if (!apiToken || !courseId || !quizTitle || !questions) {
    return NextResponse.json(
      { error: "Missing required data" },
      { status: 400 }
    );
  }

  const canvasBaseUrl = "https://canvas.instructure.com/api/v1";

  try {
    // Step 1: Create the quiz in Canvas
    const quizData = {
      quiz: {
        title: quizTitle,
        description: "This quiz was created automatically.",
        published: true,
        allowed_attempts: 1,
      },
    };

    const quizResponse = await axios.post(
      `${canvasBaseUrl}/courses/${courseId}/quizzes`,
      quizData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const quizId = quizResponse.data.id;
    console.log("Quiz created successfully with ID:", quizId);

    // Step 2: Add the questions to the created quiz
    for (const question of questions) {
      await axios.post(
        `${canvasBaseUrl}/courses/${courseId}/quizzes/${quizId}/questions`,
        { question },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Question added:", question.question_name);
    }

    return NextResponse.json({ message: "Quiz created successfully", quizId });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      {
        error: "Error creating quiz",
      },
      { status: 500 }
    );
  }
}

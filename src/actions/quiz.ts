"use server";

export type QuizActionResult = {
  success: boolean;
  message: string;
  quizId?: number;
  error?: string;
};

export async function createQuiz(
  formData: FormData,
): Promise<QuizActionResult> {
  const apiToken = formData.get("apiToken");
  const courseId = formData.get("courseId");
  const quizTitle = formData.get("quizTitle");
  const questions = formData.get("questions");

  if (!apiToken || !courseId || !quizTitle || !questions) {
    return {
      success: false,
      message: "Missing required fields. Please fill in all fields.",
      error: "MISSING_FIELDS",
    };
  }

  const canvasBaseUrl = "https://canvas.instructure.com/api/v1";

  try {
    // Validar y parsear las preguntas antes de hacer las llamadas a la API
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions as string);
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        return {
          success: false,
          message: "Questions must be a non-empty array in JSON format.",
          error: "INVALID_QUESTIONS_FORMAT",
        };
      }
    } catch {
      return {
        success: false,
        message:
          "Invalid JSON format for questions. Please check your JSON syntax.",
        error: "JSON_PARSE_ERROR",
      };
    }

    // Paso 1: Crear el quiz en Canvas usando fetch
    const quizData = {
      quiz: {
        title: quizTitle,
        description: quizTitle,
        published: false,
        allowed_attempts: 10,
      },
    };

    const quizResponse = await fetch(
      `${canvasBaseUrl}/courses/${courseId}/quizzes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      },
    );

    if (!quizResponse.ok) {
      const errorText = await quizResponse.text();
      return {
        success: false,
        message: `Failed to create quiz. Status: ${quizResponse.status}. ${errorText}`,
        error: "QUIZ_CREATION_FAILED",
      };
    }

    const quizResult = await quizResponse.json();
    const quizId = quizResult.id;
    console.log("Quiz created successfully with ID:", quizId);

    // Paso 2: Agregar las preguntas al quiz creado usando fetch
    let questionsAdded = 0;
    for (const question of parsedQuestions) {
      const questionResponse = await fetch(
        `${canvasBaseUrl}/courses/${courseId}/quizzes/${quizId}/questions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        },
      );

      if (!questionResponse.ok) {
        const errorText = await questionResponse.text();
        return {
          success: false,
          message: `Quiz created but failed to add question ${questionsAdded + 1}. Status: ${questionResponse.status}. ${errorText}`,
          error: "QUESTION_ADDITION_FAILED",
          quizId,
        };
      }

      questionsAdded++;
      console.log("Question added:", question.question_name);
    }

    return {
      success: true,
      message: `Quiz created successfully with ${questionsAdded} question(s)!`,
      quizId,
    };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: "UNEXPECTED_ERROR",
    };
  }
}

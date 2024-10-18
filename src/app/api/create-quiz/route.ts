"use server"; // Esto asegura que la acción solo se ejecuta en el servidor

export async function Post(formData: FormData): Promise<void> {
  const apiToken = formData.get("apiToken");
  const courseId = formData.get("courseId");
  const quizTitle = formData.get("quizTitle");
  const questions = formData.get("questions");

  if (!apiToken || !courseId || !quizTitle || !questions) {
    console.error("Missing required data");
    return;
  }

  const canvasBaseUrl = "https://canvas.instructure.com/api/v1";

  try {
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
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      }
    );

    if (!quizResponse.ok) {
      throw new Error('Error creating quiz');
    }

    const quizResult = await quizResponse.json();
    const quizId = quizResult.id;
    console.log("Quiz created successfully with ID:", quizId);

    // Paso 2: Agregar las preguntas al quiz creado usando fetch
    const parsedQuestions = JSON.parse(questions as string);

    for (const question of parsedQuestions) {
      const questionResponse = await fetch(
        `${canvasBaseUrl}/courses/${courseId}/quizzes/${quizId}/questions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
        }
      );

      if (!questionResponse.ok) {
        throw new Error('Error adding question');
      }

      console.log("Question added:", question.question_name);
    }
  } catch (error) {
    console.error("Error creating quiz:", error);
  }
}

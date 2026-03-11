"use server";

import {
  createQuizInCanvas,
  type QuizActionResult,
} from "@/lib/canvas";

export type { QuizActionResult } from "@/lib/canvas";

export async function createQuiz(formData: FormData): Promise<QuizActionResult> {
  return createQuizInCanvas(formData);
}

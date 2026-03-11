"use client";

import { useEffect, useMemo, useState } from "react";

import type { CanvasCourse, CanvasQuizExport, CanvasQuizListItem } from "@/lib/canvas";

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

type DownloadQuizPanelProps = {
  apiToken: string;
  canvasBaseUrl: string;
};

type ApiSuccess<T> = T & { success: true };
type ApiError = {
  success: false;
  message: string;
  details?: string;
};

export default function DownloadQuizPanel({
  apiToken,
  canvasBaseUrl,
}: DownloadQuizPanelProps) {
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [quizzes, setQuizzes] = useState<CanvasQuizListItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [quizExport, setQuizExport] = useState<CanvasQuizExport | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isLoadingExport, setIsLoadingExport] = useState(false);

  const isConnectionReady = apiToken.trim().length > 0;

  useEffect(() => {
    setCourses([]);
    setQuizzes([]);
    setSelectedCourseId("");
    setSelectedQuizId("");
    setQuizExport(null);
    setWarnings([]);
    setMessage(null);
  }, [apiToken, canvasBaseUrl]);

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  const formattedJson = useMemo(
    () => (quizExport ? JSON.stringify(quizExport, null, 2) : ""),
    [quizExport],
  );

  async function postJson<T>(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiSuccess<T> | ApiError;

    if (!response.ok || !data.success) {
      const message =
        "message" in data ? data.message : "Canvas request failed.";
      throw new Error(message);
    }

    return data;
  }

  async function handleLoadCourses() {
    if (!isConnectionReady) {
      setMessage({
        type: "error",
        text: "Add your Canvas API token first.",
      });
      return;
    }

    setIsLoadingCourses(true);
    setMessage(null);
    setWarnings([]);
    setQuizExport(null);
    setQuizzes([]);
    setSelectedCourseId("");
    setSelectedQuizId("");

    try {
      const data = await postJson<{ courses: CanvasCourse[] }>(
        "/api/canvas/courses",
        {
          apiToken,
          canvasBaseUrl,
        },
      );

      setCourses(data.courses);
      setMessage({
        type: "success",
        text:
          data.courses.length > 0
            ? `Loaded ${data.courses.length} course(s).`
            : "No courses were returned for this token.",
      });
    } catch (error) {
      setCourses([]);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load courses from Canvas.",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  }

  async function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedQuizId("");
    setQuizExport(null);
    setQuizzes([]);
    setWarnings([]);
    setMessage(null);

    if (!courseId) {
      return;
    }

    setIsLoadingQuizzes(true);

    try {
      const data = await postJson<{
        quizzes: CanvasQuizListItem[];
        warnings?: string[];
      }>("/api/canvas/quizzes", {
        apiToken,
        canvasBaseUrl,
        courseId,
      });

      setQuizzes(data.quizzes);
      setWarnings(data.warnings ?? []);
      setMessage({
        type: "success",
        text:
          data.quizzes.length > 0
            ? `Loaded ${data.quizzes.length} quiz item(s).`
            : "This course has no quizzes available through the Canvas APIs used here.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load quizzes from Canvas.",
      });
    } finally {
      setIsLoadingQuizzes(false);
    }
  }

  async function handleLoadExport() {
    if (!selectedCourseId || !selectedQuiz) {
      setMessage({
        type: "error",
        text: "Select a course and a quiz first.",
      });
      return;
    }

    setIsLoadingExport(true);
    setMessage(null);

    try {
      const data = await postJson<{ export: CanvasQuizExport }>(
        "/api/canvas/quiz-export",
        {
          apiToken,
          canvasBaseUrl,
          courseId: selectedCourseId,
          quizId: selectedQuiz.canvasId,
          engine: selectedQuiz.engine,
        },
      );

      setQuizExport(data.export);
      setMessage({
        type: "success",
        text: "Quiz JSON loaded. You can review it below or download it.",
      });
    } catch (error) {
      setQuizExport(null);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to export the selected quiz.",
      });
    } finally {
      setIsLoadingExport(false);
    }
  }

  async function handleQuizChange(quizId: string) {
    setSelectedQuizId(quizId);
    setQuizExport(null);

    if (!quizId) {
      return;
    }

    const quiz = quizzes.find((item) => item.id === quizId);

    if (!quiz || !selectedCourseId) {
      return;
    }

    setIsLoadingExport(true);
    setMessage(null);

    try {
      const data = await postJson<{ export: CanvasQuizExport }>(
        "/api/canvas/quiz-export",
        {
          apiToken,
          canvasBaseUrl,
          courseId: selectedCourseId,
          quizId: quiz.canvasId,
          engine: quiz.engine,
        },
      );

      setQuizExport(data.export);
      setMessage({
        type: "success",
        text: "Quiz JSON loaded. You can review it below or download it.",
      });
    } catch (error) {
      setQuizExport(null);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to export the selected quiz.",
      });
    } finally {
      setIsLoadingExport(false);
    }
  }

  function handleDownloadJson() {
    if (!quizExport) {
      return;
    }

    const quizTitle =
      typeof quizExport.quiz.title === "string"
        ? quizExport.quiz.title
        : `quiz-${quizExport.quizId}`;
    const safeName = quizTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const blob = new Blob([formattedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeName || "canvas-quiz"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Download quiz JSON
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Load your courses, choose a quiz, and export its quiz data, questions/items, answer data, and detected file resources.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleLoadCourses}
            disabled={isLoadingCourses || !isConnectionReady}
          >
            {isLoadingCourses ? "Loading courses..." : "Load courses"}
          </Button>
        </div>

        {!isConnectionReady && (
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            Add your Canvas API token in the connection panel above to start browsing courses.
          </div>
        )}

        {message && (
          <div
            className={`mt-4 rounded-md border p-4 ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="courseSelect">Course</Label>
            <Select
              id="courseSelect"
              className="mt-2"
              value={selectedCourseId}
              onChange={(event) => handleCourseChange(event.target.value)}
              disabled={!courses.length || isLoadingQuizzes}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.name || course.course_code || `Course ${course.id}`}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="quizSelect">Quiz</Label>
            <Select
              id="quizSelect"
              className="mt-2"
              value={selectedQuizId}
              onChange={(event) => void handleQuizChange(event.target.value)}
              disabled={!quizzes.length || isLoadingQuizzes}
            >
              <option value="">
                {isLoadingQuizzes ? "Loading quizzes..." : "Select a quiz"}
              </option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  [{quiz.engine === "classic" ? "Classic" : "New"}] {quiz.title}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={handleLoadExport}
            disabled={!selectedQuiz || isLoadingExport}
          >
            {isLoadingExport ? "Loading quiz JSON..." : "View JSON"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadJson}
            disabled={!quizExport}
          >
            Download JSON
          </Button>
        </div>
      </div>

      {quizExport && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Engine</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {quizExport.engine === "classic" ? "Classic quiz" : "New quiz"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Questions</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {quizExport.questions.length || quizExport.items.length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Groups</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {quizExport.questionGroups.length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Resources</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {quizExport.resources.length}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="quizJsonPreview">Quiz JSON preview</Label>
            <Textarea
              id="quizJsonPreview"
              className="mt-2 min-h-[32rem] font-mono text-xs"
              value={formattedJson}
              readOnly
            />
          </div>
        </div>
      )}
    </section>
  );
}

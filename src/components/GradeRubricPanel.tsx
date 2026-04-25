"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  CanvasAssignment,
  CanvasCourse,
  CanvasRubricRating,
  RubricAssessmentCriterion,
} from "@/lib/canvas";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

type GradeRubricPanelProps = {
  apiToken: string;
  canvasBaseUrl: string;
};

type ApiSuccess<T> = T & { success: true };
type ApiError = {
  success: false;
  message: string;
  details?: string;
  target?: {
    courseId?: string;
    assignmentId?: string;
    studentId?: string;
    path?: string;
  };
};

type CriterionDraft = {
  ratingId: string;
  points: string;
  comments: string;
};

class ApiRequestError extends Error {
  details?: string;
  target?: ApiError["target"];

  constructor(message: string, details?: string, target?: ApiError["target"]) {
    super(message);
    this.name = "ApiRequestError";
    this.details = details;
    this.target = target;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error instanceof ApiRequestError) {
    const lines = [error.message];

    if (error.details?.trim()) {
      lines.push(`Canvas details: ${error.details.trim()}`);
    }

    if (error.target?.path) {
      lines.push(`Canvas path: ${error.target.path}`);
    }

    return lines.join("\n");
  }

  return error.message;
}

export default function GradeRubricPanel({
  apiToken,
  canvasBaseUrl,
}: GradeRubricPanelProps) {
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [postedGrade, setPostedGrade] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [criteriaDraft, setCriteriaDraft] = useState<Record<string, CriterionDraft>>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConnectionReady = apiToken.trim().length > 0;

  useEffect(() => {
    setCourses([]);
    setAssignments([]);
    setSelectedCourseId("");
    setSelectedAssignmentId("");
    setStudentId("");
    setPostedGrade("");
    setGeneralComment("");
    setCriteriaDraft({});
    setMessage(null);
  }, [apiToken, canvasBaseUrl]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => String(assignment.id) === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId],
  );

  const rubricCriteria = useMemo(
    () => selectedAssignment?.rubric ?? [],
    [selectedAssignment],
  );

  const rubricTotal = useMemo(
    () =>
      rubricCriteria.reduce((total, criterion) => {
        const points = Number(criteriaDraft[criterion.id]?.points);
        return Number.isFinite(points) ? total + points : total;
      }, 0),
    [criteriaDraft, rubricCriteria],
  );

  const hasRubricValues = rubricCriteria.some((criterion) => {
    const draft = criteriaDraft[criterion.id];
    return Boolean(draft?.points || draft?.ratingId || draft?.comments);
  });

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
      const details = "details" in data ? data.details : undefined;
      const target = "target" in data ? data.target : undefined;

      throw new ApiRequestError(message, details, target);
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
    setAssignments([]);
    setSelectedCourseId("");
    setSelectedAssignmentId("");

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
        text: getErrorMessage(error, "Failed to load courses from Canvas."),
      });
    } finally {
      setIsLoadingCourses(false);
    }
  }

  async function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedAssignmentId("");
    setAssignments([]);
    setCriteriaDraft({});
    setMessage(null);

    if (!courseId) {
      return;
    }

    setIsLoadingAssignments(true);

    try {
      const data = await postJson<{ assignments: CanvasAssignment[] }>(
        "/api/canvas/assignments",
        {
          apiToken,
          canvasBaseUrl,
          courseId,
        },
      );

      setAssignments(data.assignments);
      setMessage({
        type: "success",
        text:
          data.assignments.length > 0
            ? `Loaded ${data.assignments.length} assignment(s).`
            : "This course has no assignments available through Canvas.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Failed to load assignments from Canvas."),
      });
    } finally {
      setIsLoadingAssignments(false);
    }
  }

  function handleAssignmentChange(assignmentId: string) {
    const assignment = assignments.find((item) => String(item.id) === assignmentId);
    const nextDraft: Record<string, CriterionDraft> = {};

    for (const criterion of assignment?.rubric ?? []) {
      nextDraft[criterion.id] = {
        ratingId: "",
        points: "",
        comments: "",
      };
    }

    setSelectedAssignmentId(assignmentId);
    setCriteriaDraft(nextDraft);
    setPostedGrade("");
    setMessage(null);
  }

  function updateCriterion(criterionId: string, patch: Partial<CriterionDraft>) {
    setCriteriaDraft((current) => ({
      ...current,
      [criterionId]: {
        ...(current[criterionId] ?? {
          ratingId: "",
          points: "",
          comments: "",
        }),
        ...patch,
      },
    }));
  }

  function handleRatingChange(
    criterionId: string,
    ratingId: string,
    ratings?: CanvasRubricRating[],
  ) {
    const rating = ratings?.find((item) => item.id === ratingId);
    const points =
      typeof rating?.points === "number" ? String(rating.points) : undefined;

    updateCriterion(criterionId, {
      ratingId,
      ...(points !== undefined ? { points } : {}),
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCourseId || !selectedAssignmentId || !studentId.trim()) {
      setMessage({
        type: "error",
        text: "Select a course, select an assignment, and add a student id.",
      });
      return;
    }

    const rubricAssessment: RubricAssessmentCriterion[] = rubricCriteria.map((criterion) => ({
      criterionId: criterion.id,
      points: criteriaDraft[criterion.id]?.points,
      ratingId: criteriaDraft[criterion.id]?.ratingId,
      comments: criteriaDraft[criterion.id]?.comments,
    }));
    const gradeToPost =
      postedGrade.trim() || (hasRubricValues ? String(rubricTotal) : "");

    setIsSubmitting(true);
    setMessage(null);

    try {
      await postJson<{ submission: Record<string, unknown> }>(
        "/api/canvas/rubric-grade",
        {
          apiToken,
          canvasBaseUrl,
          courseId: selectedCourseId,
          assignmentId: selectedAssignmentId,
          studentId: studentId.trim(),
          postedGrade: gradeToPost,
          comment: generalComment,
          rubricAssessment,
        },
      );

      setMessage({
        type: "success",
        text: "Rubric assessment sent to Canvas for this submission.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Failed to send the rubric assessment to Canvas.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Grade with rubric
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select an assignment with a Canvas rubric, choose ratings, and post the assessment to one student submission.
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
            Add your Canvas API token in the connection panel above to start grading.
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
            <div className="space-y-1 text-sm font-medium">
              {message.text.split("\n").map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="rubricCourseSelect">Course</Label>
              <Select
                id="rubricCourseSelect"
                className="mt-2"
                value={selectedCourseId}
                onChange={(event) => void handleCourseChange(event.target.value)}
                disabled={!courses.length || isLoadingAssignments}
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
              <Label htmlFor="rubricAssignmentSelect">Assignment</Label>
              <Select
                id="rubricAssignmentSelect"
                className="mt-2"
                value={selectedAssignmentId}
                onChange={(event) => handleAssignmentChange(event.target.value)}
                disabled={!assignments.length || isLoadingAssignments}
              >
                <option value="">
                  {isLoadingAssignments ? "Loading assignments..." : "Select an assignment"}
                </option>
                {assignments.map((assignment) => {
                  const rubricCount = assignment.rubric?.length ?? 0;

                  return (
                    <option
                      key={assignment.id}
                      value={String(assignment.id)}
                      disabled={rubricCount === 0}
                    >
                      {assignment.name || `Assignment ${assignment.id}`}
                      {rubricCount > 0 ? ` (${rubricCount} criteria)` : " (no rubric)"}
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                className="mt-2"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                disabled={!selectedAssignment || isSubmitting}
                placeholder="Canvas user id"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use the Canvas user id for the student, not the submission id or
                login email.
              </p>
            </div>
            <div>
              <Label htmlFor="postedGrade">Posted grade</Label>
              <Input
                id="postedGrade"
                className="mt-2"
                value={postedGrade}
                onChange={(event) => setPostedGrade(event.target.value)}
                disabled={!selectedAssignment || isSubmitting}
                placeholder={hasRubricValues ? String(rubricTotal) : "Optional"}
              />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Rubric total
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {rubricTotal}
                {typeof selectedAssignment?.points_possible === "number"
                  ? ` / ${selectedAssignment.points_possible}`
                  : ""}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="generalComment">Submission comment</Label>
            <Textarea
              id="generalComment"
              className="mt-2 min-h-24"
              value={generalComment}
              onChange={(event) => setGeneralComment(event.target.value)}
              disabled={!selectedAssignment || isSubmitting}
              placeholder="Optional general comment for the student"
            />
          </div>

          {selectedAssignment && rubricCriteria.length > 0 && (
            <div className="space-y-4">
              {rubricCriteria.map((criterion) => {
                const draft = criteriaDraft[criterion.id] ?? {
                  ratingId: "",
                  points: "",
                  comments: "",
                };

                return (
                  <div
                    key={criterion.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {criterion.description || criterion.id}
                        </h3>
                        {criterion.long_description && (
                          <p className="mt-1 text-sm text-slate-600">
                            {criterion.long_description}
                          </p>
                        )}
                      </div>
                      {typeof criterion.points === "number" && (
                        <p className="text-sm font-medium text-slate-600">
                          {criterion.points} pts
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr,0.5fr,1.2fr]">
                      <div>
                        <Label htmlFor={`rating-${criterion.id}`}>Rating</Label>
                        <Select
                          id={`rating-${criterion.id}`}
                          className="mt-2"
                          value={draft.ratingId}
                          onChange={(event) =>
                            handleRatingChange(
                              criterion.id,
                              event.target.value,
                              criterion.ratings,
                            )
                          }
                          disabled={isSubmitting}
                        >
                          <option value="">Select a rating</option>
                          {(criterion.ratings ?? []).map((rating) => (
                            <option key={rating.id} value={rating.id}>
                              {rating.description || rating.id}
                              {typeof rating.points === "number"
                                ? ` - ${rating.points} pts`
                                : ""}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`points-${criterion.id}`}>Points</Label>
                        <Input
                          id={`points-${criterion.id}`}
                          className="mt-2"
                          type="number"
                          step="any"
                          value={draft.points}
                          onChange={(event) =>
                            updateCriterion(criterion.id, {
                              points: event.target.value,
                            })
                          }
                          disabled={isSubmitting}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`comments-${criterion.id}`}>Comments</Label>
                        <Textarea
                          id={`comments-${criterion.id}`}
                          className="mt-2 min-h-20"
                          value={draft.comments}
                          onChange={(event) =>
                            updateCriterion(criterion.id, {
                              comments: event.target.value,
                            })
                          }
                          disabled={isSubmitting}
                          placeholder="Optional criterion comment"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !isConnectionReady ||
              !selectedAssignment ||
              !studentId.trim()
            }
          >
            {isSubmitting ? "Sending assessment..." : "Submit rubric grade"}
          </Button>
        </form>
      </div>
    </section>
  );
}

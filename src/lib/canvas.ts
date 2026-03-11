export const DEFAULT_CANVAS_BASE_URL = "https://canvas.instructure.com";

export type QuizActionResult = {
  success: boolean;
  message: string;
  quizId?: number;
  error?: string;
};

export type CanvasCourse = Record<string, unknown> & {
  id: number;
  name?: string;
  course_code?: string;
};

export type CanvasClassicQuiz = Record<string, unknown> & {
  id: number;
  title?: string;
};

export type CanvasNewQuiz = Record<string, unknown> & {
  id: string | number;
  title?: string;
};

export type CanvasQuizQuestion = Record<string, unknown> & {
  id: number;
  quiz_group_id?: number;
};

export type CanvasQuizGroup = Record<string, unknown> & {
  id: number;
};

export type CanvasQuizItem = Record<string, unknown>;

export type CanvasFile = Record<string, unknown> & {
  id: number;
  display_name?: string;
  filename?: string;
  url?: string;
};

export type CanvasQuizListItem = {
  id: string;
  canvasId: string;
  title: string;
  engine: "classic" | "new";
  raw: CanvasClassicQuiz | CanvasNewQuiz;
};

export type CanvasQuizExport = {
  exportedAt: string;
  canvasBaseUrl: string;
  engine: "classic" | "new";
  courseId: string;
  quizId: string;
  course: CanvasCourse | null;
  quiz: CanvasClassicQuiz | CanvasNewQuiz;
  questions: CanvasQuizQuestion[];
  questionGroups: CanvasQuizGroup[];
  items: CanvasQuizItem[];
  resources: CanvasFile[];
  resourceFileIds: number[];
};

type CanvasClientConfig = {
  apiToken: string;
  canvasBaseUrl?: string;
};

class CanvasApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "CanvasApiError";
    this.status = status;
    this.body = body;
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function normalizeCanvasBaseUrl(baseUrl?: string) {
  const trimmed = baseUrl?.trim();

  if (!trimmed) {
    return DEFAULT_CANVAS_BASE_URL;
  }

  const withProtocol = isHttpUrl(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function resolveCanvasUrl(canvasBaseUrl: string, pathOrUrl: string) {
  if (isHttpUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${canvasBaseUrl}${path}`;
}

function getNextLink(linkHeader: string | null) {
  if (!linkHeader) {
    return null;
  }

  const links = linkHeader.split(",");

  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match?.[2] === "next") {
      return match[1];
    }
  }

  return null;
}

async function requestCanvas(
  pathOrUrl: string,
  config: CanvasClientConfig,
  init?: RequestInit,
) {
  const canvasBaseUrl = normalizeCanvasBaseUrl(config.canvasBaseUrl);
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${config.apiToken}`);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(resolveCanvasUrl(canvasBaseUrl, pathOrUrl), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new CanvasApiError(
      `Canvas request failed with status ${response.status}`,
      response.status,
      body,
    );
  }

  return response;
}

async function requestCanvasJson<T>(
  pathOrUrl: string,
  config: CanvasClientConfig,
  init?: RequestInit,
) {
  const response = await requestCanvas(pathOrUrl, config, init);
  return (await response.json()) as T;
}

async function requestCanvasText(
  pathOrUrl: string,
  config: CanvasClientConfig,
  init?: RequestInit,
) {
  const response = await requestCanvas(pathOrUrl, config, init);
  return response.text();
}

async function requestPaginatedCanvasJson<T>(
  pathOrUrl: string,
  config: CanvasClientConfig,
) {
  const items: T[] = [];
  let nextUrl: string | null = pathOrUrl;

  while (nextUrl) {
    const response = await requestCanvas(nextUrl, config);
    const pageItems = (await response.json()) as T[];
    items.push(...pageItems);
    nextUrl = getNextLink(response.headers.get("link"));
  }

  return items;
}

function parseQuestionsInput(questions: string) {
  const parsedQuestions = JSON.parse(questions) as unknown;

  if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
    throw new Error("Questions must be a non-empty array in JSON format.");
  }

  return parsedQuestions;
}

export async function createQuizInCanvas(
  formData: FormData,
): Promise<QuizActionResult> {
  const apiToken = formData.get("apiToken");
  const courseId = formData.get("courseId");
  const quizTitle = formData.get("quizTitle");
  const questions = formData.get("questions");
  const canvasBaseUrl = formData.get("canvasBaseUrl");

  if (!apiToken || !courseId || !quizTitle || !questions) {
    return {
      success: false,
      message: "Missing required fields. Please fill in all fields.",
      error: "MISSING_FIELDS",
    };
  }

  let parsedQuestions: unknown[];

  try {
    parsedQuestions = parseQuestionsInput(String(questions));
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Invalid JSON format for questions.",
      error: "INVALID_QUESTIONS_FORMAT",
    };
  }

  const config = {
    apiToken: String(apiToken),
    canvasBaseUrl: String(canvasBaseUrl || ""),
  };

  try {
    const quizResult = await requestCanvasJson<CanvasClassicQuiz>(
      `/api/v1/courses/${courseId}/quizzes`,
      config,
      {
        method: "POST",
        body: JSON.stringify({
          quiz: {
            title: quizTitle,
            description: quizTitle,
            published: false,
            allowed_attempts: 10,
          },
        }),
      },
    );

    const quizId = Number(quizResult.id);

    if (!quizId) {
      return {
        success: false,
        message: "Quiz created but Canvas did not return a quiz id.",
        error: "MISSING_QUIZ_ID",
      };
    }

    let questionsAdded = 0;

    for (const question of parsedQuestions) {
      await requestCanvasJson(
        `/api/v1/courses/${courseId}/quizzes/${quizId}/questions`,
        config,
        {
          method: "POST",
          body: JSON.stringify({ question }),
        },
      );

      questionsAdded += 1;
    }

    return {
      success: true,
      message: `Quiz created successfully with ${questionsAdded} question(s)!`,
      quizId,
    };
  } catch (error) {
    if (error instanceof CanvasApiError) {
      return {
        success: false,
        message: `${error.message}. ${error.body}`,
        error: "CANVAS_API_ERROR",
      };
    }

    return {
      success: false,
      message: `An unexpected error occurred: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      error: "UNEXPECTED_ERROR",
    };
  }
}

export async function listCanvasCourses(config: CanvasClientConfig) {
  return requestPaginatedCanvasJson<CanvasCourse>(
    "/api/v1/courses?per_page=100",
    config,
  );
}

async function listClassicQuizzes(config: CanvasClientConfig, courseId: string) {
  return requestPaginatedCanvasJson<CanvasClassicQuiz>(
    `/api/v1/courses/${courseId}/quizzes?per_page=100`,
    config,
  );
}

async function listNewQuizzes(config: CanvasClientConfig, courseId: string) {
  return requestPaginatedCanvasJson<CanvasNewQuiz>(
    `/api/quiz/v1/courses/${courseId}/quizzes?per_page=100`,
    config,
  );
}

export async function listCanvasQuizzes(
  config: CanvasClientConfig,
  courseId: string,
) {
  const [classicResult, newResult] = await Promise.allSettled([
    listClassicQuizzes(config, courseId),
    listNewQuizzes(config, courseId),
  ]);

  const warnings: string[] = [];
  const classicQuizzes =
    classicResult.status === "fulfilled" ? classicResult.value : [];
  const newQuizzes = newResult.status === "fulfilled" ? newResult.value : [];

  if (classicResult.status === "rejected" && newResult.status === "rejected") {
    throw classicResult.reason instanceof Error
      ? classicResult.reason
      : new Error("Unable to load quizzes from Canvas.");
  }

  if (classicResult.status === "rejected") {
    warnings.push("Classic quizzes could not be loaded from Canvas.");
  }

  if (newResult.status === "rejected") {
    warnings.push("New quizzes could not be loaded from Canvas.");
  }

  const quizzes: CanvasQuizListItem[] = [
    ...classicQuizzes.map((quiz) => ({
      id: `classic-${quiz.id}`,
      canvasId: String(quiz.id),
      title: String(quiz.title || `Quiz ${quiz.id}`),
      engine: "classic" as const,
      raw: quiz,
    })),
    ...newQuizzes.map((quiz) => ({
      id: `new-${quiz.id}`,
      canvasId: String(quiz.id),
      title: String(quiz.title || `New Quiz ${quiz.id}`),
      engine: "new" as const,
      raw: quiz,
    })),
  ].sort((a, b) => a.title.localeCompare(b.title));

  return { quizzes, warnings };
}

async function getCanvasCourse(config: CanvasClientConfig, courseId: string) {
  return requestCanvasJson<CanvasCourse>(
    `/api/v1/courses/${courseId}`,
    config,
  );
}

async function getClassicQuiz(
  config: CanvasClientConfig,
  courseId: string,
  quizId: string,
) {
  return requestCanvasJson<CanvasClassicQuiz>(
    `/api/v1/courses/${courseId}/quizzes/${quizId}`,
    config,
  );
}

async function getNewQuiz(
  config: CanvasClientConfig,
  courseId: string,
  quizId: string,
) {
  return requestCanvasJson<CanvasNewQuiz>(
    `/api/quiz/v1/courses/${courseId}/quizzes/${quizId}`,
    config,
  );
}

async function listClassicQuizQuestions(
  config: CanvasClientConfig,
  courseId: string,
  quizId: string,
) {
  return requestPaginatedCanvasJson<CanvasQuizQuestion>(
    `/api/v1/courses/${courseId}/quizzes/${quizId}/questions?per_page=100`,
    config,
  );
}

async function getClassicQuizGroup(
  config: CanvasClientConfig,
  courseId: string,
  quizId: string,
  groupId: number,
) {
  return requestCanvasJson<CanvasQuizGroup>(
    `/api/v1/courses/${courseId}/quizzes/${quizId}/groups/${groupId}`,
    config,
  );
}

async function listNewQuizItems(
  config: CanvasClientConfig,
  courseId: string,
  quizId: string,
) {
  return requestPaginatedCanvasJson<CanvasQuizItem>(
    `/api/quiz/v1/courses/${courseId}/quizzes/${quizId}/items?per_page=100`,
    config,
  );
}

function collectStrings(value: unknown, strings: string[] = []) {
  if (typeof value === "string") {
    strings.push(value);
    return strings;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, strings);
    }
    return strings;
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      collectStrings(nestedValue, strings);
    }
  }

  return strings;
}

function extractFileIdsFromPayload(payload: unknown) {
  const strings = collectStrings(payload);
  const fileIds = new Set<number>();
  const patterns = [
    /\/files\/(\d+)(?:\/|["'?&#]|$)/g,
    /\/api\/v1\/files\/(\d+)(?:\/|["'?&#]|$)/g,
  ];

  for (const text of strings) {
    for (const pattern of patterns) {
      const globalPattern = new RegExp(pattern.source, pattern.flags);
      let match = globalPattern.exec(text);

      while (match) {
        const fileId = Number(match[1]);

        if (Number.isFinite(fileId)) {
          fileIds.add(fileId);
        }

        match = globalPattern.exec(text);
      }
    }
  }

  return Array.from(fileIds).sort((a, b) => a - b);
}

async function getCanvasFile(config: CanvasClientConfig, fileId: number) {
  return requestCanvasJson<CanvasFile>(`/api/v1/files/${fileId}`, config);
}

export async function exportCanvasQuiz(
  config: CanvasClientConfig,
  courseId: string,
  quizId: string,
  engine: "classic" | "new",
): Promise<CanvasQuizExport> {
  const coursePromise = getCanvasCourse(config, courseId).catch(() => null);

  if (engine === "classic") {
    const [course, quiz, questions] = await Promise.all([
      coursePromise,
      getClassicQuiz(config, courseId, quizId),
      listClassicQuizQuestions(config, courseId, quizId),
    ]);

    const groupIds = Array.from(
      new Set(
        questions
          .map((question) => question.quiz_group_id)
          .filter((groupId): groupId is number => Number.isFinite(groupId)),
      ),
    );

    const questionGroups = (
      await Promise.allSettled(
        groupIds.map((groupId) =>
          getClassicQuizGroup(config, courseId, quizId, groupId),
        ),
      )
    )
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<CanvasQuizGroup> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    const fileIds = extractFileIdsFromPayload({
      quiz,
      questions,
      questionGroups,
    });

    const resources = (
      await Promise.allSettled(
        fileIds.map((fileId) => getCanvasFile(config, fileId)),
      )
    )
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<CanvasFile> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    return {
      exportedAt: new Date().toISOString(),
      canvasBaseUrl: normalizeCanvasBaseUrl(config.canvasBaseUrl),
      engine,
      courseId,
      quizId,
      course,
      quiz,
      questions,
      questionGroups,
      items: [],
      resources,
      resourceFileIds: fileIds,
    };
  }

  const [course, quiz, items] = await Promise.all([
    coursePromise,
    getNewQuiz(config, courseId, quizId),
    listNewQuizItems(config, courseId, quizId),
  ]);

  const fileIds = extractFileIdsFromPayload({ quiz, items });
  const resources = (
    await Promise.allSettled(fileIds.map((fileId) => getCanvasFile(config, fileId)))
  )
    .filter(
      (result): result is PromiseFulfilledResult<CanvasFile> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  return {
    exportedAt: new Date().toISOString(),
    canvasBaseUrl: normalizeCanvasBaseUrl(config.canvasBaseUrl),
    engine,
    courseId,
    quizId,
    course,
    quiz,
    questions: [],
    questionGroups: [],
    items,
    resources,
    resourceFileIds: fileIds,
  };
}

export function getCanvasErrorResponse(error: unknown) {
  if (error instanceof CanvasApiError) {
    return {
      status: error.status,
      body: error.body,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: "",
      message: error.message,
    };
  }

  return {
    status: 500,
    body: "",
    message: "Unknown Canvas error.",
  };
}

export async function createQuizFromJsonRequest(
  body: Record<string, unknown>,
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) {
      formData.set(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    }
  }

  if (Array.isArray(body.questions)) {
    formData.set("questions", JSON.stringify(body.questions));
  }

  return createQuizInCanvas(formData);
}

export async function getCanvasHealth(config: CanvasClientConfig) {
  return requestCanvasText("/api/v1/users/self", config);
}

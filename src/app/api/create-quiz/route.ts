import { NextResponse } from "next/server";

import { createQuizFromJsonRequest } from "@/lib/canvas";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const result = await createQuizFromJsonRequest(body);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `An unexpected error occurred: ${
          error instanceof Error ? error.message : "Unknown server error"
        }`,
        error: "UNEXPECTED_ERROR",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST JSON to this endpoint" });
}

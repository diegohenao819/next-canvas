"use client";

import { createQuiz } from "@/actions/quiz";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type CreateQuizFormProps = {
  apiToken: string;
  canvasBaseUrl: string;
};

const CreateQuizForm = ({ apiToken, canvasBaseUrl }: CreateQuizFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isConnectionReady = apiToken.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isConnectionReady) {
      setMessage({
        type: "error",
        text: "Add your Canvas API token in the connection panel before creating a quiz.",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    formData.set("apiToken", apiToken);
    formData.set("canvasBaseUrl", canvasBaseUrl);

    try {
      const result = await createQuiz(formData);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Reset form on success
        form.reset();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {message && (
        <div
          className={`p-4 rounded-md border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
          role="alert"
        >
          <p className="font-medium">
            {message.type === "success" ? "Success!" : "Error"}
          </p>
          <p className="text-sm mt-1">{message.text}</p>
        </div>
      )}

      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
        {isConnectionReady ? (
          <p>Connection ready. This quiz will be created using the token from the top panel.</p>
        ) : (
          <p>Add a Canvas API token in the connection panel to enable quiz creation.</p>
        )}
      </div>

      <div>
        <Label htmlFor="courseId">Course ID</Label>
        <Input
          type="text"
          id="courseId"
          name="courseId"
          className="mt-2"
          required
          disabled={isLoading || !isConnectionReady}
          placeholder="Enter the Course ID"
        />
      </div>

      <div>
        <Label htmlFor="quizTitle">Quiz Title</Label>
        <Input
          type="text"
          id="quizTitle"
          name="quizTitle"
          className="mt-2"
          required
          disabled={isLoading || !isConnectionReady}
          placeholder="Enter the Quiz Title"
        />
      </div>

      <div>
        <Label htmlFor="questions">Questions (JSON Format)</Label>
        <Textarea
          id="questions"
          name="questions"
          className="mt-2 min-h-64 font-mono"
          required
          disabled={isLoading || !isConnectionReady}
          placeholder='Enter the questions JSON (e.g. [{"question_name":"Question 1","question_text":"What is 2 + 2?","question_type":"multiple_choice_question","answers":[{"text":"4","weight":100},{"text":"5","weight":0}]}])'
        />
        <p className="mt-2 text-xs text-slate-500">
          The JSON should contain the question payloads expected by the Canvas quiz questions API.
        </p>
      </div>

      <Button type="submit" disabled={isLoading || !isConnectionReady}>
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating Quiz...
          </>
        ) : (
          "Create Quiz"
        )}
      </Button>
    </form>
  );
};

export default CreateQuizForm;

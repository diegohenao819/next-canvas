"use client";

import { useState } from "react";

import { DEFAULT_CANVAS_BASE_URL } from "@/lib/canvas";

import CreateQuizForm from "./CreateQuizForm";
import DownloadQuizPanel from "./DownloadQuizPanel";
import GradeRubricPanel from "./GradeRubricPanel";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const tabs = [
  {
    id: "create",
    label: "Create quiz",
    description: "Build and publish quiz shells in Canvas from raw question JSON.",
  },
  {
    id: "download",
    label: "Download quiz",
    description: "Browse your Canvas courses and export existing quizzes as JSON.",
  },
  {
    id: "grade",
    label: "Grade rubric",
    description: "Post rubric ratings, points, and feedback to a Canvas submission.",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CanvasWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>("create");
  const [apiToken, setApiToken] = useState("");
  const [canvasBaseUrl, setCanvasBaseUrl] = useState(DEFAULT_CANVAS_BASE_URL);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">
              Canvas Quiz Console
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Create quizzes and export them back to JSON
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use one connection to work across both flows: create new Canvas quizzes or inspect existing ones and download their full JSON payload.
                </p>
              </div>
              <nav className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5 md:grid-cols-[2fr,1fr]">
            <div>
              <Label htmlFor="apiToken">Canvas API token</Label>
              <Input
                id="apiToken"
                type="password"
                className="mt-2 bg-white"
                value={apiToken}
                onChange={(event) => setApiToken(event.target.value)}
                placeholder="Paste your Canvas API token"
              />
            </div>
            <div>
              <Label htmlFor="canvasBaseUrl">Canvas base URL</Label>
              <Input
                id="canvasBaseUrl"
                type="text"
                className="mt-2 bg-white"
                value={canvasBaseUrl}
                onChange={(event) => setCanvasBaseUrl(event.target.value)}
                placeholder="https://canvas.instructure.com"
              />
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-slate-600">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>
        </section>

        {activeTab === "create" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <CreateQuizForm
              apiToken={apiToken}
              canvasBaseUrl={canvasBaseUrl}
            />
          </section>
        ) : activeTab === "download" ? (
          <DownloadQuizPanel
            apiToken={apiToken}
            canvasBaseUrl={canvasBaseUrl}
          />
        ) : (
          <GradeRubricPanel
            apiToken={apiToken}
            canvasBaseUrl={canvasBaseUrl}
          />
        )}
      </div>
    </main>
  );
}

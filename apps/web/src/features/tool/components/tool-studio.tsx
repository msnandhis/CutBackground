"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@repo/ui";
import { authClient } from "@repo/core/auth/client";
import { toolConfig } from "@config/tool";
import { routes } from "@/lib/routes";
import type { ApiErrorPayload, ToolJobDto } from "../lib/types";

type StudioState = "empty" | "uploading" | "processing" | "result" | "error";

export function ToolStudio() {
  const [state, setState] = useState<StudioState>("empty");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [job, setJob] = useState<ToolJobDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (state !== "uploading" && state !== "processing") {
      setProgressValue(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setProgressValue((current) => {
        const ceiling = state === "uploading" ? 72 : 94;
        const next = current + (state === "uploading" ? 8 : 4);
        return Math.min(next, ceiling);
      });
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state]);

  useEffect(() => {
    if (
      !job ||
      (job.status !== "pending" &&
        job.status !== "uploading" &&
        job.status !== "processing")
    ) {
      return;
    }

    let pollErrors = 0;
    const maxPollErrors = 5;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/background-remover/jobs/${job.id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          pollErrors++;
          if (pollErrors >= maxPollErrors) {
            setState("error");
            setErrorMessage(
              "Unable to check job status. Please refresh the page or check your dashboard.",
            );
            window.clearInterval(intervalId);
          }
          return;
        }

        pollErrors = 0;
        const payload = (await response.json()) as { job: ToolJobDto };
        setJob(payload.job);

        if (payload.job.status === "succeeded") {
          setProgressValue(100);
          setState("result");
        }

        if (payload.job.status === "failed") {
          setState("error");
          setErrorMessage(payload.job.errorMessage || "Processing failed.");
        }

        if (payload.job.status === "canceled") {
          setState("error");
          setErrorMessage("This job was canceled before completion.");
        }
      } catch {
        pollErrors++;
        if (pollErrors >= maxPollErrors) {
          setState("error");
          setErrorMessage(
            "Network error while checking job status. Please refresh the page.",
          );
          window.clearInterval(intervalId);
        }
      }
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [job]);

  function resetStudio() {
    setState("empty");
    setJob(null);
    setErrorMessage(null);
    setProgressValue(0);
    idempotencyKeyRef.current = null;
  }

  function selectFile(file: File | null) {
    resetStudio();
    setSelectedFile(file);
    idempotencyKeyRef.current = file ? globalThis.crypto.randomUUID() : null;
  }

  async function handleSubmit() {
    if (!selectedFile) {
      setErrorMessage("Choose an image before starting the tool.");
      setState("error");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setErrorMessage(null);
    setState("uploading");
    setProgressValue(18);

    const response = await fetch("/api/background-remover/jobs", {
      method: "POST",
      headers: idempotencyKeyRef.current
        ? {
            "Idempotency-Key": idempotencyKeyRef.current,
          }
        : undefined,
      body: formData,
    });

    const payload = (await response.json()) as
      | { job?: ToolJobDto }
      | ApiErrorPayload;
    const jobPayload = "job" in payload ? payload.job : undefined;

    if (!response.ok || !jobPayload) {
      setState("error");
      setErrorMessage(
        "error" in payload
          ? payload.error?.message || "Unable to create the tool job."
          : "Unable to create the tool job.",
      );
      return;
    }

    setJob(jobPayload);

    if (jobPayload.status === "succeeded") {
      setProgressValue(100);
      setState("result");
      return;
    }

    if (jobPayload.status === "failed") {
      setState("error");
      setErrorMessage(jobPayload.errorMessage || "Processing failed.");
      return;
    }

    setProgressValue(78);
    setState("processing");
  }

  const uploadHint = selectedFile
    ? `Selected ${selectedFile.name}`
    : `Accepts ${toolConfig.input.acceptedFormats.join(", ")} up to ${toolConfig.input.maxFileSizeMB}MB`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          className={`rounded-[1.75rem] border border-dashed p-6 transition-colors ${
            isDragging
              ? "border-brand-magenta bg-brand-magenta/5"
              : "border-neutral-200 bg-neutral-50"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          {!sessionData?.user && !isSessionPending ? (
            <div className="rounded-[1.5rem] bg-amber-50 p-6 text-amber-950">
              <p className="font-heading text-2xl font-bold">
                Sign in to run the tool
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Background removal now creates real jobs, outputs, and dashboard
                history, so an authenticated workspace session is required.
              </p>
              <div className="mt-6">
                <Link href={routes.login}>
                  <Button>Sign in</Button>
                </Link>
              </div>
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept={toolConfig.input.acceptedFormats.join(",")}
            data-testid="tool-file-input"
            className="hidden"
            onChange={(event) => {
              selectFile(event.target.files?.[0] ?? null);
            }}
          />

          {state === "empty" ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-magenta shadow-sm">
                <span className="text-2xl">+</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                Drop an image or browse your files
              </h3>
              <p className="mt-3 text-neutral-600">
                Upload a product, portrait, or marketing asset and we will
                create a persisted job, track execution, and keep the result
                available in your dashboard.
              </p>
              <p className="mt-4 text-sm text-brand-dark">{uploadHint}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => inputRef.current?.click()}
                  disabled={!sessionData?.user}
                  data-testid="tool-choose-image"
                >
                  Choose image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    startTransition(async () => {
                      await handleSubmit();
                    });
                  }}
                  disabled={!sessionData?.user || !selectedFile || isPending}
                  data-testid="tool-run"
                >
                  {isPending ? "Starting..." : "Run background remover"}
                </Button>
              </div>
            </div>
          ) : null}

          {state === "uploading" || state === "processing" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>
                  {state === "uploading"
                    ? "Uploading image"
                    : "Processing result"}
                </span>
                <span>{progressValue}%</span>
              </div>
              <div className="h-3 rounded-full bg-white">
                <div
                  className="h-3 rounded-full bg-brand-magenta transition-[width]"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-brand-dark">
                    Current file
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {selectedFile?.name ?? "No file selected"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-brand-dark">
                    Job status
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {job ? `${job.id} · ${job.status}` : "Creating job record"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-neutral-600">
                {state === "uploading"
                  ? "The upload is being validated and a job record is being created."
                  : "The provider is processing your image. The dashboard will update automatically as the job moves."}
              </div>
            </div>
          ) : null}

          {state === "result" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-neutral-200 to-neutral-300 p-5">
                <p className="text-sm font-semibold text-neutral-500">
                  Original
                </p>
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Original upload preview"
                    width={800}
                    height={1000}
                    unoptimized
                    className="mt-4 aspect-[4/5] w-full rounded-[1.25rem] object-cover"
                  />
                ) : (
                  <div className="mt-4 aspect-[4/5] rounded-[1.25rem] bg-white/60" />
                )}
              </div>
              <div className="rounded-[1.5rem] bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:18px_18px] p-5">
                <p className="text-sm font-semibold text-neutral-500">
                  Background removed
                </p>
                <div
                  data-testid="tool-output-preview"
                  className="mt-4 flex aspect-[4/5] flex-col justify-between rounded-[1.25rem] border border-white/70 bg-white/40 p-5 backdrop-blur-sm"
                >
                  {job?.outputUrl ? (
                    <Image
                      src={job.outputUrl}
                      alt="Background removed output preview"
                      width={800}
                      height={1000}
                      unoptimized
                      className="h-full w-full rounded-[1rem] object-cover"
                    />
                  ) : (
                    <div className="text-sm text-neutral-600">
                      Output storage is ready, but this run did not expose a
                      preview URL.
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                {job?.outputUrl ? (
                  <a
                    href={job.outputUrl}
                    download
                    className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white"
                    data-testid="tool-download-output"
                  >
                    Download result
                  </a>
                ) : null}
                <Link
                  href={routes.dashboardJobs}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
                >
                  Open job history
                </Link>
                <button
                  type="button"
                  onClick={resetStudio}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
                >
                  Run another image
                </button>
              </div>
            </div>
          ) : null}

          {state === "error" ? (
            <div className="rounded-[1.5rem] bg-rose-50 p-6 text-rose-900">
              <p className="font-heading text-2xl font-bold">
                Processing failed
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                {errorMessage ||
                  "The job could not be completed. Retry the request or inspect the dashboard job record."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    resetStudio();
                  }}
                >
                  Choose another file
                </Button>
                {selectedFile ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      startTransition(async () => {
                        await handleSubmit();
                      });
                    }}
                    disabled={isPending}
                  >
                    Retry this image
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">
            Output controls
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            Additional output options (upscaling, background colors, shadows)
            will be available in a future update.
          </p>
        </div>

        <div className="rounded-[2rem] border border-neutral-200 bg-brand-dark p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
            Production path
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/75">
            <li>
              Validated uploads create real job records and durable output
              assets
            </li>
            <li>
              Dashboard history, retry, cancel, and API key access share the
              same job contract
            </li>
            <li>
              Webhook-enabled provider execution can complete asynchronously
              without blocking the request
            </li>
            <li>
              Public API consumers can receive completion callbacks and signed
              webhook headers
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@repo/ui";
import { authClient } from "@repo/core/auth/client";
import { toolConfig } from "@config/tool";
import { routes } from "@/lib/routes";
import type { ApiErrorPayload, ToolJobDto } from "../lib/types";

const studioStates = ["empty", "uploading", "processing", "result", "error"] as const;
type StudioState = (typeof studioStates)[number];

const addons = ["Upscale", "BG Color", "BG Image", "Shadow", "Crop"];

export function ToolStudio() {
    const [state, setState] = useState<StudioState>("empty");
    const [selectedAddon, setSelectedAddon] = useState(addons[0]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [job, setJob] = useState<ToolJobDto | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { data: sessionData, isPending: isSessionPending } = authClient.useSession();

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
        if (!job || (job.status !== "pending" && job.status !== "uploading" && job.status !== "processing")) {
            return;
        }

        const intervalId = window.setInterval(async () => {
            const response = await fetch(`/api/background-remover/jobs/${job.id}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as { job: ToolJobDto };
            setJob(payload.job);

            if (payload.job.status === "succeeded") {
                setState("result");
            }

            if (payload.job.status === "failed") {
                setState("error");
                setErrorMessage(payload.job.errorMessage || "Processing failed.");
            }
        }, 1500);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [job]);

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

        const response = await fetch("/api/background-remover/jobs", {
            method: "POST",
            body: formData,
        });

        const payload = (await response.json()) as { job?: ToolJobDto } | ApiErrorPayload;
        const jobPayload = "job" in payload ? payload.job : undefined;

        if (!response.ok || !jobPayload) {
            setState("error");
            setErrorMessage(
                "error" in payload
                    ? payload.error?.message || "Unable to create the tool job."
                    : "Unable to create the tool job."
            );
            return;
        }

        setJob(jobPayload);

        if (jobPayload.status === "succeeded") {
            setState("result");
            return;
        }

        if (jobPayload.status === "failed") {
            setState("error");
            setErrorMessage(jobPayload.errorMessage || "Processing failed.");
            return;
        }

        setState("processing");
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap gap-2">
                    {studioStates.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setState(item)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                                state === item
                                    ? "bg-brand-magenta text-white"
                                    : "bg-neutral-100 text-neutral-600"
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-dashed border-neutral-200 bg-neutral-50 p-6">
                    {!sessionData?.user && !isSessionPending ? (
                        <div className="rounded-[1.5rem] bg-amber-50 p-6 text-amber-950">
                            <p className="font-heading text-2xl font-bold">Sign in to run the tool</p>
                            <p className="mt-3 text-sm leading-relaxed">
                                Upload and processing now create real persisted job records, so an
                                authenticated session is required.
                            </p>
                            <div className="mt-6">
                                <Link href={routes.login}>
                                    <Button>Sign in</Button>
                                </Link>
                            </div>
                        </div>
                    ) : null}

                    {state === "empty" ? (
                        <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-magenta shadow-sm">
                                <span className="text-2xl">+</span>
                            </div>
                            <h3 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                                Upload an image
                            </h3>
                            <p className="mt-3 text-neutral-600">
                                Choose a file and create a persisted job record. The current backend
                                uses local-development processing fallback until the provider worker is wired.
                            </p>
                            {selectedFile ? (
                                <p className="mt-4 text-sm text-brand-dark">
                                    Selected: <span className="font-semibold">{selectedFile.name}</span>
                                </p>
                            ) : null}
                            <input
                                ref={inputRef}
                                type="file"
                                accept={toolConfig.input.acceptedFormats.join(",")}
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    setSelectedFile(file);
                                    setErrorMessage(null);
                                    setJob(null);
                                    setState("empty");
                                }}
                            />
                            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-neutral-500">
                                <span>{toolConfig.input.acceptedFormats.join(", ")}</span>
                                <span>Up to {toolConfig.input.maxFileSizeMB}MB</span>
                                <span>{toolConfig.output.format.toUpperCase()} output</span>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <Button
                                    onClick={() => inputRef.current?.click()}
                                    disabled={!sessionData?.user}
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
                                >
                                    {isPending ? "Starting..." : "Run background remover"}
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {state === "uploading" ? (
                        <div>
                            <div className="flex items-center justify-between text-sm text-neutral-600">
                                <span>Uploading {selectedFile?.name ?? "image"}</span>
                                <span>Starting</span>
                            </div>
                            <div className="mt-4 h-3 rounded-full bg-white">
                                <div className="h-3 w-3/4 rounded-full bg-sky-500" />
                            </div>
                            <p className="mt-4 text-sm text-neutral-500">
                                The API is now accepting a real file upload and creating a persisted job.
                            </p>
                        </div>
                    ) : null}

                    {state === "processing" ? (
                        <div className="space-y-4">
                            {[
                                "Upload complete",
                                "Job stored in database",
                                "Queue submission or local fallback running",
                                "Waiting for result status",
                            ].map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-4 rounded-2xl bg-white p-4"
                                >
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                            index < 3
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                        }`}
                                    >
                                        {index < 3 ? "✓" : "…"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-dark">{step}</p>
                                        <p className="text-sm text-neutral-500">
                                            {index < 2
                                                ? "Completed"
                                                : job?.status === "processing"
                                                  ? "In progress"
                                                  : "Expected within a few seconds"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {job ? (
                                <div className="rounded-2xl bg-white p-4 text-sm text-neutral-600">
                                    Job <span className="font-mono">{job.id}</span> is currently{" "}
                                    <span className="font-semibold">{job.status}</span>.
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {state === "result" ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="rounded-[1.5rem] bg-gradient-to-br from-neutral-200 to-neutral-300 p-5">
                                <p className="text-sm font-semibold text-neutral-500">Original</p>
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
                                <div className="mt-4 flex aspect-[4/5] flex-col justify-between rounded-[1.25rem] border border-white/70 bg-white/40 p-5 backdrop-blur-sm">
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
                                        <div>
                                            <p className="font-semibold text-brand-dark">
                                                Job completed successfully
                                            </p>
                                            <p className="mt-2 text-sm text-neutral-600">
                                                Provider: {job?.provider ?? "unknown"}
                                            </p>
                                            <p className="mt-2 text-sm text-neutral-600">
                                                Created: {job?.createdAt ?? "unknown"}
                                            </p>
                                            <p className="mt-6 text-sm text-neutral-600">
                                                Output storage is ready, but no downloadable result URL was
                                                returned for this run.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {state === "error" ? (
                        <div className="rounded-[1.5rem] bg-rose-50 p-6 text-rose-900">
                            <p className="font-heading text-2xl font-bold">Processing failed</p>
                            <p className="mt-3 text-sm leading-relaxed">
                                {errorMessage ||
                                    "The job could not be completed. Retry the request or inspect the dashboard job record."}
                            </p>
                            <div className="mt-6">
                                <Button
                                    onClick={() => {
                                        setState("empty");
                                        setJob(null);
                                        setErrorMessage(null);
                                    }}
                                >
                                    Try again
                                </Button>
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
                    <div className="mt-5 space-y-3">
                        {addons.map((addon) => (
                            <button
                                key={addon}
                                type="button"
                                onClick={() => setSelectedAddon(addon)}
                                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                                    selectedAddon === addon
                                        ? "border-brand-magenta bg-brand-magenta/5 text-brand-dark"
                                        : "border-neutral-200 text-neutral-600"
                                }`}
                            >
                                <span>{addon}</span>
                                <span className="text-xs uppercase tracking-wide text-neutral-400">
                                    mock
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-neutral-200 bg-brand-dark p-6 text-white shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                        Live contract
                    </p>
                    <ul className="mt-5 space-y-3 text-sm text-white/75">
                        <li>Validated file upload sent to a real API route</li>
                        <li>Persisted jobs table records every tool execution attempt</li>
                        <li>Polling-backed processing and result states now use live job status</li>
                        <li>Add-on affordances already modeled in the interface</li>
                        <li>Ready to swap local simulation for provider-backed worker execution</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

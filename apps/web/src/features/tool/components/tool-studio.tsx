"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { toolConfig } from "@config/tool";

const studioStates = ["empty", "uploading", "processing", "result", "error"] as const;
type StudioState = (typeof studioStates)[number];

const addons = ["Upscale", "BG Color", "BG Image", "Shadow", "Crop"];

export function ToolStudio() {
    const [state, setState] = useState<StudioState>("empty");
    const [selectedAddon, setSelectedAddon] = useState(addons[0]);

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
                    {state === "empty" ? (
                        <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-magenta shadow-sm">
                                <span className="text-2xl">+</span>
                            </div>
                            <h3 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                                Upload an image
                            </h3>
                            <p className="mt-3 text-neutral-600">
                                Drag and drop or browse a file. This is mocked UI for now, but it is
                                shaped around the production upload contract.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-neutral-500">
                                <span>{toolConfig.input.acceptedFormats.join(", ")}</span>
                                <span>Up to {toolConfig.input.maxFileSizeMB}MB</span>
                                <span>{toolConfig.output.format.toUpperCase()} output</span>
                            </div>
                        </div>
                    ) : null}

                    {state === "uploading" ? (
                        <div>
                            <div className="flex items-center justify-between text-sm text-neutral-600">
                                <span>Uploading `founder-headshot.jpg`</span>
                                <span>68%</span>
                            </div>
                            <div className="mt-4 h-3 rounded-full bg-white">
                                <div className="h-3 w-2/3 rounded-full bg-sky-500" />
                            </div>
                            <p className="mt-4 text-sm text-neutral-500">
                                In production this step will request an R2 presigned URL and stream the
                                file directly from the browser.
                            </p>
                        </div>
                    ) : null}

                    {state === "processing" ? (
                        <div className="space-y-4">
                            {[
                                "Upload complete",
                                "Job created and queued",
                                "Primary model running",
                                "Waiting for result callback",
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
                                            {index < 3 ? "Completed" : "Expected within a few seconds"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {state === "result" ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="rounded-[1.5rem] bg-gradient-to-br from-neutral-200 to-neutral-300 p-5">
                                <p className="text-sm font-semibold text-neutral-500">Original</p>
                                <div className="mt-4 aspect-[4/5] rounded-[1.25rem] bg-white/60" />
                            </div>
                            <div className="rounded-[1.5rem] bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:18px_18px] p-5">
                                <p className="text-sm font-semibold text-neutral-500">Background removed</p>
                                <div className="mt-4 aspect-[4/5] rounded-[1.25rem] border border-white/70 bg-white/40 backdrop-blur-sm" />
                            </div>
                        </div>
                    ) : null}

                    {state === "error" ? (
                        <div className="rounded-[1.5rem] bg-rose-50 p-6 text-rose-900">
                            <p className="font-heading text-2xl font-bold">Processing failed</p>
                            <p className="mt-3 text-sm leading-relaxed">
                                This mocked error state is here so backend wiring later has a stable
                                presentation target for retries, fallback model messaging, and support
                                guidance.
                            </p>
                            <div className="mt-6">
                                <Button onClick={() => setState("processing")}>Retry mock job</Button>
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
                        Backend-ready contract
                    </p>
                    <ul className="mt-5 space-y-3 text-sm text-white/75">
                        <li>Validated file input with a single upload contract</li>
                        <li>Distinct empty, uploading, processing, success, and error states</li>
                        <li>Add-on affordances already modeled in the interface</li>
                        <li>Ready to connect to polling or webhook-backed job updates</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

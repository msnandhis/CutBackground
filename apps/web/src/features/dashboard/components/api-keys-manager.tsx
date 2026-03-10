"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/site/status-badge";
import type { DashboardApiKey, IssuedDashboardApiKey } from "../lib/types";

interface ApiErrorPayload {
    error?: {
        message?: string;
    };
}

export function ApiKeysManager({ keys: initialKeys }: { keys: DashboardApiKey[] }) {
    const router = useRouter();
    const [keys, setKeys] = useState(initialKeys);
    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [revealedKey, setRevealedKey] = useState<IssuedDashboardApiKey | null>(null);
    const [isPending, startTransition] = useTransition();

    function syncKey(nextKey: DashboardApiKey) {
        setKeys((current) => {
            const existingIndex = current.findIndex((item) => item.id === nextKey.id);

            if (existingIndex === -1) {
                return [nextKey, ...current];
            }

            return current.map((item) => (item.id === nextKey.id ? nextKey : item));
        });
    }

    function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setRevealedKey(null);

        startTransition(async () => {
            const response = await fetch("/api/dashboard/api-keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            const payload = (await response.json()) as
                | IssuedDashboardApiKey
                | ApiErrorPayload;

            if (!response.ok || !("key" in payload)) {
                setErrorMessage(
                    "error" in payload
                        ? payload.error?.message || "Unable to create an API key right now."
                        : "Unable to create an API key right now."
                );
                return;
            }

            syncKey(payload.key);
            setRevealedKey(payload);
            setSuccessMessage("API key created. Copy the secret now, it will not be shown again.");
            setName("");
        });
    }

    function handleRevoke(keyId: string) {
        setErrorMessage("");
        setSuccessMessage("");
        setRevealedKey(null);

        startTransition(async () => {
            const response = await fetch(`/api/dashboard/api-keys/${keyId}/revoke`, {
                method: "POST",
            });

            const payload = (await response.json()) as
                | { key: DashboardApiKey }
                | ApiErrorPayload;

            if (!response.ok || !("key" in payload)) {
                setErrorMessage(
                    "error" in payload
                        ? payload.error?.message || "Unable to revoke this API key."
                        : "Unable to revoke this API key."
                );
                return;
            }

            syncKey(payload.key);
            setSuccessMessage("API key revoked.");
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="font-heading text-2xl font-bold text-brand-dark">Developer keys</h2>
                <p className="mt-2 text-sm text-neutral-600">
                    Issue scoped API credentials for automation and revoke them if they are exposed or no
                    longer needed.
                </p>
            </div>

            <form
                onSubmit={handleCreate}
                className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <label className="flex-1">
                        <span className="text-sm font-medium text-brand-dark">Key name</span>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Production worker"
                            maxLength={48}
                            data-testid="api-key-name"
                            className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-brand-accent"
                            disabled={isPending}
                        />
                    </label>
                    <button
                        type="submit"
                        data-testid="api-key-create"
                        disabled={isPending || name.trim().length < 2}
                        className="rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? "Working..." : "Create API key"}
                    </button>
                </div>
            </form>

            {errorMessage ? (
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            {successMessage ? (
                <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                    {successMessage}
                </div>
            ) : null}

            {revealedKey ? (
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <p className="text-sm font-semibold text-amber-900">
                        Copy this key now. It will not be shown again.
                    </p>
                    <p className="mt-3 rounded-2xl bg-white px-4 py-3 font-mono text-sm text-brand-dark">
                        <span data-testid="api-key-secret">{revealedKey.plainTextKey}</span>
                    </p>
                </div>
            ) : null}

            {keys.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-dark">No API keys yet</h3>
                    <p className="mt-3 text-sm text-neutral-500">
                        Create a key to start authenticating automation and API traffic.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {keys.map((key) => (
                        <div
                            key={key.id}
                            data-testid={`api-key-card-${key.id}`}
                            className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-brand-dark">
                                            {key.name}
                                        </h3>
                                        <StatusBadge status={key.status} />
                                    </div>
                                    <p className="mt-2 font-mono text-sm text-neutral-500">
                                        {key.prefix}
                                    </p>
                                    <p className="mt-3 text-sm text-neutral-500">
                                        Created {key.createdAtLabel}
                                        {key.lastUsedAtLabel
                                            ? ` • Last used ${key.lastUsedAtLabel}`
                                            : " • Never used"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    data-testid={`api-key-revoke-${key.id}`}
                                    onClick={() => handleRevoke(key.id)}
                                    disabled={isPending || key.status === "revoked"}
                                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {key.status === "revoked" ? "Revoked" : "Revoke"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { StatusBadge } from "@/components/site/status-badge";
import { mockApiKeys } from "@/lib/mocks";

export function ApiKeysManager() {
    const [keys, setKeys] = useState(mockApiKeys);
    const [created, setCreated] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-heading text-2xl font-bold text-brand-dark">
                            Developer keys
                        </h2>
                        <p className="mt-2 text-sm text-neutral-600">
                            Mocked manager for key creation, display-once behavior, and revocation.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setCreated("cut_live_demo_newkey");
                            setKeys((current) => [
                                {
                                    id: `key_${current.length + 1}`,
                                    name: "New key",
                                    prefix: "cut_live_demo",
                                    createdAt: "March 9, 2026",
                                    lastUsedAt: null,
                                    status: "active",
                                },
                                ...current,
                            ]);
                        }}
                    >
                        Generate mock key
                    </Button>
                </div>
                {created ? (
                    <div className="mt-6 rounded-2xl bg-brand-dark px-4 py-4 text-sm text-white">
                        New key: <span className="font-mono">{created}</span>
                    </div>
                ) : null}
            </div>

            <div className="space-y-4">
                {keys.map((key) => (
                    <div
                        key={key.id}
                        className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-brand-dark">{key.name}</h3>
                                    <StatusBadge status={key.status} />
                                </div>
                                <p className="mt-2 font-mono text-sm text-neutral-500">{key.prefix}</p>
                                <p className="mt-3 text-sm text-neutral-500">
                                    Created {key.createdAt}
                                    {key.lastUsedAt ? ` • Last used ${key.lastUsedAt}` : " • Never used"}
                                </p>
                            </div>
                            <Button
                                variant={key.status === "active" ? "outline" : "secondary"}
                                onClick={() =>
                                    setKeys((current) =>
                                        current.map((item) =>
                                            item.id === key.id
                                                ? {
                                                    ...item,
                                                    status:
                                                        item.status === "active" ? "revoked" : "active",
                                                }
                                                : item
                                        )
                                    )
                                }
                            >
                                {key.status === "active" ? "Revoke" : "Restore"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

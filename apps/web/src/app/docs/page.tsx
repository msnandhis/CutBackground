import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

const endpoints = [
    {
        method: "POST",
        path: "/api/v1/background-remover/jobs",
        description: "Create a background-removal job with multipart form data.",
    },
    {
        method: "GET",
        path: "/api/v1/background-remover/jobs",
        description: "List the most recent jobs for the API key owner.",
    },
    {
        method: "GET",
        path: "/api/v1/background-remover/jobs/:jobId",
        description: "Read job status, provider metadata, and output availability.",
    },
    {
        method: "POST",
        path: "/api/v1/background-remover/jobs/:jobId/retry",
        description: "Retry a failed or canceled job.",
    },
    {
        method: "POST",
        path: "/api/v1/background-remover/jobs/:jobId/cancel",
        description: "Cancel a pending or processing job.",
    },
    {
        method: "GET",
        path: "/api/v1/background-remover/jobs/:jobId/output",
        description: "Download the completed output asset.",
    },
];

const createExample = `curl -X POST "$BASE_URL/api/v1/background-remover/jobs" \\
  -H "Authorization: Bearer $API_KEY" \\
  -F "file=@./samples/product.png" \\
  -F "webhookUrl=https://example.com/webhooks/cutbackground" \\
  -F "webhookSecret=$WEBHOOK_SECRET"`;

const statusExample = `curl "$BASE_URL/api/v1/background-remover/jobs/$JOB_ID" \\
  -H "Authorization: Bearer $API_KEY"`;

const webhookExample = `{
  "event": "background_remover.job.completed",
  "job": {
    "id": "8a8c1c58-3c31-4b7b-8a77-c96f4ed6f6f1",
    "status": "succeeded",
    "provider": "replicate",
    "providerJobId": "pred_xxx",
    "modelUsed": "851-labs/background-remover",
    "outputUrl": "https://your-app.com/api/v1/background-remover/jobs/8a8c1c58-3c31-4b7b-8a77-c96f4ed6f6f1/output",
    "errorMessage": null,
    "createdAt": "2026-03-10T09:15:11.000Z",
    "completedAt": "2026-03-10T09:15:34.000Z"
  }
}`;

export default function DocsPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <PageIntro
                        eyebrow="Docs"
                        title="Developer API and operator workflow"
                        description="The platform now exposes authenticated REST endpoints, signed completion webhooks, operator controls, and dashboard-backed job history on the same production contract."
                    />

                    <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Authentication</h2>
                            <p className="mt-4 text-neutral-600">
                                Create API keys in the dashboard, store the one-time secret securely, and send
                                it as <code>Authorization: Bearer &lt;key&gt;</code> or <code>x-api-key</code>.
                            </p>
                            <p className="mt-4 text-neutral-600">
                                Keys are hashed at rest, tracked with <code>lastUsedAt</code>, and can be revoked
                                without redeploying your integration.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-neutral-200 bg-brand-dark p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-white">Webhook delivery</h2>
                            <ul className="mt-5 space-y-3 text-sm text-white/80">
                                <li>Completion webhooks are optional per job.</li>
                                <li>
                                    Provide <code>webhookUrl</code> and optionally <code>webhookSecret</code> when
                                    creating the job.
                                </li>
                                <li>
                                    Outbound requests include <code>X-CutBackground-Event</code>,{" "}
                                    <code>X-CutBackground-Timestamp</code>, and when a secret is supplied,{" "}
                                    <code>X-CutBackground-Signature</code>.
                                </li>
                                <li>Delivery retries with backoff and persists delivery metadata on the job record.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                        <h2 className="font-heading text-2xl font-bold text-brand-dark">REST endpoints</h2>
                        <div className="mt-6 space-y-4">
                            {endpoints.map((endpoint) => (
                                <div
                                    key={endpoint.path}
                                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4"
                                >
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="rounded-full bg-brand-dark px-3 py-1 text-xs font-semibold text-white">
                                            {endpoint.method}
                                        </span>
                                        <code className="text-sm text-brand-dark">{endpoint.path}</code>
                                    </div>
                                    <p className="mt-3 text-sm text-neutral-600">{endpoint.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Create a job</h2>
                            <pre className="mt-5 overflow-x-auto rounded-2xl bg-neutral-950 p-5 text-sm text-neutral-100">
                                <code>{createExample}</code>
                            </pre>
                        </div>

                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Read job status</h2>
                            <pre className="mt-5 overflow-x-auto rounded-2xl bg-neutral-950 p-5 text-sm text-neutral-100">
                                <code>{statusExample}</code>
                            </pre>
                        </div>
                    </div>

                    <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Completion webhook payload</h2>
                            <pre className="mt-5 overflow-x-auto rounded-2xl bg-neutral-950 p-5 text-sm text-neutral-100">
                                <code>{webhookExample}</code>
                            </pre>
                        </div>

                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Operator workflow</h2>
                            <ul className="mt-5 space-y-3 text-sm text-neutral-600">
                                <li>Use the dashboard operations page to inspect queue health and stale jobs.</li>
                                <li>Retry failed jobs without asking end users to re-upload the source image.</li>
                                <li>Cancel pending or processing jobs when a queue jam or provider issue appears.</li>
                                <li>Run manual stale recovery to mark abandoned processing jobs as failed.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}

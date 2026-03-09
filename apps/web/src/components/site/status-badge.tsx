import type { JobStatus } from "@/lib/types";

const statusStyles: Record<JobStatus | "active" | "revoked", string> = {
    pending: "bg-neutral-100 text-neutral-700",
    uploading: "bg-sky-100 text-sky-700",
    processing: "bg-amber-100 text-amber-700",
    succeeded: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    active: "bg-emerald-100 text-emerald-700",
    revoked: "bg-neutral-200 text-neutral-600",
};

export function StatusBadge({
    status,
}: {
    status: JobStatus | "active" | "revoked";
}) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
        >
            {status}
        </span>
    );
}

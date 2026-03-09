export function AuthFeedback({
    tone,
    message,
}: {
    tone: "success" | "error";
    message: string;
}) {
    const classes =
        tone === "success"
            ? "bg-emerald-50 text-emerald-800"
            : "bg-rose-50 text-rose-800";

    return <div className={`rounded-2xl px-4 py-3 text-sm ${classes}`}>{message}</div>;
}

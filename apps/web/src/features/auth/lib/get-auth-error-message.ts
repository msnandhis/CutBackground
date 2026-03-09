export function getAuthErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null) {
        const maybeError = error as { message?: unknown; statusText?: unknown };

        if (typeof maybeError.message === "string" && maybeError.message.length > 0) {
            return maybeError.message;
        }

        if (typeof maybeError.statusText === "string" && maybeError.statusText.length > 0) {
            return maybeError.statusText;
        }
    }

    return fallback;
}

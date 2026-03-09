import { NextResponse } from "next/server";
import { z } from "zod";

export class ApiRouteError extends Error {
    status: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(params: {
        status: number;
        code: string;
        message: string;
        details?: Record<string, unknown>;
    }) {
        super(params.message);
        this.status = params.status;
        this.code = params.code;
        this.details = params.details;
    }
}

export function apiRouteError(params: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
}) {
    return new ApiRouteError(params);
}

export function toApiErrorResponse(error: unknown) {
    if (error instanceof ApiRouteError) {
        return NextResponse.json(
            {
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details ?? null,
                },
            },
            { status: error.status }
        );
    }

    return NextResponse.json(
        {
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong while processing this request.",
                details: null,
            },
        },
        { status: 500 }
    );
}

export async function parseJsonBody<T extends z.ZodTypeAny>(
    request: Request,
    schema: T
): Promise<z.infer<T>> {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        throw apiRouteError({
            status: 400,
            code: "INVALID_JSON",
            message: "Request body must be valid JSON.",
        });
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw apiRouteError({
            status: 400,
            code: "INVALID_REQUEST_BODY",
            message: "Request body validation failed.",
            details: {
                issues: parsed.error.flatten(),
            },
        });
    }

    return parsed.data;
}

export function parseRouteParams<T extends z.ZodTypeAny>(
    params: unknown,
    schema: T
): z.infer<T> {
    const parsed = schema.safeParse(params);

    if (!parsed.success) {
        throw apiRouteError({
            status: 400,
            code: "INVALID_ROUTE_PARAMS",
            message: "Route parameters are invalid.",
            details: {
                issues: parsed.error.flatten(),
            },
        });
    }

    return parsed.data;
}

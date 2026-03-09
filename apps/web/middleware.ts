import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@repo/core/auth";

const protectedPrefixes = ["/dashboard"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};

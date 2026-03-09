import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { db, schema } from "@repo/database";
import { logger } from "../logger";

const authBaseUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000";

const authSecret =
    process.env.BETTER_AUTH_SECRET ??
    "local-development-better-auth-secret-2026-keep-out";

export const auth = betterAuth({
    secret: authSecret,
    baseURL: authBaseUrl,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            logger.info(
                { email: user.email, resetUrl: url },
                "Password reset email requested."
            );
        },
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                logger.info({ email, magicLinkUrl: url }, "Magic link requested.");
            },
        }),
    ],
    trustedOrigins: [authBaseUrl],
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 10,
    },
});

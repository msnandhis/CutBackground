import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { db, schema } from "@repo/database";
import { getAuthSecret, getServerAuthBaseUrl, getSiteIdentity } from "../env";
import { logger } from "../logger";

const authBaseUrl = getServerAuthBaseUrl();
const authSecret =
    getAuthSecret() ??
    "Q8y2vN4mL7rP1xT5kC9dF3hJ6sW0bZ4qR8uY2nM5pL1tV7cX3kH9dS6fB2gA4wE";
const siteIdentity = getSiteIdentity();

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
        sendVerificationEmail: async ({
            user,
            url,
        }: {
            user: { email: string };
            url: string;
        }) => {
            logger.info(
                {
                    email: user.email,
                    verificationUrl: url,
                    domain: siteIdentity.domain,
                    tool: siteIdentity.toolName,
                },
                "Email verification requested."
            );
        },
        sendResetPassword: async ({
            user,
            url,
        }: {
            user: { email: string };
            url: string;
        }) => {
            logger.info(
                {
                    email: user.email,
                    resetUrl: url,
                    domain: siteIdentity.domain,
                    tool: siteIdentity.toolName,
                },
                "Password reset email requested."
            );
        },
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
                logger.info(
                    {
                        email,
                        magicLinkUrl: url,
                        domain: siteIdentity.domain,
                        tool: siteIdentity.toolName,
                    },
                    "Magic link requested."
                );
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

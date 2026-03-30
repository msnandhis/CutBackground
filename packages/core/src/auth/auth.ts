import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { db, schema } from "@repo/database";
import { getAuthSecret, getServerAuthBaseUrl, getSiteIdentity } from "../env";
import { logger } from "../logger";
import { buildTransactionalActionEmail, sendTransactionalEmail } from "../mail";

const authBaseUrl = getServerAuthBaseUrl();
const authSecret = getAuthSecret();

if (!authSecret) {
  throw new Error("Authentication secret is not configured.");
}

const siteIdentity = getSiteIdentity();

function buildAuthEmail(params: {
  subject: string;
  preview: string;
  headline: string;
  intro: string;
  actionLabel: string;
  url: string;
  outro: string;
}) {
  return buildTransactionalActionEmail({
    subject: params.subject,
    preview: params.preview,
    headline: params.headline,
    intro: params.intro,
    actionLabel: params.actionLabel,
    actionUrl: params.url,
    outro: params.outro,
  });
}

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
      await sendTransactionalEmail({
        to: user.email,
        ...buildAuthEmail({
          subject: `Verify your ${siteIdentity.toolName} account`,
          preview: "Confirm your email address to activate the workspace.",
          headline: "Verify your email",
          intro: `Confirm your email address to finish creating your ${siteIdentity.toolName} workspace.`,
          actionLabel: "Verify email",
          url,
          outro:
            "If you did not create this account, you can ignore this email.",
        }),
      });
    },
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      await sendTransactionalEmail({
        to: user.email,
        ...buildAuthEmail({
          subject: `Reset your ${siteIdentity.toolName} password`,
          preview: "Use this secure link to choose a new password.",
          headline: "Reset your password",
          intro: `A password reset was requested for your ${siteIdentity.toolName} account.`,
          actionLabel: "Reset password",
          url,
          outro:
            "If you did not request a password reset, no action is required.",
        }),
      });
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        await sendTransactionalEmail({
          to: email,
          ...buildAuthEmail({
            subject: `Your ${siteIdentity.toolName} sign-in link`,
            preview: "Use this one-time link to sign in securely.",
            headline: "Secure sign-in link",
            intro: `Use this one-time sign-in link to access ${siteIdentity.toolName} without entering your password.`,
            actionLabel: "Sign in",
            url,
            outro:
              "If you did not request this sign-in link, you can ignore this email.",
          }),
        });
      },
    }),
  ],
  trustedOrigins: [authBaseUrl],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  cookies: {
    session_token: {
      name: "session_token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: authBaseUrl.startsWith("https://"),
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
});

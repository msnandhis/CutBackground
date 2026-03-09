import { getEmailConfig, isEmailConfigured, isProductionRuntime, type EmailProvider } from "../env";
import { logger } from "../logger";
import { buildActionEmailTemplate, type ActionEmailTemplateInput } from "./templates";

export interface TransactionalEmail {
    to: string;
    subject: string;
    html: string;
    text: string;
}

async function sendViaResend(email: TransactionalEmail, config: { apiKey: string; from: string; replyTo: string | null }) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: config.from,
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
            reply_to: config.replyTo ?? undefined,
        }),
    });

    if (!response.ok) {
        const payload = await response.text();
        throw new Error(`Resend request failed: ${response.status} ${payload}`);
    }
}

async function sendViaBrevo(email: TransactionalEmail, config: { apiKey: string; from: string; replyTo: string | null }) {
    const [senderName, senderEmail] = config.from.includes("<")
        ? config.from.split(/<|>/).filter(Boolean).map((value) => value.trim())
        : [null, config.from];

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": config.apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sender: {
                name: senderName || undefined,
                email: senderEmail,
            },
            to: [{ email: email.to }],
            subject: email.subject,
            htmlContent: email.html,
            textContent: email.text,
            replyTo: config.replyTo ? { email: config.replyTo } : undefined,
        }),
    });

    if (!response.ok) {
        const payload = await response.text();
        throw new Error(`Brevo request failed: ${response.status} ${payload}`);
    }
}

async function sendWithProvider(provider: EmailProvider, email: TransactionalEmail, config: { apiKey: string; from: string; replyTo: string | null }) {
    if (provider === "brevo") {
        await sendViaBrevo(email, config);
        return;
    }

    await sendViaResend(email, config);
}

export function buildTransactionalActionEmail(input: ActionEmailTemplateInput) {
    return buildActionEmailTemplate(input);
}

export async function sendTransactionalEmail(email: TransactionalEmail) {
    const config = getEmailConfig();

    if (!config) {
        if (isProductionRuntime()) {
            throw new Error("Missing email provider configuration.");
        }

        logger.info(
            {
                to: email.to,
                subject: email.subject,
            },
            "Skipping transactional email because no provider is configured."
        );
        return;
    }

    await sendWithProvider(config.provider, email, config);
}

export { isEmailConfigured };

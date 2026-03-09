import { getSiteIdentity } from "../env";

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export interface ActionEmailTemplateInput {
    subject: string;
    preview: string;
    headline: string;
    intro: string;
    actionLabel: string;
    actionUrl: string;
    outro: string;
}

export function buildActionEmailTemplate(input: ActionEmailTemplateInput) {
    const site = getSiteIdentity();
    const toolName = site.toolName || "CutBackground";
    const domain = site.domain || "your workspace";

    const escapedSubject = escapeHtml(input.subject);
    const escapedPreview = escapeHtml(input.preview);
    const escapedHeadline = escapeHtml(input.headline);
    const escapedIntro = escapeHtml(input.intro);
    const escapedActionLabel = escapeHtml(input.actionLabel);
    const escapedOutro = escapeHtml(input.outro);

    return {
        subject: input.subject,
        text: `${input.headline}\n\n${input.intro}\n\n${input.actionLabel}: ${input.actionUrl}\n\n${input.outro}\n\n${toolName} · ${domain}`,
        html: `
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f5f4;padding:24px;font-family:Inter,Helvetica,Arial,sans-serif;color:#1c1917;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapedPreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e7e5e4;">
      <tr>
        <td style="padding:32px 32px 20px;background:linear-gradient(135deg,#111827,#334155);color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.72;">${escapeHtml(toolName)}</p>
          <h1 style="margin:14px 0 0;font-size:32px;line-height:1.1;">${escapedHeadline}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">${escapedIntro}</p>
          <p style="margin:0 0 28px;">
            <a href="${input.actionUrl}" style="display:inline-block;border-radius:999px;background:#111827;padding:14px 22px;color:#ffffff;text-decoration:none;font-weight:600;">${escapedActionLabel}</a>
          </p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#78716c;">${escapedOutro}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;color:#a8a29e;font-size:12px;">
          ${escapeHtml(toolName)} · ${escapeHtml(domain)}
        </td>
      </tr>
    </table>
  </body>
</html>`.trim(),
    };
}

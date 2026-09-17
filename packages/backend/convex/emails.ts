"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// ============================================
// HELPERS & CONFIGURATION
// ============================================

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY environment variable is not set");
    return new Resend(apiKey);
}

function getFromEmail(): string {
    const raw = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
    if (raw.includes("<") && raw.includes(">")) {
        return raw;
    }
    return `BetterTodo <${raw}>`;
}

function capitalize(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================
// EMAIL COMPONENTS & DESIGN SYSTEM
// ============================================

interface BaseTemplateOptions {
    title: string;
    previewText: string;
    heading: string;
    greeting?: string;
    bodyHtml: string;
    metaBoxHtml?: string;
    actionButtonHtml: string;
    fallbackUrl?: string;
    subtextHtml?: string;
    recipientEmail: string;
}

function roleBadge(role: string): string {
    const normalized = role.toLowerCase();
    const roleLabels: Record<string, string> = {
        admin: "Admin",
        member: "Member",
        viewer: "Viewer",
    };
    const label = roleLabels[normalized] ?? capitalize(role);

    // Subtle, restrained palette: no harsh neons
    const styles: Record<string, { bg: string; text: string; border: string }> = {
        admin: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
        member: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
        viewer: { bg: "#f4f4f5", text: "#52525b", border: "#e4e4e7" },
    };

    const style = styles[normalized] ?? { bg: "#f4f4f5", text: "#3f3f46", border: "#e4e4e7" };

    return `<span class="email-badge" style="display:inline-block;padding:2px 8px;background-color:${style.bg};color:${style.text};font-size:12px;font-weight:500;border-radius:6px;border:1px solid ${style.border};line-height:1.4;">${escapeHtml(label)}</span>`;
}

function actionButton(href: string, label: string): string {
    const safeHref = escapeHtml(href);
    const safeLabel = escapeHtml(label);

    return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:#18181b;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:40px;v-text-anchor:middle;width:180px;" arcsize="20%" stroke="f" fillcolor="#18181b">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:500;">${safeLabel}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${safeHref}" target="_blank" class="email-btn"
            style="display:inline-block;padding:11px 24px;background-color:#18181b;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;border:1px solid #18181b;letter-spacing:-0.1px;text-align:center;">
            ${safeLabel}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>`;
}

function metaRow(label: string, valueHtml: string, isLast = false): string {
    return `
    <tr>
      <td style="padding:${isLast ? "8px 0 0" : "8px 0"};font-size:13px;color:#71717a;vertical-align:middle;width:100px;" class="email-meta-label">
        ${escapeHtml(label)}
      </td>
      <td align="right" style="padding:${isLast ? "8px 0 0" : "8px 0"};font-size:13px;font-weight:500;color:#09090b;vertical-align:middle;" class="email-meta-val">
        ${valueHtml}
      </td>
    </tr>`;
}

function baseTemplate(options: BaseTemplateOptions): string {
    const safeTitle = escapeHtml(options.title);
    const safePreview = escapeHtml(options.previewText);
    const safeRecipientEmail = escapeHtml(options.recipientEmail);
    const safeFallbackUrl = options.fallbackUrl ? escapeHtml(options.fallbackUrl) : undefined;
    const siteUrl = escapeHtml(process.env.SITE_URL ?? "https://bettertodo.com");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-body-bg { background-color: #09090b !important; }
      .email-card { background-color: #121215 !important; border-color: #27272a !important; }
      .email-brand-text { color: #fafafa !important; }
      .email-title { color: #fafafa !important; }
      .email-text { color: #a1a1aa !important; }
      .email-meta-box { background-color: #18181b !important; border-color: #27272a !important; }
      .email-meta-label { color: #71717a !important; }
      .email-meta-val { color: #f4f4f5 !important; }
      .email-btn { background-color: #f4f4f5 !important; color: #09090b !important; border-color: #f4f4f5 !important; }
      .email-link { color: #818cf8 !important; }
      .email-footer-text { color: #71717a !important; }
      .email-badge { background-color: #27272a !important; border-color: #3f3f46 !important; color: #d4d4d8 !important; }
    }
  </style>
</head>
<body class="email-body-bg" style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

  <!-- Preheader text for inbox preview (clean, non-spammy structure) -->
  <div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${safePreview}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-body-bg" style="background-color:#f4f4f5;width:100%;">
    <tr>
      <td align="center" style="padding:48px 16px 40px;">
        <!--[if mso]>
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
        <![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;margin:0 auto;">

          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${siteUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:10px;">
                      <!-- Minimalist Brand Icon -->
                      <div style="width:28px;height:28px;border-radius:7px;background-color:#18181b;text-align:center;line-height:28px;">
                        <span style="color:#ffffff;font-size:13px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:-0.5px;">&#10003;</span>
                      </div>
                    </td>
                    <td style="vertical-align:middle;">
                      <span class="email-brand-text" style="font-size:16px;font-weight:600;color:#09090b;letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">BetterTodo</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td class="email-card" style="background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:36px 36px 32px;box-shadow:0 1px 3px 0 rgba(0,0,0,0.04);">

              <!-- TITLE & GREETING -->
              <h1 class="email-title" style="margin:0 0 16px;font-size:20px;font-weight:600;color:#09090b;letter-spacing:-0.3px;line-height:1.35;">
                ${escapeHtml(options.heading)}
              </h1>

              ${options.greeting ? `<p class="email-text" style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">${escapeHtml(options.greeting)}</p>` : ""}

              <!-- MESSAGE BODY -->
              <div class="email-text" style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
                ${options.bodyHtml}
              </div>

              <!-- METADATA BOX (IF PROVIDED) -->
              ${options.metaBoxHtml ? `
              <div class="email-meta-box" style="background-color:#f9fafb;border:1px solid #e4e4e7;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${options.metaBoxHtml}
                </table>
              </div>
              ` : ""}

              <!-- PRIMARY ACTION -->
              <div style="text-align:center;padding-top:4px;padding-bottom:12px;">
                ${options.actionButtonHtml}
              </div>

              <!-- OPTIONAL SUBTEXT -->
              ${options.subtextHtml ? `
              <p class="email-footer-text" style="margin:20px 0 0;font-size:13px;color:#71717a;text-align:center;line-height:1.5;">
                ${options.subtextHtml}
              </p>
              ` : ""}

              <!-- ACCESSIBILITY / DIRECT LINK FALLBACK -->
              ${safeFallbackUrl ? `
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
                <p class="email-footer-text" style="margin:0 0 6px;font-size:12px;color:#71717a;line-height:1.5;">
                  If the button above does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;">
                  <a href="${safeFallbackUrl}" class="email-link" style="color:#4f46e5;text-decoration:underline;word-break:break-all;">
                    ${safeFallbackUrl}
                  </a>
                </p>
              </div>
              ` : ""}

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p class="email-footer-text" style="margin:0 0 6px;font-size:12px;color:#71717a;line-height:1.5;">
                This email was sent to <span style="font-weight:500;">${safeRecipientEmail}</span>.
              </p>
              <p class="email-footer-text" style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                BetterTodo &bull; Task and project management
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// EMAIL ACTIONS
// ============================================

/**
 * Send a board invite email to a REGISTERED user.
 */
export const sendBoardInviteEmail = internalAction({
    args: {
        to: v.string(),
        recipientName: v.optional(v.string()),
        inviterName: v.string(),
        boardTitle: v.string(),
        boardId: v.string(),
        role: v.string(),
        inviteId: v.string(),
    },
    handler: async (_ctx, args) => {
        const resend = getResend();
        const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";
        const acceptUrl = `${siteUrl}/boards/${encodeURIComponent(args.boardId)}?acceptInvite=${encodeURIComponent(args.inviteId)}`;

        const safeInviterName = escapeHtml(args.inviterName);
        const safeBoardTitle = escapeHtml(args.boardTitle);
        const roleLabel = capitalize(args.role);

        const greeting = args.recipientName ? `Hi ${args.recipientName},` : "Hello,";

        const subject = `${args.inviterName} invited you to join ${args.boardTitle}`;
        const previewText = `${args.inviterName} invited you to collaborate on the ${args.boardTitle} board.`;

        const bodyHtml = `
          <strong>${safeInviterName}</strong> has invited you to collaborate on the <strong>${safeBoardTitle}</strong> board as a <strong>${escapeHtml(roleLabel)}</strong>.
        `;

        const metaBoxHtml = [
            metaRow("Board", safeBoardTitle),
            metaRow("Role", roleBadge(args.role)),
            metaRow("Invited by", safeInviterName, true),
        ].join("");

        const actionButtonHtml = actionButton(acceptUrl, "Accept Invitation");
        const subtextHtml = "You can also view and manage this invitation inside your BetterTodo notifications.";

        const html = baseTemplate({
            title: subject,
            previewText,
            heading: "Board invitation",
            greeting,
            bodyHtml,
            metaBoxHtml,
            actionButtonHtml,
            fallbackUrl: acceptUrl,
            subtextHtml,
            recipientEmail: args.to,
        });

        const text = [
            greeting,
            "",
            `${args.inviterName} has invited you to collaborate on the "${args.boardTitle}" board as a ${roleLabel}.`,
            "",
            `Board: ${args.boardTitle}`,
            `Role: ${roleLabel}`,
            `Invited by: ${args.inviterName}`,
            "",
            "Accept the invitation by clicking the link below:",
            acceptUrl,
            "",
            "---",
            `This notification was sent to ${args.to} regarding your BetterTodo account.`,
            "BetterTodo • Task and project management",
        ].join("\n");

        await resend.emails.send({
            from: getFromEmail(),
            to: args.to,
            subject,
            html,
            text,
        });
    },
});

/**
 * Send a board invite email to an UNREGISTERED user.
 */
export const sendBoardInviteEmailExternal = internalAction({
    args: {
        to: v.string(),
        recipientName: v.optional(v.string()),
        inviterName: v.string(),
        boardTitle: v.string(),
        role: v.string(),
        token: v.string(),
    },
    handler: async (_ctx, args) => {
        const resend = getResend();
        const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";
        const inviteUrl = `${siteUrl}/invite/${encodeURIComponent(args.token)}`;

        const safeInviterName = escapeHtml(args.inviterName);
        const safeBoardTitle = escapeHtml(args.boardTitle);
        const roleLabel = capitalize(args.role);

        const greeting = args.recipientName ? `Hi ${args.recipientName},` : "Hello,";

        const subject = `${args.inviterName} invited you to join ${args.boardTitle} on BetterTodo`;
        const previewText = `${args.inviterName} invited you to collaborate on ${args.boardTitle}.`;

        const bodyHtml = `
          <strong>${safeInviterName}</strong> has invited you to collaborate on the <strong>${safeBoardTitle}</strong> board on BetterTodo.
          Accept the invitation to access the board and collaborate with the team.
        `;

        const metaBoxHtml = [
            metaRow("Board", safeBoardTitle),
            metaRow("Role", roleBadge(args.role)),
            metaRow("Invited by", safeInviterName, true),
        ].join("");

        const actionButtonHtml = actionButton(inviteUrl, "View Invitation");
        const subtextHtml = "This invitation is personal to you. If you already have an account, sign in with this email to accept.";

        const html = baseTemplate({
            title: subject,
            previewText,
            heading: "You've been invited to collaborate",
            greeting,
            bodyHtml,
            metaBoxHtml,
            actionButtonHtml,
            fallbackUrl: inviteUrl,
            subtextHtml,
            recipientEmail: args.to,
        });

        const text = [
            greeting,
            "",
            `${args.inviterName} has invited you to collaborate on the "${args.boardTitle}" board on BetterTodo as a ${roleLabel}.`,
            "",
            `Board: ${args.boardTitle}`,
            `Role: ${roleLabel}`,
            `Invited by: ${args.inviterName}`,
            "",
            "View and accept your invitation here:",
            inviteUrl,
            "",
            "---",
            `This invitation was sent to ${args.to}. If you were not expecting this, you can safely ignore this email.`,
            "BetterTodo • Task and project management",
        ].join("\n");

        await resend.emails.send({
            from: getFromEmail(),
            to: args.to,
            subject,
            html,
            text,
        });
    },
});

/**
 * Send a board assignment email when a user is assigned to a card.
 */
export const sendCardAssignmentEmail = internalAction({
    args: {
        to: v.string(),
        recipientName: v.optional(v.string()),
        assignerName: v.string(),
        cardTitle: v.string(),
        boardTitle: v.string(),
        boardId: v.string(),
        cardId: v.string(),
    },
    handler: async (_ctx, args) => {
        const resend = getResend();
        const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";
        const cardUrl = `${siteUrl}/boards/${encodeURIComponent(args.boardId)}?card=${encodeURIComponent(args.cardId)}`;

        const safeAssignerName = escapeHtml(args.assignerName);
        const safeCardTitle = escapeHtml(args.cardTitle);
        const safeBoardTitle = escapeHtml(args.boardTitle);

        const greeting = args.recipientName ? `Hi ${args.recipientName},` : "Hello,";

        const subject = `${args.assignerName} assigned you to "${args.cardTitle}"`;
        const previewText = `${args.assignerName} assigned you to "${args.cardTitle}" in ${args.boardTitle}.`;

        const bodyHtml = `
          <strong>${safeAssignerName}</strong> assigned you to a card in <strong>${safeBoardTitle}</strong>.
        `;

        const metaBoxHtml = [
            metaRow("Card", safeCardTitle),
            metaRow("Board", safeBoardTitle),
            metaRow("Assigned by", safeAssignerName, true),
        ].join("");

        const actionButtonHtml = actionButton(cardUrl, "View Card");

        const html = baseTemplate({
            title: subject,
            previewText,
            heading: "Card assignment",
            greeting,
            bodyHtml,
            metaBoxHtml,
            actionButtonHtml,
            fallbackUrl: cardUrl,
            recipientEmail: args.to,
        });

        const text = [
            greeting,
            "",
            `${args.assignerName} assigned you to "${args.cardTitle}" in "${args.boardTitle}".`,
            "",
            `Card: ${args.cardTitle}`,
            `Board: ${args.boardTitle}`,
            `Assigned by: ${args.assignerName}`,
            "",
            "View the card by visiting:",
            cardUrl,
            "",
            "---",
            `This notification was sent to ${args.to} regarding activity on your BetterTodo board.`,
            "BetterTodo • Task and project management",
        ].join("\n");

        await resend.emails.send({
            from: getFromEmail(),
            to: args.to,
            subject,
            html,
            text,
        });
    },
});

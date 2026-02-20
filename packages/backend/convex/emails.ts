"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// ============================================
// HELPERS
// ============================================

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY environment variable is not set");
  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.FROM_EMAIL ?? "onboarding@resend.dev";
}

const BRAND_ACCENT = "#6366f1"; // indigo-500

// ============================================
// SHARED TEMPLATE STRUCTURE
// ============================================

function baseTemplate(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preview text hack -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#0f0f13;">${previewText}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f0f13;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">

          <!-- LOGO / HEADER -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${process.env.SITE_URL ?? "#"}" style="text-decoration:none;">
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <div style="width:36px;height:36px;border-radius:10px;background:${BRAND_ACCENT};display:inline-block;"></div>
                  <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">BetterTodo</span>
                </div>
              </a>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#18181f;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">
                You're receiving this email because someone invited you via BetterTodo.<br/>
                If you think this is a mistake, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" target="_blank"
      style="display:inline-block;padding:14px 32px;background:${BRAND_ACCENT};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.1px;">
      ${label}
    </a>`;
}

function secondaryButton(href: string, label: string): string {
  return `<a href="${href}" target="_blank"
      style="display:inline-block;padding:11px 24px;background:transparent;color:#a1a1aa;font-size:13px;font-weight:500;text-decoration:none;border-radius:8px;border:1px solid #3f3f46;letter-spacing:0.1px;">
      ${label}
    </a>`;
}

function roleBadge(role: string): string {
  const colors: Record<string, string> = {
    admin: "#7c3aed",
    member: "#0284c7",
    viewer: "#059669",
  };
  const bg = colors[role] ?? "#6366f1";
  return `<span style="display:inline-block;padding:3px 10px;background:${bg}22;color:${bg};font-size:11px;font-weight:600;border-radius:20px;border:1px solid ${bg}44;letter-spacing:0.5px;text-transform:uppercase;">${role}</span>`;
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
    const acceptUrl = `${siteUrl}/boards/${args.boardId}?acceptInvite=${args.inviteId}`;

    const greeting = args.recipientName ? `Hi ${args.recipientName},` : "Hello,";

    const content = `
      <!-- GRADIENT TOP BAR -->
      <div style="height:4px;background:linear-gradient(90deg,${BRAND_ACCENT},#8b5cf6,#ec4899);"></div>

      <!-- BODY PADDING -->
      <div style="padding:40px 40px 36px;">

        <!-- ICON -->
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:#1e1e2e;border:2px solid #3f3f46;text-align:center;line-height:64px;font-size:32px;">🔗</div>
        </div>

        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f4f4f5;text-align:center;letter-spacing:-0.5px;">You've been invited!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#a1a1aa;text-align:center;line-height:1.6;">
          ${greeting.replace(/^Hi |Hello,/, '')}
          <strong style="color:#e4e4e7;">${args.inviterName}</strong> has invited you to collaborate on a board.
        </p>

        <!-- BOARD INFO CARD -->
        <div style="background:#0f0f13;border:1px solid #27272a;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Board</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#f4f4f5;">${args.boardTitle}</p>
              </td>
              <td align="right" valign="middle">
                ${roleBadge(args.role)}
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA BUTTON -->
        <div style="text-align:center;margin-bottom:24px;">
          ${ctaButton(acceptUrl, "Accept Invitation")}
        </div>

        <p style="margin:0;font-size:13px;color:#52525b;text-align:center;line-height:1.6;">
          You can also view this invite inside the app under <strong style="color:#71717a;">Notifications</strong>.
        </p>
      </div>`;

    await resend.emails.send({
      from: getFromEmail(),
      to: args.to,
      subject: `${args.inviterName} invited you to "${args.boardTitle}" on BetterTodo`,
      html: baseTemplate(content, `${args.inviterName} invited you to join "${args.boardTitle}"`),
    });
  },
});

/**
 * Send a board invite email to an UNREGISTERED user (with signup CTA).
 */
export const sendBoardInviteEmailExternal = internalAction({
  args: {
    to: v.string(),
    inviterName: v.string(),
    boardTitle: v.string(),
    role: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";
    // After signing up/in, they'll be redirected and the invite auto-accepted
    const inviteUrl = `${siteUrl}/sign-in?inviteToken=${args.token}`;

    const content = `
      <!-- GRADIENT TOP BAR -->
      <div style="height:4px;background:linear-gradient(90deg,${BRAND_ACCENT},#8b5cf6,#ec4899);"></div>

      <div style="padding:40px 40px 36px;">

        <!-- ICON -->
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:#1e1e2e;border:2px solid #3f3f46;text-align:center;line-height:64px;font-size:32px;">🚀</div>
        </div>

        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f4f4f5;text-align:center;letter-spacing:-0.5px;">You're invited to collaborate!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#a1a1aa;text-align:center;line-height:1.6;">
          <strong style="color:#e4e4e7;">${args.inviterName}</strong> wants you to join their board on BetterTodo — a smarter way to manage tasks together.
        </p>

        <!-- BOARD INFO CARD -->
        <div style="background:#0f0f13;border:1px solid #27272a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Board</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#f4f4f5;">${args.boardTitle}</p>
              </td>
              <td align="right" valign="middle">
                ${roleBadge(args.role)}
              </td>
            </tr>
          </table>
        </div>

        <!-- STEPS -->
        <div style="background:#0f0f13;border:1px solid #27272a;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.6px;">How it works</p>
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding:4px 0;vertical-align:top;">
                <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${BRAND_ACCENT};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:10px;">1</span>
              </td>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:14px;color:#d4d4d8;line-height:22px;">Create a free account (takes 30 seconds)</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;vertical-align:top;">
                <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${BRAND_ACCENT};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:10px;">2</span>
              </td>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:14px;color:#d4d4d8;line-height:22px;">You'll be automatically added to the board</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;vertical-align:top;">
                <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${BRAND_ACCENT};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:10px;">3</span>
              </td>
              <td style="padding:4px 0;">
                <p style="margin:0;font-size:14px;color:#d4d4d8;line-height:22px;">Start collaborating with ${args.inviterName}</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA BUTTONS -->
        <div style="text-align:center;margin-bottom:16px;">
          ${ctaButton(inviteUrl, "Accept & Create Account")}
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          ${secondaryButton(inviteUrl, "Sign in instead (I already have an account)")}
        </div>

        <p style="margin:0;font-size:12px;color:#52525b;text-align:center;line-height:1.6;">
          This invite link is secure and unique to you. It will expire in 7 days.
        </p>
      </div>`;

    await resend.emails.send({
      from: getFromEmail(),
      to: args.to,
      subject: `${args.inviterName} invited you to collaborate on BetterTodo`,
      html: baseTemplate(
        content,
        `${args.inviterName} invited you to join "${args.boardTitle}" on BetterTodo`
      ),
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
    const cardUrl = `${siteUrl}/boards/${args.boardId}?card=${args.cardId}`;

    const greeting = args.recipientName ? `Hi ${args.recipientName}` : "Hello";

    const content = `
      <!-- GRADIENT TOP BAR -->
      <div style="height:4px;background:linear-gradient(90deg,${BRAND_ACCENT},#8b5cf6,#ec4899);"></div>

      <div style="padding:40px 40px 36px;">

        <!-- ICON -->
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:#1e1e2e;border:2px solid #3f3f46;text-align:center;line-height:64px;font-size:32px;">📌</div>
        </div>

        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f4f4f5;text-align:center;letter-spacing:-0.5px;">You were assigned a task!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#a1a1aa;text-align:center;line-height:1.6;">
          ${greeting}, <strong style="color:#e4e4e7;">${args.assignerName}</strong> assigned you to a card.
        </p>

        <!-- CONTEXT CARD -->
        <div style="background:#0f0f13;border:1px solid #27272a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Board</p>
                <p style="margin:0;font-size:13px;font-weight:600;color:#d4d4d8;">${args.boardTitle}</p>
              </td>
              <td align="right">
                <p style="margin:0 0 2px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Card</p>
                <p style="margin:0;font-size:13px;font-weight:600;color:#d4d4d8;">${args.cardTitle}</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA BUTTON -->
        <div style="text-align:center;margin-bottom:24px;">
          ${ctaButton(cardUrl, "View Card")}
        </div>

        <p style="margin:0;font-size:13px;color:#52525b;text-align:center;line-height:1.6;">
          Go to <strong style="color:#71717a;">${args.boardTitle}</strong> → <strong style="color:#71717a;">${args.cardTitle}</strong> to view details.
        </p>
      </div>`;

    await resend.emails.send({
      from: getFromEmail(),
      to: args.to,
      subject: `${args.assignerName} assigned you to "${args.cardTitle}"`,
      html: baseTemplate(
        content,
        `You were assigned to "${args.cardTitle}"`
      ),
    });
  },
});

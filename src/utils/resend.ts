import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Seisei <noreply@seisei.me>';

/* ------------------------------------------------------------------ */
/*  Core send helper                                                   */
/* ------------------------------------------------------------------ */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, replyTo, from }: SendEmailOptions) {
  const fromAddress = from
    ? `${from}@seisei.me`
    : FROM_EMAIL;

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(replyTo && { reply_to: replyTo }),
  });

  if (error) {
    console.error('[email] Failed to send:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  console.log('[email] Sent successfully, id:', data?.id);
  return data;
}

/* ------------------------------------------------------------------ */
/*  Email templates                                                    */
/* ------------------------------------------------------------------ */

/**
 * Welcome email sent after Stripe checkout with temporary login credentials.
 */
export async function sendWelcomeEmail(
  email: string,
  tempPassword: string,
  brandName?: string,
) {
  const loginUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://seisei.me' : 'http://localhost:3000'}/login`;

  return sendEmail({
    to: email,
    subject: 'Seiseiへようこそ！アカウント情報',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="background:#000;padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">生成 Seisei</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111;">ようこそ${brandName ? ` ${brandName} 様` : ''}！</h2>
            <p style="color:#6b7280;line-height:1.6;">
              アカウントが作成されました。以下の仮パスワードでログインし、ダッシュボードからパスワードを変更してください。
            </p>
            <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">メールアドレス</p>
              <p style="margin:0 0 16px;font-size:16px;color:#111;font-weight:600;">${email}</p>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">仮パスワード</p>
              <p style="margin:0;font-size:16px;color:#111;font-family:monospace;font-weight:600;">${tempPassword}</p>
            </div>
            <a href="${loginUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              ログインする
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
              セキュリティのため、ログイン後すぐにパスワードを変更してください。
            </p>
          </div>
          <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © 2026 Seisei — AI Fashion Image Generator
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Password reset confirmation (optional — Supabase handles the reset link,
 * this can be used for a custom follow-up).
 */
export async function sendPasswordChangedEmail(email: string) {
  return sendEmail({
    to: email,
    subject: 'パスワードが変更されました',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="background:#000;padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">生成 Seisei</h1>
          </div>
          <div style="padding:40px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111;">パスワードが変更されました</h2>
            <p style="color:#6b7280;line-height:1.6;">
              お客様のアカウントのパスワードが正常に変更されました。
              この変更に心当たりがない場合は、すぐにサポートまでご連絡ください。
            </p>
          </div>
          <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © 2026 Seisei — AI Fashion Image Generator
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Generic notification email.
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string,
) {
  return sendEmail({
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="background:#000;padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">生成 Seisei</h1>
          </div>
          <div style="padding:40px;">
            <p style="color:#374151;line-height:1.6;font-size:15px;">${message}</p>
          </div>
          <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © 2026 Seisei — AI Fashion Image Generator
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

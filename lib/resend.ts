// lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Menjaj ovu adresu tek kad Resend potvrdi da je getlicensedright.com
// verifikovan (Domains tab pokazuje "Verified"), inače slanje puca.
export const FROM_EMAIL = "LicensedRight <reminders@getlicensedright.com>";

const REMINDER_LABELS: Record<string, string> = {
  "90_day": "90 days",
  "60_day": "60 days",
  "30_day": "30 days",
  "7_day": "7 days",
};

export async function sendAgencyInviteEmail(params: {
  to: string;
  agencyName: string;
  inviteUrl: string;
  fallbackUrl?: string;
}) {
  const { to, agencyName, inviteUrl, fallbackUrl } = params;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been invited to join ${agencyName} on LicensedRight`,
    html: `
      <div style="background:#EDEFEA; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <table role="presentation" width="100%" style="max-width:440px; margin:0 auto; background:#FFFFFF; border:1px solid #D6D9D0; border-radius:10px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-family:Georgia,serif; font-weight:700; font-size:18px; color:#16232E;">
                <span style="display:inline-block; width:14px; height:14px; border-radius:3px; background:#B8842E; margin-right:8px; vertical-align:middle;"></span>
                <span style="vertical-align:middle;">LicensedRight</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <h1 style="font-family:Georgia,serif; font-weight:600; font-size:20px; color:#16232E; margin:0 0 12px 0;">
                You've been invited to ${agencyName}
              </h1>
              <p style="font-size:14.5px; line-height:1.6; color:#5B6670; margin:0 0 24px 0;">
                Join to start tracking your CE hours, license renewals, E&O insurance, and carrier appointments on LicensedRight, as part of your team's plan.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <a href="${inviteUrl}"
                 style="display:inline-block; background:#16232E; color:#EDEFEA; text-decoration:none; font-size:14.5px; font-weight:600; padding:12px 24px; border-radius:6px;">
                Accept invite
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px; border-top:1px solid #D6D9D0; padding-top:20px;">
              <p style="font-size:12.5px; line-height:1.6; color:#5B6670; margin:0;">
                If you weren't expecting this, you can safely ignore this email.
                ${
                  fallbackUrl
                    ? ` If the button above has expired, <a href="${fallbackUrl}" style="color:#16232E;">use this link instead</a>.`
                    : ""
                }
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

export async function sendLicenseReminderEmail(params: {
  to: string;
  stateCode: string;
  licenseType: string;
  daysUntilExpiration: number;
  reminderType: string;
  dashboardUrl: string;
}) {
  const { to, stateCode, licenseType, daysUntilExpiration, reminderType, dashboardUrl } = params;
  const label = REMINDER_LABELS[reminderType] ?? `${daysUntilExpiration} days`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${stateCode} ${licenseType} license expires in ${daysUntilExpiration} days`,
    html: `
      <div style="background:#EDEFEA; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <table role="presentation" width="100%" style="max-width:440px; margin:0 auto; background:#FFFFFF; border:1px solid #D6D9D0; border-radius:10px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-family:Georgia,serif; font-weight:700; font-size:18px; color:#16232E;">
                <span style="display:inline-block; width:14px; height:14px; border-radius:3px; background:#B8842E; margin-right:8px; vertical-align:middle;"></span>
                <span style="vertical-align:middle;">LicensedRight</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <h1 style="font-family:Georgia,serif; font-weight:600; font-size:20px; color:#16232E; margin:0 0 12px 0;">
                Your ${stateCode} ${licenseType} license expires in ${daysUntilExpiration} days
              </h1>
              <p style="font-size:14.5px; line-height:1.6; color:#5B6670; margin:0 0 24px 0;">
                This is your ${label} reminder. Check your dashboard to see exactly how many CE hours you still need before it renews.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <a href="${dashboardUrl}"
                 style="display:inline-block; background:#16232E; color:#EDEFEA; text-decoration:none; font-size:14.5px; font-weight:600; padding:12px 24px; border-radius:6px;">
                View my dashboard
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px; border-top:1px solid #D6D9D0; padding-top:20px;">
              <p style="font-size:12.5px; line-height:1.6; color:#5B6670; margin:0;">
                You're receiving this because you're tracking this license on LicensedRight.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
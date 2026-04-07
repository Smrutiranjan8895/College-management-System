// Custom Message Lambda Trigger for Cognito
// Handles sign up verification, resend code, and forgot-password messages.

const BRAND = 'GCEK Central';
const INSTITUTE = 'Government College of Engineering Kalahandi';

function buildEmailTemplate({
  title,
  intro,
  codeLabel,
  codeParameter,
  expiryText,
  note,
  accent,
}) {
  const year = new Date().getUTCFullYear();

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background:#eef2ff;font-family:Segoe UI,Arial,sans-serif;color:#1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                <tr>
                  <td style="background:${accent};padding:24px 28px;color:#ffffff;">
                    <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.9;">${BRAND}</div>
                    <div style="font-size:24px;font-weight:700;line-height:1.35;margin-top:6px;">${title}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">${intro}</p>

                    <div style="margin:18px 0;padding:16px;border:1px dashed ${accent};border-radius:12px;background:#f8fafc;text-align:center;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#475569;margin-bottom:8px;">${codeLabel}</div>
                      <div style="font-size:34px;font-weight:800;letter-spacing:6px;color:#0f172a;line-height:1;">${codeParameter}</div>
                    </div>

                    <p style="margin:0 0 10px 0;font-size:14px;line-height:1.65;">${expiryText}</p>
                    <p style="margin:0;font-size:13px;line-height:1.65;color:#64748b;">${note}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.6;">
                    <div>${BRAND} | ${INSTITUTE}</div>
                    <div style="margin-top:4px;">This is an automated security message. Do not share this code with anyone.</div>
                    <div style="margin-top:6px;">${year}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export const handler = async (event) => {
  console.log('CustomMessage trigger:', JSON.stringify(event, null, 2));

  const { triggerSource, request, response } = event;
  const { codeParameter } = request;

  if (triggerSource === 'CustomMessage_SignUp') {
    response.smsMessage = `GCEK Central verification code: ${codeParameter}. This code is valid for 24 hours.`;
    response.emailSubject = 'Welcome to GCEK Central - Verify Your Email Address';
    response.emailMessage = buildEmailTemplate({
      title: 'Verify your email address',
      intro: 'Thank you for creating your GCEK Central account. Enter the verification code below to activate your account.',
      codeLabel: 'Verification code',
      codeParameter,
      expiryText: 'This verification code expires in 24 hours.',
      note: "If you did not create this account, you can safely ignore this email.",
      accent: '#1d4ed8',
    });
  } else if (triggerSource === 'CustomMessage_ResendCode') {
    response.smsMessage = `GCEK Central new verification code: ${codeParameter}. This code is valid for 24 hours.`;
    response.emailSubject = 'GCEK Central - Your New Verification Code';
    response.emailMessage = buildEmailTemplate({
      title: 'Your new verification code',
      intro: 'You requested a new verification code for your GCEK Central account. Use this code to continue.',
      codeLabel: 'Verification code',
      codeParameter,
      expiryText: 'This verification code expires in 24 hours.',
      note: 'For your security, always use only the latest code you receive.',
      accent: '#2563eb',
    });
  } else if (triggerSource === 'CustomMessage_ForgotPassword') {
    response.smsMessage = `GCEK Central password reset code: ${codeParameter}. This code is valid for 1 hour.`;
    response.emailSubject = 'GCEK Central - Password Reset Code';
    response.emailMessage = buildEmailTemplate({
      title: 'Reset your password',
      intro: 'We received a password reset request for your GCEK Central account. Use the code below to proceed.',
      codeLabel: 'Password reset code',
      codeParameter,
      expiryText: 'This reset code expires in 1 hour.',
      note: 'If you did not request this action, please ignore this email and keep your account credentials secure.',
      accent: '#dc2626',
    });
  }

  return event;
};

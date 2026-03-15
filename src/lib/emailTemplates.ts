/**
 * Email Templates for Osassy's Kitchen
 *
 * Brand Colours:
 * - Primary: #C52D2F (Deep Red)
 * - Secondary: #F1C40F (Warm Yellow)
 * - Accent: #FF6F3C (Bright Orange)
 * - Background: #F9F9F9
 * - Text: #333333
 */

// Brand constants
const BRAND = {
  name: "Osassy's Kitchen",
  primaryColour: '#C52D2F',
  secondaryColour: '#F1C40F',
  accentColour: '#FF6F3C',
  backgroundColour: '#F9F9F9',
  textColour: '#333333',
  lightText: '#666666',
  white: '#FFFFFF',
  borderColour: '#E5E5E5',
};

/**
 * Base email layout wrapper
 */
function getEmailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND.name}</title>
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
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: ${BRAND.backgroundColour};
    }
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 16px !important;
      }
      .content {
        padding: 24px !important;
      }
      .button {
        width: 100% !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.backgroundColour}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.backgroundColour};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: ${BRAND.primaryColour}; border-radius: 8px; padding: 16px 32px;">
                    <h1 style="margin: 0; color: ${BRAND.white}; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      ${BRAND.name}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.white}; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td class="content" style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="color: ${BRAND.lightText}; font-size: 14px; text-align: center; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0;">
                      &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      Authentic Nigerian Cuisine, Delivered Fresh
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Create a styled button
 */
function getButton(text: string, url: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
  <tr>
    <td align="center">
      <a href="${url}" target="_blank" class="button" style="background-color: ${BRAND.primaryColour}; color: ${BRAND.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; mso-padding-alt: 0;">
        <!--[if mso]>
        <i style="letter-spacing: 40px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i>
        <![endif]-->
        <span style="mso-text-raise: 15pt;">${text}</span>
        <!--[if mso]>
        <i style="letter-spacing: 40px; mso-font-width: -100%;">&nbsp;</i>
        <![endif]-->
      </a>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Get verification email HTML template
 *
 * @param name - User's name
 * @param verificationUrl - URL to verify the email
 * @returns HTML email content
 */
export function getVerificationEmailHtml(name: string, verificationUrl: string): string {
  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  Welcome to ${BRAND.name}! 🍲
</h2>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  Hello ${name},
</p>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  Thank you for signing up with ${BRAND.name}! We're excited to have you join our family of food lovers who appreciate authentic Nigerian cuisine.
</p>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  To complete your registration and start exploring our delicious meal plans, please verify your email address by clicking the button below:
</p>

${getButton('Verify Email Address', verificationUrl)}

<p style="margin: 0 0 16px 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  This verification link will expire in 24 hours for security reasons.
</p>

<p style="margin: 0 0 16px 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  If you didn't create an account with ${BRAND.name}, you can safely ignore this email.
</p>

<hr style="border: none; border-top: 1px solid ${BRAND.borderColour}; margin: 24px 0;">

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 12px; line-height: 1.6;">
  If the button above doesn't work, copy and paste this link into your browser:<br>
  <a href="${verificationUrl}" style="color: ${BRAND.primaryColour}; word-break: break-all;">${verificationUrl}</a>
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get verification email plain text template
 *
 * @param name - User's name
 * @param verificationUrl - URL to verify the email
 * @returns Plain text email content
 */
export function getVerificationEmailText(name: string, verificationUrl: string): string {
  return `
Welcome to ${BRAND.name}!

Hello ${name},

Thank you for signing up with ${BRAND.name}! We're excited to have you join our family of food lovers who appreciate authentic Nigerian cuisine.

To complete your registration and start exploring our delicious meal plans, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with ${BRAND.name}, you can safely ignore this email.

---
© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
Authentic Nigerian Cuisine, Delivered Fresh
`.trim();
}

/**
 * Get password reset email HTML template
 *
 * @param name - User's name
 * @param resetUrl - URL to reset the password
 * @returns HTML email content
 */
export function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  Reset Your Password
</h2>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  Hello ${name},
</p>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  We received a request to reset the password for your ${BRAND.name} account. If you made this request, click the button below to create a new password:
</p>

${getButton('Reset Password', resetUrl)}

<p style="margin: 0 0 16px 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  This password reset link will expire in 1 hour for security reasons.
</p>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background-color: #FFF9E6; border-radius: 8px; border-left: 4px solid ${BRAND.secondaryColour};">
  <tr>
    <td style="padding: 16px;">
      <p style="margin: 0; color: ${BRAND.textColour}; font-size: 14px; line-height: 1.6;">
        <strong>Security Tip:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged, and your account is secure.
      </p>
    </td>
  </tr>
</table>

<p style="margin: 0 0 16px 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  If you continue to receive these emails without requesting them, please contact our support team.
</p>

<hr style="border: none; border-top: 1px solid ${BRAND.borderColour}; margin: 24px 0;">

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 12px; line-height: 1.6;">
  If the button above doesn't work, copy and paste this link into your browser:<br>
  <a href="${resetUrl}" style="color: ${BRAND.primaryColour}; word-break: break-all;">${resetUrl}</a>
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get password reset email plain text template
 *
 * @param name - User's name
 * @param resetUrl - URL to reset the password
 * @returns Plain text email content
 */
export function getPasswordResetEmailText(name: string, resetUrl: string): string {
  return `
Reset Your Password

Hello ${name},

We received a request to reset the password for your ${BRAND.name} account. If you made this request, click the link below to create a new password:

${resetUrl}

This password reset link will expire in 1 hour for security reasons.

SECURITY TIP: If you didn't request a password reset, please ignore this email. Your password will remain unchanged, and your account is secure.

If you continue to receive these emails without requesting them, please contact our support team.

---
© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
Authentic Nigerian Cuisine, Delivered Fresh
`.trim();
}

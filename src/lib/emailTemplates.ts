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

/**
 * Contact form submission data
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Get contact form support notification email HTML template
 * This is sent to the support team when someone submits the contact form
 *
 * @param data - Contact form submission data
 * @returns HTML email content
 */
export function getContactSupportEmailHtml(data: ContactFormData): string {
  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  New Contact Form Submission 📬
</h2>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px;">
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">From:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.name}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Email:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">
        <a href="mailto:${data.email}" style="color: ${BRAND.primaryColour};">${data.email}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Subject:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.subject}</p>
    </td>
  </tr>
</table>

<div style="background-color: ${BRAND.backgroundColour}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
  <strong style="color: ${BRAND.lightText}; font-size: 14px; display: block; margin-bottom: 8px;">Message:</strong>
  <p style="margin: 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
</div>

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  <strong>Reply directly</strong> to this email to respond to the customer, or click the email address above.
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get contact form support notification email plain text template
 *
 * @param data - Contact form submission data
 * @returns Plain text email content
 */
export function getContactSupportEmailText(data: ContactFormData): string {
  return `
New Contact Form Submission

From: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Reply directly to this email to respond to the customer.

© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
`.trim();
}

/**
 * Get contact form confirmation email HTML template
 * This is sent to the customer to confirm we received their message
 *
 * @param data - Contact form submission data
 * @returns HTML email content
 */
export function getContactConfirmationEmailHtml(data: ContactFormData): string {
  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  We've Received Your Message! ✉️
</h2>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  Hello ${data.name},
</p>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  Thank you for reaching out to ${BRAND.name}! We've received your message and our team will get back to you as soon as possible.
</p>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background-color: ${BRAND.backgroundColour}; border-radius: 8px; border-left: 4px solid ${BRAND.primaryColour};">
  <tr>
    <td style="padding: 16px;">
      <p style="margin: 0 0 8px 0; color: ${BRAND.lightText}; font-size: 14px;">
        <strong>Your message:</strong>
      </p>
      <p style="margin: 0 0 12px 0; color: ${BRAND.textColour}; font-size: 14px;">
        <strong>Subject:</strong> ${data.subject}
      </p>
      <p style="margin: 0; color: ${BRAND.textColour}; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message.length > 200 ? data.message.substring(0, 200) + '...' : data.message}</p>
    </td>
  </tr>
</table>

<p style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.6;">
  <strong>What happens next?</strong>
</p>

<ul style="margin: 0 0 24px 0; padding-left: 20px; color: ${BRAND.textColour}; font-size: 16px; line-height: 1.8;">
  <li>Our team will review your message</li>
  <li>We typically respond within 24 hours during business days</li>
  <li>For urgent matters, you can reach us on WhatsApp</li>
</ul>

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  If you have any additional information to add, simply reply to this email.
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get contact form confirmation email plain text template
 *
 * @param data - Contact form submission data
 * @returns Plain text email content
 */
export function getContactConfirmationEmailText(data: ContactFormData): string {
  return `
We've Received Your Message!

Hello ${data.name},

Thank you for reaching out to ${BRAND.name}! We've received your message and our team will get back to you as soon as possible.

Your message:
Subject: ${data.subject}
${data.message.length > 200 ? data.message.substring(0, 200) + '...' : data.message}

What happens next?
- Our team will review your message
- We typically respond within 24 hours during business days
- For urgent matters, you can reach us on WhatsApp

If you have any additional information to add, simply reply to this email.

---
© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
Authentic Nigerian Cuisine, Delivered Fresh
`.trim();
}

// =============================================================================
// ADMIN NOTIFICATION TEMPLATES
// =============================================================================

/**
 * Order item data for admin notifications
 */
export interface OrderItemData {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Order data for admin notifications
 */
export interface AdminOrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemData[];
  totalPrice: number;
  deliveryDate: string;
  deliveryAddress?: string;
}

/**
 * Get new order notification email HTML template for admin
 */
export function getAdminNewOrderEmailHtml(data: AdminOrderData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.borderColour}; color: ${BRAND.textColour}; font-size: 14px;">
        ${item.name}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.borderColour}; color: ${BRAND.textColour}; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.borderColour}; color: ${BRAND.textColour}; font-size: 14px; text-align: right;">
        ₦${item.price.toLocaleString()}
      </td>
    </tr>
  `).join('');

  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  New Order Received! 🎉
</h2>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 4px solid #22c55e;">
  <tr>
    <td style="padding: 16px;">
      <p style="margin: 0; color: ${BRAND.textColour}; font-size: 16px; font-weight: 600;">
        Order #${data.orderId.slice(-6).toUpperCase()}
      </p>
    </td>
  </tr>
</table>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px;">
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Customer:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.customerName}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Email:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">
        <a href="mailto:${data.customerEmail}" style="color: ${BRAND.primaryColour};">${data.customerEmail}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Delivery Date:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.deliveryDate}</p>
    </td>
  </tr>
  ${data.deliveryAddress ? `
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Delivery Address:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.deliveryAddress}</p>
    </td>
  </tr>
  ` : ''}
</table>

<h3 style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 18px; font-weight: 600;">
  Order Items
</h3>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 16px;">
  <thead>
    <tr>
      <th style="padding: 8px 0; border-bottom: 2px solid ${BRAND.borderColour}; color: ${BRAND.lightText}; font-size: 12px; text-transform: uppercase; text-align: left;">Item</th>
      <th style="padding: 8px 0; border-bottom: 2px solid ${BRAND.borderColour}; color: ${BRAND.lightText}; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
      <th style="padding: 8px 0; border-bottom: 2px solid ${BRAND.borderColour}; color: ${BRAND.lightText}; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHtml}
  </tbody>
</table>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px; background-color: ${BRAND.backgroundColour}; border-radius: 8px;">
  <tr>
    <td style="padding: 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
        <tr>
          <td style="color: ${BRAND.textColour}; font-size: 18px; font-weight: 700;">Total</td>
          <td style="color: ${BRAND.primaryColour}; font-size: 18px; font-weight: 700; text-align: right;">₦${data.totalPrice.toLocaleString()}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  Log in to the admin dashboard to manage this order.
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get new order notification email plain text template for admin
 */
export function getAdminNewOrderEmailText(data: AdminOrderData): string {
  const itemsList = data.items.map(item => `- ${item.name} x${item.quantity} - ₦${item.price.toLocaleString()}`).join('\n');

  return `
New Order Received!

Order #${data.orderId.slice(-6).toUpperCase()}

Customer: ${data.customerName}
Email: ${data.customerEmail}
Delivery Date: ${data.deliveryDate}
${data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}` : ''}

Order Items:
${itemsList}

Total: ₦${data.totalPrice.toLocaleString()}

Log in to the admin dashboard to manage this order.

---
© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
`.trim();
}

/**
 * Subscription data for admin notifications
 */
export interface AdminSubscriptionData {
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  interval: string;
  price: number;
  startDate: string;
  items?: OrderItemData[];
}

/**
 * Get new subscription notification email HTML template for admin
 */
export function getAdminNewSubscriptionEmailHtml(data: AdminSubscriptionData): string {
  const itemsHtml = data.items ? data.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.borderColour}; color: ${BRAND.textColour}; font-size: 14px;">
        ${item.name}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid ${BRAND.borderColour}; color: ${BRAND.textColour}; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
    </tr>
  `).join('') : '';

  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  New Subscription! 🎊
</h2>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
  <tr>
    <td style="padding: 16px;">
      <p style="margin: 0; color: ${BRAND.textColour}; font-size: 16px; font-weight: 600;">
        A new customer has subscribed to ${data.planName}!
      </p>
    </td>
  </tr>
</table>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px;">
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Customer:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.customerName}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Email:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">
        <a href="mailto:${data.customerEmail}" style="color: ${BRAND.primaryColour};">${data.customerEmail}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Plan:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.planName}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Billing Interval:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.interval}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Start Date:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.startDate}</p>
    </td>
  </tr>
</table>

${data.items && data.items.length > 0 ? `
<h3 style="margin: 0 0 16px 0; color: ${BRAND.textColour}; font-size: 18px; font-weight: 600;">
  Selected Meals
</h3>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 16px;">
  <thead>
    <tr>
      <th style="padding: 8px 0; border-bottom: 2px solid ${BRAND.borderColour}; color: ${BRAND.lightText}; font-size: 12px; text-transform: uppercase; text-align: left;">Item</th>
      <th style="padding: 8px 0; border-bottom: 2px solid ${BRAND.borderColour}; color: ${BRAND.lightText}; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHtml}
  </tbody>
</table>
` : ''}

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px; background-color: ${BRAND.backgroundColour}; border-radius: 8px;">
  <tr>
    <td style="padding: 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
        <tr>
          <td style="color: ${BRAND.textColour}; font-size: 18px; font-weight: 700;">${data.interval} Price</td>
          <td style="color: ${BRAND.primaryColour}; font-size: 18px; font-weight: 700; text-align: right;">₦${data.price.toLocaleString()}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  Log in to the admin dashboard to view subscription details.
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get new subscription notification email plain text template for admin
 */
export function getAdminNewSubscriptionEmailText(data: AdminSubscriptionData): string {
  const itemsList = data.items ? data.items.map(item => `- ${item.name} x${item.quantity}`).join('\n') : '';

  return `
New Subscription!

A new customer has subscribed to ${data.planName}!

Customer: ${data.customerName}
Email: ${data.customerEmail}
Plan: ${data.planName}
Billing Interval: ${data.interval}
Start Date: ${data.startDate}
${data.interval} Price: ₦${data.price.toLocaleString()}

${itemsList ? `Selected Meals:\n${itemsList}` : ''}

Log in to the admin dashboard to view subscription details.

---
© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
`.trim();
}

/**
 * Cancellation data for admin notifications
 */
export interface AdminCancellationData {
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  cancelledAt: string;
  reason?: string;
}

/**
 * Get subscription cancellation notification email HTML template for admin
 */
export function getAdminCancellationEmailHtml(data: AdminCancellationData): string {
  const content = `
<h2 style="margin: 0 0 24px 0; color: ${BRAND.textColour}; font-size: 24px; font-weight: 600;">
  Subscription Cancelled ⚠️
</h2>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; background-color: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444;">
  <tr>
    <td style="padding: 16px;">
      <p style="margin: 0; color: ${BRAND.textColour}; font-size: 16px; font-weight: 600;">
        A customer has cancelled their ${data.planName} subscription.
      </p>
    </td>
  </tr>
</table>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px;">
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Customer:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.customerName}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Email:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">
        <a href="mailto:${data.customerEmail}" style="color: ${BRAND.primaryColour};">${data.customerEmail}</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Plan:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.planName}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Cancelled At:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.cancelledAt}</p>
    </td>
  </tr>
  ${data.reason ? `
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.borderColour};">
      <strong style="color: ${BRAND.lightText}; font-size: 14px;">Reason:</strong>
      <p style="margin: 4px 0 0 0; color: ${BRAND.textColour}; font-size: 16px;">${data.reason}</p>
    </td>
  </tr>
  ` : ''}
</table>

<p style="margin: 0; color: ${BRAND.lightText}; font-size: 14px; line-height: 1.6;">
  Consider reaching out to understand why they cancelled and if there's anything you can do to win them back.
</p>
`.trim();

  return getEmailLayout(content);
}

/**
 * Get subscription cancellation notification email plain text template for admin
 */
export function getAdminCancellationEmailText(data: AdminCancellationData): string {
  return `
Subscription Cancelled

A customer has cancelled their ${data.planName} subscription.

Customer: ${data.customerName}
Email: ${data.customerEmail}
Plan: ${data.planName}
Cancelled At: ${data.cancelledAt}
${data.reason ? `Reason: ${data.reason}` : ''}

Consider reaching out to understand why they cancelled and if there's anything you can do to win them back.

---
© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
`.trim();
}

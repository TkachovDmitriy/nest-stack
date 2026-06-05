import { baseEmailLayout } from './layout.template';
import { getEmailStyles } from './styles.template';
import { PasswordResetEmailData } from './types';

export const passwordResetTemplate = {
  subject: 'Reset Your Password',
  html: (data: PasswordResetEmailData) => {
    const styles = getEmailStyles();

    return baseEmailLayout(`
      <div style="${styles.container}">
        <div style="${styles.logo}">
          <img style="${styles.logoImg}" src="${data.logoUrl || '[Your-Logo-URL]'}" alt="Tokkatok Logo" title="Tokkatok Logo" />
        </div>

        <div style="${styles.content}">
          <p style="${styles.paragraph}">
            <span style="${styles.boldText}">Dear ${data.firstName},</span>
          </p>

          <p style="${styles.paragraph}">We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="${styles.paragraph}">Your password reset code is:</p>
          <div style="${styles.verificationBox}">
            ${Array.from(data.resetCode)
              .map((digit) => `<span style="${styles.codeDigit}">${digit}</span>`)
              .join('')}
          </div>

          <p style="${styles.paragraph}">This link will expire in ${data.expiresIn || 10} minutes. If you didn't request this change, please ignore this email.</p>

          <p style="${styles.paragraph}">If you have any questions or need assistance please contact our dedicated support team at <a href="mailto:${data.supportEmail || 'support@tokkatok.com'}" style="${styles.link}">${data.supportEmail || 'support@tokkatok.com'}</a> <br /> We're here to help you make the most of your experience.</p>

          <div style="${styles.signatureBlock}">
            <div>Best Regards,</div>
            <div>The Tokkatok Team <a href="${data.websiteUrl || 'https://www.tokkatok.com'}" style="${styles.link}">${data.websiteUrl?.replace('https://', '') || 'www.tokkatok.com'}</a></div>
          </div>
        </div>
      </div>
    `);
  },
};

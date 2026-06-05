import { baseEmailLayout } from './layout.template';
import { getEmailStyles } from './styles.template';
import { VerificationEmailData } from './types';

export const verificationTemplate = {
  subject: 'Verify your email',
  html: (data: VerificationEmailData) => {
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

          <p style="${styles.paragraph}">Thank you for creating an account with us!</p>

          <p style="${styles.paragraph}">Your verification code is:</p>

          <div style="${styles.verificationBox}">
            ${Array.from(data.verificationCode)
              .map((digit) => `<span style="${styles.codeDigit}">${digit}</span>`)
              .join('')}
          </div>

          <p style="${styles.paragraph}">Please enter this code on our website to confirm your account. <br /> This code will expire in ${data.expiresIn || 5} minutes.</p>

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

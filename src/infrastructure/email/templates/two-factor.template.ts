import { baseEmailLayout } from './layout.template';
import { getEmailStyles } from './styles.template';
import { TwoFactorEmailData } from './types';

export const twoFactorTemplate = {
  subject: 'Your Two-Factor Authentication Code',
  html: (data: TwoFactorEmailData) => {
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
          
          <p style="${styles.paragraph}">Here is your two-factor authentication code:</p>
          
          <div style="${styles.verificationBox}">
            ${Array.from(data.twoFactorCode)
              .map((digit) => `<span style="${styles.codeDigit}">${digit}</span>`)
              .join('')
              .trim()}
          </div>

          <p style="${styles.paragraph}">
            This code will expire in ${data.expiresIn || 5} minutes.
            If you didn't request this code, please secure your account immediately.
          </p>
          
          <div style="${styles.signatureBlock}">
            <div>Best Regards,</div>
            <div>The Tokkatok Team <a href="${data.websiteUrl || 'https://www.tokkatok.com'}" style="${styles.link}">${data.websiteUrl?.replace('https://', '') || 'www.tokkatok.com'}</a></div>
          </div>
        </div>
      </div>
    `);
  },
};

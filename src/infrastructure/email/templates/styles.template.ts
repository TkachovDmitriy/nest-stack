interface EmailStyles {
  container: string;
  logo: string;
  logoImg: string;
  content: string;
  paragraph: string;
  boldText: string;
  link: string;
  button: string;
  verificationBox: string;
  codeDigit: string;
  signatureBlock: string;
  list: string;
  listItem: string;
}

export const getEmailStyles = (): EmailStyles => ({
  container:
    'max-width: 530px; margin: 0 auto; padding: 32px; background-color: #ffffff; border-radius: 16px; text-align: left;',
  logo: 'margin-bottom: 16px;',
  logoImg: 'height: 56px;',
  content: 'font-size: 18px; font-weight: 400; line-height: 27px;',
  paragraph: 'margin: 0 0 16px; color: #171717;',
  boldText: 'font-weight: 500; color: #171717;',
  link: 'color: #2196f3; text-decoration: none;',
  button:
    'background-color: #FF8800; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 500; line-height: 24px; margin-bottom: 16px; padding: 15px 32px; text-decoration: none;',
  verificationBox:
    'background: #f5f5f5; border-radius: 8px; display: inline-block; padding: 16px 20px 8px; margin-bottom: 16px;',
  codeDigit:
    'background: #ffffff; border: 2px solid #5715c7; box-shadow: 0px 0px 0px 2px rgba(151, 71, 255, 0.20); border-radius: 8px; color: #171717; display: inline-block; font-size: 24px; font-weight: 700; line-height: 30px; margin-bottom: 6px; margin-right: 6px; padding: 11.5px 10.5px; text-align: center; height: 30px; width: 32px;',
  signatureBlock: 'margin-top: 24px; color: #171717;',
  list: 'margin: 0 0 16px; padding: 0 18px;',
  listItem: 'margin-bottom: 8px; color: #171717;',
});

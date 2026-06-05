export const baseEmailLayout = (content: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Email Template</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              ${content}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const getPasswordResetEmailTemplate = (fullname: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  
  return {
    subject: 'Mod Shop Admin - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Mod Shop Admin</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #0a0a0a;
          }
          .container {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid #2a2a3e;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
            margin-bottom: 10px;
          }
          .subtitle {
            color: #8892b0;
            font-size: 14px;
          }
          .content {
            color: #e6f1ff;
            margin-bottom: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #ccd6f6;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
            transition: all 0.3s ease;
          }
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
          }
          .warning {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #ffc107;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #2a2a3e;
            color: #64748b;
            font-size: 12px;
          }
          .link-fallback {
            word-break: break-all;
            color: #00d4ff;
            font-size: 12px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MOD SHOP</div>
            <div class="subtitle">Admin Portal</div>
          </div>
          
          <div class="content">
            <div class="greeting">Hello ${fullname},</div>
            
            <p>We received a request to reset your password for your Mod Shop Admin account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-fallback">${resetUrl}</div>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Mod Shop Admin Portal.<br>
            Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${fullname},

      We received a request to reset your password for your Mod Shop Admin account.

      Please click the following link to reset your password:
      ${resetUrl}

      This link will expire in 1 hour for security reasons.

      If you didn't request this password reset, please ignore this email.

      ---
      Mod Shop Admin Portal
      This is an automated message. Please do not reply to this email.
    `,
  };
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  fullname: string,
  resetToken: string
): Promise<void> => {
  const transporter = createTransporter();
  const emailTemplate = getPasswordResetEmailTemplate(fullname, resetToken);

  const mailOptions = {
    from: `"Mod Shop Admin" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  };

  await transporter.sendMail(mailOptions);
};

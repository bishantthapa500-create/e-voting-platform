import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.EMAIL_FROM || '"Secure E-Voting" <noreply@evoting.app>';

export async function sendOTP(email: string, code: string): Promise<void> {
  const transporter = createTransport();
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your E-Voting OTP verification code',
    text: `Your OTP is: ${code}\n\nThis code expires in 10 minutes. Do not share it.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0ea5e9">Verify your account</h2>
        <p>Use the code below to complete your registration:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e293b;
                    background:#f1f5f9;border-radius:8px;padding:16px;text-align:center">
          ${code}
        </div>
        <p style="color:#64748b;margin-top:16px">
          This code expires in <strong>10 minutes</strong>. Never share it with anyone.
        </p>
      </div>
    `,
  });
}

export async function sendVoteConfirmation(email: string, electionTitle: string): Promise<void> {
  const transporter = createTransport();
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Vote cast — ${electionTitle}`,
    text: `Your vote in "${electionTitle}" has been recorded. Thank you for participating.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#10b981">Vote confirmed</h2>
        <p>Your vote in <strong>${electionTitle}</strong> has been securely recorded.</p>
        <p style="color:#64748b">Thank you for participating in the democratic process.</p>
      </div>
    `,
  });
}

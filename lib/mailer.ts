import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true', // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? 'Karwia Odkrywca <noreply@karwia.pl>';

const BASE_URL = 'https://odkrywca.karwia.pl';

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${BASE_URL}/api/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Potwierdź swój email – Karwia Odkrywca',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0F5F92;margin-bottom:8px">Witaj w Karwia Odkrywca! 🗺️</h2>
        <p style="color:#444;line-height:1.6">
          Kliknij poniższy przycisk, aby potwierdzić swój adres e-mail i aktywować konto.
          Link jest ważny przez <strong>24 godziny</strong>.
        </p>
        <a href="${link}"
           style="display:inline-block;margin:20px 0;background:#0F5F92;color:white;text-decoration:none;padding:14px 28px;border-radius:16px;font-weight:bold;font-size:15px">
          Potwierdź email
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          Jeśli nie rejestrowałeś się w Karwia Odkrywca, zignoruj tę wiadomość.<br/>
          Link: ${link}
        </p>
      </div>
    `,
  });
}

export async function sendIsReachable(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

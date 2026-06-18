import nodemailer from 'nodemailer';

export async function sendResetEmail(email: string, code: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  // Dev fallback: log to console if SMTP not configured
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`\n[RESET DE SENHA] Email: ${email} | Código: ${code}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT ?? '587'),
    secure: parseInt(SMTP_PORT ?? '587') === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to: email,
    subject: 'Batalha da Aldeia — Redefinição de senha',
    html: `
      <div style="background:#1A0A00;padding:40px;font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#E85E00;letter-spacing:3px;margin:0 0 4px">BATALHA DA ALDEIA</h2>
        <p style="color:#C9A84C;font-size:11px;letter-spacing:5px;margin:0 0 32px">CARD GAME</p>
        <p style="color:#F5EDD8;margin:0 0 8px">Seu código de redefinição de senha:</p>
        <div style="background:#2A0E00;border:1px solid #C9A84C50;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#C9A84C">${code}</span>
        </div>
        <p style="color:#7A5C3E;font-size:12px;margin:0">Válido por 15 minutos. Se não foi você, ignore este email.</p>
      </div>
    `,
  });
}

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { generateCode, storeToken, verifyToken, deleteToken } from '../utils/resetTokens';
import { sendResetEmail } from '../utils/mailer';

const router = Router();

function supabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body as { username: string; email: string; password: string };
  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email e password são obrigatórios' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const db = supabase();

  const { data, error } = await db.from('users').insert({ username, email, password_hash: hash }).select('id').single();
  if (error) { res.status(400).json({ error: error.message }); return; }

  const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '7d' });
  res.json({ token, userId: data.id, username });
});

// Aceita email OU nome de usuário no campo identifier
router.post('/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body as { identifier: string; password: string };
  if (!identifier || !password) { res.status(400).json({ error: 'Preencha todos os campos' }); return; }

  const db = supabase();

  // Tenta por email primeiro, depois por username
  let { data, error } = await db
    .from('users').select('id, username, password_hash, email').eq('email', identifier).single();

  if (error || !data) {
    ({ data, error } = await db
      .from('users').select('id, username, password_hash, email').eq('username', identifier).single());
  }

  if (error || !data) { res.status(401).json({ error: 'Credenciais inválidas' }); return; }

  const valid = await bcrypt.compare(password, data.password_hash as string);
  if (!valid) { res.status(401).json({ error: 'Credenciais inválidas' }); return; }

  const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '7d' });
  res.json({ token, userId: data.id, username: data.username });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  if (!email) { res.status(400).json({ error: 'Informe o email' }); return; }

  const db = supabase();
  const { data } = await db.from('users').select('id, email').eq('email', email).single();

  // Responde sucesso mesmo se email não existir (segurança)
  if (!data) { res.json({ ok: true }); return; }

  const code = generateCode();
  storeToken(code, data.id, data.email as string);

  try {
    await sendResetEmail(data.email as string, code);
  } catch (err) {
    console.error('[mailer]', err);
  }

  // Em dev sem SMTP, retorna o código na resposta para facilitar testes
  const isDev = !process.env.SMTP_HOST;
  res.json({ ok: true, ...(isDev ? { devCode: code } : {}) });
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const { code, newPassword } = req.body as { code: string; newPassword: string };
  if (!code || !newPassword) { res.status(400).json({ error: 'Código e nova senha são obrigatórios' }); return; }
  if (newPassword.length < 6) { res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' }); return; }

  const tokenData = verifyToken(code);
  if (!tokenData) { res.status(400).json({ error: 'Código inválido ou expirado' }); return; }

  const hash = await bcrypt.hash(newPassword, 10);
  const db = supabase();
  const { error } = await db.from('users').update({ password_hash: hash }).eq('id', tokenData.userId);
  if (error) { res.status(500).json({ error: 'Erro ao atualizar senha' }); return; }

  deleteToken(code);
  res.json({ ok: true });
});

export default router;

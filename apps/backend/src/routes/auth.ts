import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

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

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const db = supabase();

  const { data, error } = await db.from('users').select('id, username, password_hash').eq('email', email).single();
  if (error || !data) { res.status(401).json({ error: 'Credenciais inválidas' }); return; }

  const valid = await bcrypt.compare(password, data.password_hash as string);
  if (!valid) { res.status(401).json({ error: 'Credenciais inválidas' }); return; }

  const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '7d' });
  res.json({ token, userId: data.id, username: data.username });
});

export default router;

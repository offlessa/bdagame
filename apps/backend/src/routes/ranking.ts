import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function supabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

router.get('/', async (_req: Request, res: Response) => {
  const db = supabase();
  const { data, error } = await db
    .from('ranking')
    .select('user_id, username, wins, losses, win_rate')
    .order('wins', { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post('/record', async (req: Request, res: Response) => {
  const { winnerId, loserId } = req.body as { winnerId: string; loserId: string };
  const db = supabase();

  await db.rpc('record_battle_result', { winner_id: winnerId, loser_id: loserId });
  res.json({ ok: true });
});

export default router;

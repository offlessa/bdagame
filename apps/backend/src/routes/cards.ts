import { Router, Request, Response } from 'express';
import { MC_CARDS, BEAT_CARDS, MOMENT_CARDS } from '@batalha/game-engine';

const router = Router();

router.get('/mcs', (_req: Request, res: Response) => res.json(MC_CARDS));
router.get('/beats', (_req: Request, res: Response) => res.json(BEAT_CARDS));
router.get('/moments', (_req: Request, res: Response) => res.json(MOMENT_CARDS));

export default router;

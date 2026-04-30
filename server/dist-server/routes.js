import { Router } from 'express';
import { insertVote, queryStats, queryBatchStats } from './db.js';
export const router = Router();
router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
router.post('/vote', async (req, res) => {
    const { questionId, choice } = req.body;
    if (typeof questionId !== 'string' || typeof choice !== 'number' || choice < 0) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
    }
    try {
        await insertVote(questionId, choice);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('vote insert error', err);
        res.status(500).json({ error: 'db error' });
    }
});
router.get('/stats/batch', async (req, res) => {
    const raw = String(req.query.ids ?? '');
    const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    try {
        const data = await queryBatchStats(ids);
        res.json(data);
    }
    catch (err) {
        console.error('batch stats error', err);
        res.status(500).json({ error: 'db error' });
    }
});
router.get('/stats/:questionId', async (req, res) => {
    const { questionId } = req.params;
    try {
        const votes = await queryStats(questionId);
        const total = Object.values(votes).reduce((a, b) => a + b, 0);
        res.json({ questionId, votes, total });
    }
    catch (err) {
        console.error('stats error', err);
        res.status(500).json({ error: 'db error' });
    }
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const db_1 = require("./db");
exports.router = (0, express_1.Router)();
exports.router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
exports.router.post('/vote', async (req, res) => {
    const { questionId, choice } = req.body;
    if (typeof questionId !== 'string' || typeof choice !== 'number' || choice < 0) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
    }
    try {
        await (0, db_1.insertVote)(questionId, choice);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('vote insert error', err);
        res.status(500).json({ error: 'db error' });
    }
});
exports.router.get('/stats/batch', async (req, res) => {
    const raw = String(req.query.ids ?? '');
    const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    try {
        const data = await (0, db_1.queryBatchStats)(ids);
        res.json(data);
    }
    catch (err) {
        console.error('batch stats error', err);
        res.status(500).json({ error: 'db error' });
    }
});
exports.router.get('/stats/:questionId', async (req, res) => {
    const { questionId } = req.params;
    try {
        const votes = await (0, db_1.queryStats)(questionId);
        const total = Object.values(votes).reduce((a, b) => a + b, 0);
        res.json({ questionId, votes, total });
    }
    catch (err) {
        console.error('stats error', err);
        res.status(500).json({ error: 'db error' });
    }
});

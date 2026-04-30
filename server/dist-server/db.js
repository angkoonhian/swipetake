"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDb = initDb;
exports.insertVote = insertVote;
exports.queryStats = queryStats;
exports.queryBatchStats = queryBatchStats;
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
async function initDb() {
    await exports.pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      question_id TEXT NOT NULL,
      choice      INTEGER NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_votes_question_id ON votes(question_id);
  `);
}
async function insertVote(questionId, choice) {
    await exports.pool.query('INSERT INTO votes (question_id, choice) VALUES ($1, $2)', [questionId, choice]);
}
async function queryStats(questionId) {
    const { rows } = await exports.pool.query('SELECT choice, COUNT(*) AS count FROM votes WHERE question_id = $1 GROUP BY choice', [questionId]);
    const votes = {};
    for (const row of rows)
        votes[String(row.choice)] = parseInt(row.count, 10);
    return votes;
}
async function queryBatchStats(ids) {
    if (ids.length === 0)
        return {};
    const { rows } = await exports.pool.query('SELECT question_id, choice, COUNT(*) AS count FROM votes WHERE question_id = ANY($1) GROUP BY question_id, choice', [ids]);
    const result = {};
    for (const row of rows) {
        if (!result[row.question_id])
            result[row.question_id] = {};
        result[row.question_id][String(row.choice)] = parseInt(row.count, 10);
    }
    return result;
}

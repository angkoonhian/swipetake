import { Pool } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      question_id TEXT NOT NULL,
      choice      INTEGER NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_votes_question_id ON votes(question_id);
  `);
}

export async function insertVote(questionId: string, choice: number): Promise<void> {
  await pool.query('INSERT INTO votes (question_id, choice) VALUES ($1, $2)', [questionId, choice]);
}

export async function queryStats(questionId: string): Promise<Record<string, number>> {
  const { rows } = await pool.query<{ choice: number; count: string }>(
    'SELECT choice, COUNT(*) AS count FROM votes WHERE question_id = $1 GROUP BY choice',
    [questionId],
  );
  const votes: Record<string, number> = {};
  for (const row of rows) votes[String(row.choice)] = parseInt(row.count, 10);
  return votes;
}

export async function queryBatchStats(
  ids: string[],
): Promise<Record<string, Record<string, number>>> {
  if (ids.length === 0) return {};
  const { rows } = await pool.query<{ question_id: string; choice: number; count: string }>(
    'SELECT question_id, choice, COUNT(*) AS count FROM votes WHERE question_id = ANY($1) GROUP BY question_id, choice',
    [ids],
  );
  const result: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!result[row.question_id]) result[row.question_id] = {};
    result[row.question_id][String(row.choice)] = parseInt(row.count, 10);
  }
  return result;
}

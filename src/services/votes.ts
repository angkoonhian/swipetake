const API_BASE = import.meta.env.VITE_API_URL || '';

export async function submitVote(questionId: string, choice: number): Promise<void> {
  try {
    fetch(`${API_BASE}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, choice }),
    }); // fire-and-forget, no await
  } catch {
    // silently fail — vote recording is best-effort
  }
}

export async function getStats(questionId: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stats/${questionId}`);
    if (!res.ok) return null;
    const data = await res.json() as { votes: Record<string, number> };
    return data.votes;
  } catch {
    return null; // fall back to pre-set stats
  }
}

export async function getBatchStats(
  ids: string[],
): Promise<Record<string, Record<string, number>>> {
  try {
    const res = await fetch(`${API_BASE}/api/stats/batch?ids=${ids.join(',')}`);
    if (!res.ok) return {};
    return await res.json() as Record<string, Record<string, number>>;
  } catch {
    return {};
  }
}

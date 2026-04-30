import { useState, useEffect } from 'react';
import { getStreakData } from '../services/stats';

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const data = getStreakData();
    setStreak(data.current);

    // Re-check every minute in case midnight rolls over
    const interval = setInterval(() => {
      const d = getStreakData();
      setStreak(d.current);
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    const data = getStreakData();
    setStreak(data.current);
  };

  return { streak, refresh };
}

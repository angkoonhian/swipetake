import { useState, useCallback, useRef } from 'react';
import { FeedEngine } from '../services/feed-engine';
import { saveAnswer, updateStreak } from '../services/stats';
import { submitVote } from '../services/votes';
import { useContentRefill } from './useContentRefill';
import type { Question } from '../types';

type FeedState = 'idle' | 'answered' | 'transition';

export function useFeed() {
  const engineRef = useRef<FeedEngine>(new FeedEngine());
  const engine = engineRef.current;

  const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>(engine.current());
  const [nextQuestion, setNextQuestion] = useState<Question | undefined>(engine.peek(1));
  const [feedState, setFeedState] = useState<FeedState>('idle');
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showAd, setShowAd] = useState(false);

  // Background AI refill — completely invisible to the user.
  const { triggerRefillIfNeeded } = useContentRefill(engine.contentQueue);

  const answer = useCallback(
    (choiceIndex: number) => {
      if (feedState !== 'idle' || !currentQuestion) return;

      const q = currentQuestion;

      // Determine if agreed with majority
      let agreedWithMajority: boolean | undefined;
      if (q.type === 'wyr') {
        const majorityChoice = q.statsA >= q.statsB ? 0 : 1;
        agreedWithMajority = choiceIndex === majorityChoice;
      } else if (q.type === 'hottake') {
        const majorityChoice = q.agreePercent >= 50 ? 0 : 1;
        agreedWithMajority = choiceIndex === majorityChoice;
      } else if (q.type === 'trivia') {
        agreedWithMajority = choiceIndex === q.correct;
      } else if (q.type === 'pickone') {
        const maxIdx = q.stats.indexOf(Math.max(...q.stats));
        agreedWithMajority = choiceIndex === maxIdx;
      }

      let isCorrect: boolean | undefined;
      if (q.type === 'trivia') {
        isCorrect = choiceIndex === q.correct;
      }

      saveAnswer({
        questionId: q.id,
        userChoice: choiceIndex,
        timestamp: Date.now(),
        isCorrect,
        agreedWithMajority,
      });

      // Fire-and-forget: record anonymous vote in backend (best-effort).
      void submitVote(q.id, choiceIndex);

      updateStreak();

      setUserChoice(choiceIndex);
      setFeedState('answered');
      setTotalAnswered((n) => n + 1);

      // Fire-and-forget background refill check after each answer.
      void triggerRefillIfNeeded().then((newQuestions) => {
        if (newQuestions && Array.isArray(newQuestions) && newQuestions.length > 0) {
          engine.ingestNewQuestions(newQuestions);
        }
      });
    },
    [feedState, currentQuestion, triggerRefillIfNeeded, engine]
  );

  const advance = useCallback(() => {
    if (feedState !== 'answered') return;

    setFeedState('transition');

    engine.advance();

    const newAnsweredCount = totalAnswered + 1;

    // Show ad every 7 cards
    if (newAnsweredCount % 7 === 0) {
      setShowAd(true);
    }

    // Brief transition delay for animation
    setTimeout(() => {
      setCurrentQuestion(engine.current());
      setNextQuestion(engine.peek(1));
      setUserChoice(null);
      setFeedState('idle');
    }, 300);
  }, [feedState, engine, totalAnswered]);

  const dismissAd = useCallback(() => {
    setShowAd(false);
  }, []);

  return {
    currentQuestion,
    nextQuestion,
    feedState,
    userChoice,
    totalAnswered,
    showAd,
    answer,
    advance,
    dismissAd,
  };
}

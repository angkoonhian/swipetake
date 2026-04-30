import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { FeedPage }          from './pages/FeedPage';
import { ProfilePage }       from './pages/ProfilePage';
import { LeaderboardPage }   from './pages/LeaderboardPage';
import { PersonalityPage }   from './pages/PersonalityPage';
import { CreatePage }        from './pages/CreatePage';
import { ScanPage }          from './pages/ScanPage';
import { PlayPage }          from './pages/PlayPage';
import { QuizResultsPage }   from './pages/QuizResultsPage';
import { initAds }           from './services/ads';
import { decodeQuiz, decodeResults, isQuizPayload } from './services/qr-codec';

/**
 * HashDecoder — runs once on mount, checks if the URL hash contains
 * an encoded quiz or results payload, and navigates accordingly.
 * e.g. swipetake.app/play#SQ1:...
 */
function HashDecoder() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading #
    if (!hash) return;

    const kind = isQuizPayload(hash);
    if (kind === 'quiz') {
      const quiz = decodeQuiz(hash);
      if (quiz) {
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/play', { state: { quiz } });
        return;
      }
    }
    if (kind === 'results') {
      const results = decodeResults(hash);
      if (results) {
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/quiz-results', { state: { results, viewMode: 'received' } });
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * Only show the bottom NavBar on the main navigation pages.
 * Full-screen pages (scan, play, quiz-results) manage their own layout.
 */
const HIDE_NAV_PATHS = new Set(['/scan', '/play', '/quiz-results']);

function NavBarConditional() {
  const location = useLocation();
  if (HIDE_NAV_PATHS.has(location.pathname)) return null;
  return <NavBar />;
}

export default function App() {
  useEffect(() => {
    initAds();
  }, []);

  return (
    <BrowserRouter>
      <HashDecoder />
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <Routes>
          <Route path="/"             element={<FeedPage />} />
          <Route path="/profile"      element={<ProfilePage />} />
          <Route path="/leaderboard"  element={<LeaderboardPage />} />
          <Route path="/personality"  element={<PersonalityPage />} />
          <Route path="/create"       element={<CreatePage />} />
          <Route path="/scan"         element={<ScanPage />} />
          <Route path="/play"         element={<PlayPage />} />
          <Route path="/quiz-results" element={<QuizResultsPage />} />
        </Routes>
        <NavBarConditional />
      </div>
    </BrowserRouter>
  );
}

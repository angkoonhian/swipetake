import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const CORAL  = '#FF6B35';
const PURPLE = '#7B2D8B';
const DARK   = '#1a1a1a';

interface Tab {
  path: string;
  label: string;
  icon: string;
  elevated?: boolean; // the Create tab gets the raised treatment
}

const TABS: Tab[] = [
  { path: '/',            label: 'Feed',   icon: '⚡' },
  { path: '/scan',        label: 'Scan',   icon: '📷' },
  { path: '/create',      label: 'Create', icon: '➕', elevated: true },
  { path: '/leaderboard', label: 'Ranked', icon: '🏆' },
  { path: '/profile',     label: 'You',    icon: '🫵' },
];

export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bouncing, setBouncing] = useState<string | null>(null);

  const handleClick = (path: string) => {
    setBouncing(path);
    setTimeout(() => setBouncing(null), 400);
    navigate(path);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        background: '#fff',
        borderTop: '2.5px solid ' + DARK,
        boxShadow: '0 -4px 0 ' + DARK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {TABS.map((tab) => {
        const active     = location.pathname === tab.path;
        const isBouncing = bouncing === tab.path;

        if (tab.elevated) {
          // Create tab — raised coral button
          return (
            <button
              key={tab.path}
              onClick={() => handleClick(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                background: active ? '#cc4400' : CORAL,
                border: `2.5px solid ${DARK}`,
                cursor: 'pointer',
                padding: '10px 18px',
                borderRadius: '999px',
                boxShadow: active ? `2px 2px 0px ${DARK}` : `4px 4px 0px ${DARK}`,
                transform: active ? 'translate(2px,2px)' : 'translateY(-8px)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                animation: isBouncing ? 'navBounce 0.4s ease forwards' : 'none',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  letterSpacing: '0.3px',
                  color: '#fff',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            onClick={() => handleClick(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              background: active ? PURPLE : 'transparent',
              border: active ? `2px solid ${DARK}` : '2px solid transparent',
              cursor: 'pointer',
              padding: '6px 16px',
              borderRadius: '999px',
              transition: 'background 0.2s, border 0.2s',
              animation: isBouncing ? 'navBounce 0.4s ease forwards' : 'none',
              boxShadow: active ? `3px 3px 0px ${DARK}` : 'none',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '0.3px',
                color: active ? '#fff' : '#999',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

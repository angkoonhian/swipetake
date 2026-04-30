import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { isQuizPayload, decodeQuiz, decodeResults } from '../services/qr-codec';

const CORAL  = '#FF6B35';
const DARK   = '#1a1a1a';
const TEAL   = '#00C9A7';
const YELLOW = '#FFD23F';

export function ScanPage() {
  const navigate     = useNavigate();
  const scannerRef   = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 'idle' — show instructions + Start button (no camera requested yet)
  // 'starting' — user tapped, initiating camera
  // 'scanning' — camera active
  // 'denied' — permission denied
  // 'error' — other camera error
  const [scanState, setScanState] = useState<'idle' | 'starting' | 'scanning' | 'denied' | 'error'>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [toast, setToast]         = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
    }
  };

  const startScanner = async () => {
    if (!containerRef.current) return;
    setErrorMsg('');
    setScanState('starting');

    // html5-qrcode needs the element to already exist in DOM
    // The container div is always rendered (just hidden when idle)
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // Per-frame scan error — ignore
        },
      );
      setScanState('scanning');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setScanState('denied');
        setErrorMsg('Camera access denied. Please enable it in your device settings, then tap Try Again.');
      } else {
        setScanState('error');
        setErrorMsg('Could not start camera: ' + msg);
      }
    }
  };

  const handleScan = async (raw: string) => {
    await stopScanner();
    setScanState('idle');

    const kind = isQuizPayload(raw);

    if (kind === 'quiz') {
      const quiz = decodeQuiz(raw);
      if (quiz) {
        navigate('/play', { state: { quiz } });
        return;
      }
    }

    if (kind === 'results') {
      const results = decodeResults(raw);
      if (results) {
        navigate('/quiz-results', { state: { results, viewMode: 'received' } });
        return;
      }
    }

    showToast("That's not a SwipeTake QR code. Try another!");
    // Re-start scanner automatically after a short pause
    setTimeout(() => startScanner(), 1500);
  };

  // No auto-start on mount — camera only starts on explicit user action.

  const isActive = scanState === 'scanning' || scanState === 'starting';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: DARK,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 20 }}>
        <button
          onClick={async () => { await stopScanner(); navigate('/'); }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '999px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '800',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          ✕ Close
        </button>
        <span style={{ color: '#fff', fontWeight: '900', fontSize: '18px' }}>
          📷 Scan QR
        </span>
      </div>

      {/* Idle state — show instructions + Start button */}
      {scanState === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '0 32px', marginTop: '40px' }}>
          <div style={{ fontSize: '72px' }}>📷</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: '900', fontSize: '22px', marginBottom: '10px' }}>
              Scan a SwipeTake QR code
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', fontWeight: '600', lineHeight: '1.5' }}>
              Point your camera at a quiz or results QR code shared by a friend.
            </p>
          </div>
          <button
            onClick={startScanner}
            style={{
              padding: '18px 40px',
              borderRadius: '999px',
              border: `2.5px solid #fff`,
              background: CORAL,
              color: '#fff',
              fontWeight: '900',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: `4px 4px 0px rgba(255,255,255,0.3)`,
              letterSpacing: '0.3px',
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Start Scanner
          </button>
        </div>
      )}

      {/* Starting indicator */}
      {scanState === 'starting' && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '15px', marginTop: '40px' }}>
          Starting camera…
        </div>
      )}

      {/* Camera viewfinder area — always in DOM so html5-qrcode can inject into it */}
      <div
        style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          marginTop: '40px',
          display: isActive ? 'block' : 'none',
        }}
      >
        <div
          id="qr-reader"
          ref={containerRef}
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        />

        {/* Corner overlay decorations */}
        {scanState === 'scanning' && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '36px', height: '36px', borderTop: `4px solid ${CORAL}`, borderLeft: `4px solid ${CORAL}`, borderRadius: '8px 0 0 0', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '36px', height: '36px', borderTop: `4px solid ${CORAL}`, borderRight: `4px solid ${CORAL}`, borderRadius: '0 8px 0 0', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '36px', height: '36px', borderBottom: `4px solid ${CORAL}`, borderLeft: `4px solid ${CORAL}`, borderRadius: '0 0 0 8px', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '36px', height: '36px', borderBottom: `4px solid ${CORAL}`, borderRight: `4px solid ${CORAL}`, borderRadius: '0 0 8px 0', zIndex: 10, pointerEvents: 'none' }} />
          </>
        )}
      </div>

      {/* Instructions while scanning */}
      {isActive && (
        <div style={{ marginTop: '28px', textAlign: 'center', padding: '0 32px' }}>
          <p style={{ color: '#fff', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>
            Scan a SwipeTake QR code
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', fontWeight: '600' }}>
            Point your camera at a quiz or results QR code
          </p>
        </div>
      )}

      {/* Permission denied state */}
      {scanState === 'denied' && (
        <div
          style={{
            marginTop: '24px',
            background: CORAL + '22',
            border: `2px solid ${CORAL}`,
            borderRadius: '16px',
            padding: '16px 20px',
            maxWidth: '320px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
            {errorMsg}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
            On iOS: Settings → Safari → Camera → Allow.{'\n'}
            On Android: tap the lock icon in the browser address bar.
          </p>
          <button
            onClick={() => { setScanState('idle'); setErrorMsg(''); }}
            style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', background: CORAL, color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Generic error */}
      {scanState === 'error' && (
        <div
          style={{
            marginTop: '20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 20px',
            maxWidth: '300px',
          }}
        >
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '13px', textAlign: 'center', marginBottom: '10px' }}>
            {errorMsg}
          </p>
          <button
            onClick={startScanner}
            style={{ display: 'block', margin: '0 auto', padding: '8px 20px', borderRadius: '999px', border: 'none', background: TEAL, color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Scanning indicator pill */}
      {scanState === 'scanning' && (
        <div
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '999px',
            padding: '8px 20px',
            color: '#fff',
            fontWeight: '700',
            fontSize: '13px',
          }}
        >
          🔍 Scanning…
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: YELLOW,
            border: `2px solid ${DARK}`,
            borderRadius: '999px',
            padding: '12px 24px',
            color: DARK,
            fontWeight: '800',
            fontSize: '14px',
            boxShadow: '3px 3px 0px ' + DARK,
            whiteSpace: 'nowrap',
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

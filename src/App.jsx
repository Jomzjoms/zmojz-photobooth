import React, { useState } from 'react';
import HomePage      from './components/HomePage';
import ShotSelector  from './components/ShotSelector';
import CameraCapture from './components/CameraCapture';
import FinalResult   from './components/FinalResult';

// Steps: HOME → SHOTS → CAPTURE → RESULT
const STEPS = { HOME: 'HOME', SHOTS: 'SHOTS', CAPTURE: 'CAPTURE', RESULT: 'RESULT' };

export default function App() {
  const [step,           setStep]           = useState(STEPS.HOME);
  const [shotCount,      setShotCount]      = useState(null);   // 3 or 4
  const [capturedPhotos, setCapturedPhotos] = useState([]);

  // Home → shot selector
  const handleStart = () => setStep(STEPS.SHOTS);

  // Shot count chosen → camera
  const handleShotSelect = (count) => {
    setShotCount(count);
    setCapturedPhotos([]);
    setStep(STEPS.CAPTURE);
  };

  const handleKeepPhoto = (photo) => setCapturedPhotos(prev => [...prev, photo]);

  // All shots taken → result (no frame yet)
  const handleFinish = (all) => {
    setCapturedPhotos(all);
    setStep(STEPS.RESULT);
  };

  const handleRetakeAll = () => {
    setCapturedPhotos([]);
    setShotCount(null);
    setStep(STEPS.HOME);
  };

  const handleBack = () => {
    if (step === STEPS.SHOTS)   { setStep(STEPS.HOME); }
    else if (step === STEPS.CAPTURE) { setCapturedPhotos([]); setStep(STEPS.SHOTS); }
    else if (step === STEPS.RESULT)  { setCapturedPhotos([]); setShotCount(null); setStep(STEPS.HOME); }
  };

  const stepList = Object.values(STEPS);
  const stepIdx  = stepList.indexOf(step);

  return (
    <div className="grain-overlay app-shell">
      {/* Nav — hidden on HOME */}
      {step !== STEPS.HOME && (
        <header className="app-header">
          <button
            onClick={handleBack}
            className="app-back-btn font-mono-ui app-back-btn--visible"
          >
            ← back
          </button>

          <h1 className="app-title font-mono-ui animate-flicker">
            Zmojz<span className="app-title-dim">PhotoBooth</span>
          </h1>

          <div className="app-steps">
            {stepList.filter(s => s !== STEPS.HOME).map((s, i) => (
              <div
                key={s}
                className="app-step-dash"
                style={{
                  background: s === step ? '#909090' : stepIdx > (i + 1) ? '#282828' : '#141414'
                }}
              />
            ))}
          </div>
        </header>
      )}

      {step !== STEPS.HOME && <div className="app-header-line" />}

      {/* Content */}
      <main className="app-main">
        {step === STEPS.HOME    && <HomePage onStart={handleStart} />}
        {step === STEPS.SHOTS   && <ShotSelector onSelect={handleShotSelect} />}
        {step === STEPS.CAPTURE && shotCount && (
          <CameraCapture
            key={capturedPhotos.length}
            frame={{ slots: shotCount }}
            capturedPhotos={capturedPhotos}
            onKeep={handleKeepPhoto}
            onFinish={handleFinish}
          />
        )}
        {step === STEPS.RESULT && (
          <FinalResult
            photos={capturedPhotos}
            shotCount={shotCount}
            onRetakeAll={handleRetakeAll}
          />
        )}
      </main>

      <footer className="app-footer">
        <p className="app-footer-text font-mono-ui">PhotoBooth · by Zmojz</p>
      </footer>
    </div>
  );
}
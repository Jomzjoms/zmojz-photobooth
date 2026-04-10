import React, { useState } from 'react';
import FrameSelector from './components/FrameSelector.jsx';
import CameraCapture from './components/CameraCaptur.jsx';
import FinalResult   from './components/FinalResult.jsx';

const STEPS = { SELECT: 'SELECT', CAPTURE: 'CAPTURE', RESULT: 'RESULT' };

export default function App() {
  const [step,           setStep]           = useState(STEPS.SELECT);
  const [selectedFrame,  setSelectedFrame]  = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);

  const handleFrameSelect = (frame) => { setSelectedFrame(frame); setCapturedPhotos([]); setStep(STEPS.CAPTURE); };
  const handleKeepPhoto   = (photo) => setCapturedPhotos(prev => [...prev, photo]);
  const handleFinish      = (all)   => { setCapturedPhotos(all); setStep(STEPS.RESULT); };
  const handleRetakeAll   = ()      => { setCapturedPhotos([]); setSelectedFrame(null); setStep(STEPS.SELECT); };
  const handleBack        = ()      => { setCapturedPhotos([]); setSelectedFrame(null); setStep(STEPS.SELECT); };

  const stepList = Object.values(STEPS);
  const stepIdx  = stepList.indexOf(step);

  return (
    <div className="grain-overlay app-shell">
      {/* Nav */}
      <header className="app-header">
        <button
          onClick={step !== STEPS.SELECT ? handleBack : undefined}
          className={`app-back-btn font-mono-ui ${step !== STEPS.SELECT ? 'app-back-btn--visible' : 'app-back-btn--hidden'}`}
        >
          ← back
        </button>

        <h1 className="app-title font-mono-ui animate-flicker">
          Zmojz<span className="app-title-dim">PhotoBooth</span>
        </h1>

        {/* Step dashes */}
        <div className="app-steps">
          {stepList.map((s, i) => (
            <div
              key={s}
              className="app-step-dash"
              style={{
                background: s === step ? '#909090' : stepIdx > i ? '#282828' : '#141414'
              }}
            />
          ))}
        </div>
      </header>

      <div className="app-header-line" />

      {/* Content */}
      <main className="app-main">
        {step === STEPS.SELECT  && <FrameSelector onSelect={handleFrameSelect} selectedId={selectedFrame?.id} />}
        {step === STEPS.CAPTURE && selectedFrame && (
          <CameraCapture
            key={capturedPhotos.length}
            frame={selectedFrame}
            capturedPhotos={capturedPhotos}
            onKeep={handleKeepPhoto}
            onFinish={handleFinish}
          />
        )}
        {step === STEPS.RESULT  && selectedFrame && (
          <FinalResult frame={selectedFrame} photos={capturedPhotos} onRetakeAll={handleRetakeAll} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p className="app-footer-text font-mono-ui">
          PhotoBooth · by Zmojz
        </p>
      </footer>
    </div>
  );
}
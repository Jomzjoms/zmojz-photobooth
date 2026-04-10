import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

export default function CameraCapture({ frame, capturedPhotos, onKeep, onFinish }) {
  const webcamRef    = useRef(null);
  const fileInputRef = useRef(null);
  const [tempPhoto,   setTempPhoto]   = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isFlipped,   setIsFlipped]   = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [camReady,    setCamReady]    = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [countdown,   setCountdown]   = useState(null);

  const currentSlot = capturedPhotos.length + 1;
  const totalSlots  = frame.slots;

  const triggerFlash = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 450);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (webcamRef.current) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          triggerFlash();
          setTimeout(() => {
            setTempPhoto(screenshot);
            setIsReviewing(true);
            setCountdown(null);
          }, 150);
        }
      }
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCapture = useCallback(() => {
    if (countdown !== null) return;
    setCountdown(3);
  }, [countdown]);

  const handleRetake    = () => { setTempPhoto(null); setIsReviewing(false); setIsFlipped(false); };

  const handleFlipImage = () => {
    if (!tempPhoto) return;
    const canvas = document.createElement('canvas');
    const img    = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      setTempPhoto(canvas.toDataURL('image/jpeg'));
      setIsFlipped(!isFlipped);
    };
    img.src = tempPhoto;
  };

  const handleKeep = () => {
    const newPhotos = [...capturedPhotos, tempPhoto];
    if (newPhotos.length === totalSlots) {
      onFinish(newPhotos);
    } else {
      onKeep(tempPhoto);
      setTempPhoto(null);
      setIsReviewing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setTempPhoto(ev.target.result); setIsReviewing(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="cc-wrapper animate-fade-in-up" style={{ opacity: 0 }}>
      {flashActive && <div className="flash-overlay cc-flash" />}

      {/* Header */}
      <div className="cc-header">
        <p className="font-mono-ui cc-eyebrow animate-flicker">
          — frame {frame.id} · {frame.label} —
        </p>
        <h2 className="font-light-ui cc-title">
          {isReviewing ? 'Review Shot' : `Shot ${currentSlot} of ${totalSlots}`}
        </h2>

        {/* Progress dots */}
        <div className="cc-dots">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div
              key={i}
              className={`cc-dot${
                i < capturedPhotos.length
                  ? ' cc-dot--filled'
                  : i === capturedPhotos.length && isReviewing
                  ? ' cc-dot--active animate-pulse'
                  : ' cc-dot--empty'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Viewport */}
      <div className="cc-viewport">
        <div className="vhs-scanlines cc-scanlines" />

        {!isReviewing ? (
          <>
            {!cameraError ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.95}
                videoConstraints={{ facingMode: 'user', aspectRatio: 4 / 3 }}
                onUserMedia={() => setCamReady(true)}
                onUserMediaError={() => setCameraError(true)}
                className="cc-webcam"
                mirrored={true}
              />
            ) : (
              <div className="cc-no-camera">
                <p className="font-mono-ui cc-no-camera-title">NO CAMERA</p>
                <p className="font-light-ui cc-no-camera-desc">
                  Camera unavailable. Upload a photo instead.
                </p>
                <button onClick={() => fileInputRef.current?.click()} className="btn-outline cc-upload-btn">
                  Upload Photo
                </button>
              </div>
            )}

            {/* REC indicator */}
            {camReady && !cameraError && (
              <div className="cc-rec">
                <div className="rec-dot cc-rec-dot" />
                <span className="font-mono-ui cc-rec-label">REC</span>
              </div>
            )}

            {/* Countdown */}
            {countdown !== null && (
              <div className="cc-countdown-overlay">
                <div className="cc-countdown-inner">
                  <p className="font-mono-ui cc-countdown-num animate-pulse">{countdown}</p>
                  <p className="font-mono-ui cc-countdown-label">HOLD STILL</p>
                </div>
              </div>
            )}

            {/* Corner brackets */}
            <div className="cc-corners">
              <div className="cc-corner cc-corner--tl" />
              <div className="cc-corner cc-corner--tr" />
              <div className="cc-corner cc-corner--bl" />
              <div className="cc-corner cc-corner--br" />
            </div>
          </>
        ) : (
          <img src={tempPhoto} alt="Captured" className="cc-review-img" />
        )}
      </div>

      {/* Actions */}
      <div className="cc-actions">
        {!isReviewing ? (
          <div className="cc-action-row">
            <button
              onClick={handleCapture}
              disabled={(!camReady && !cameraError) || countdown !== null}
              className="btn-primary cc-btn-snap"
            >
              {countdown !== null ? `${countdown}...` : '⊙ snap'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={countdown !== null}
              className="btn-ghost cc-btn-upload"
            >
              ↑ upload
            </button>
          </div>
        ) : (
          <>
            <div className="cc-action-row">
              <button onClick={handleRetake}    className="btn-ghost cc-btn-flex">↺ retake</button>
              <button onClick={handleFlipImage} className="btn-ghost cc-btn-flip" title="Flip">↔ flip</button>
              <button onClick={handleKeep}      className="btn-outline cc-btn-flex">✓ keep</button>
            </div>
            {isFlipped && (
              <p className="font-mono-ui cc-flipped-label">image flipped</p>
            )}
          </>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="cc-file-input" />

      <p className="font-mono-ui cc-progress-label">
        {capturedPhotos.length}/{totalSlots} photos captured
      </p>
    </div>
  );
}
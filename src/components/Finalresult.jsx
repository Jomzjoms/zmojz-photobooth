import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GifEncoder } from './GifEncoder';

// ─── Frame definitions ────────────────────────────────────────────────────────
const FRAME_DEFS = {
  3: [
    { id: 'classic',  label: 'Classic',    path: '/option-1classic.png' },
    { id: 'pat1',     label: 'Pattern 1',  path: '/option-1pat1.png'   },
    { id: 'pat2',     label: 'Pattern 2',  path: '/option-1pat2.png'   },
    { id: 'pat3',     label: 'Pattern 3',  path: '/option-1pat3.png'   },
    { id: 'pat4',     label: 'Pattern 4',  path: '/option-1pat4.png'   },
    { id: 'pat5',     label: 'Pattern 5',  path: '/option-1pat5.png'   },
  ],
  4: [
    { id: 'classic',  label: 'Classic',    path: '/option-2classic.png' },
    { id: 'pat1',     label: 'Pattern 1',  path: '/option-2pat1.png'   },
    { id: 'pat2',     label: 'Pattern 2',  path: '/option-2pat2.png'   },
    { id: 'pat3',     label: 'Pattern 3',  path: '/option-2pat3.png'   },
    { id: 'pat4',     label: 'Pattern 4',  path: '/option-2pat4.png'   },
    { id: 'pat5',     label: 'Pattern 5',  path: '/option-2pat5.png'   },
  ],
};

const FRAME_SLOTS = {
  3: { canvasW: 600, canvasH: 1800, slots: [
    { x: 55, y: 115, w: 490, h: 375 },
    { x: 60, y: 530, w: 490, h: 375 },
    { x: 55, y: 945, w: 490, h: 375 }
  ]},
  4: { canvasW: 600, canvasH: 1800, slots: [
    { x: 50, y: 65,   w: 500, h: 335 },
    { x: 50, y: 440,  w: 500, h: 335 },
    { x: 50, y: 805,  w: 500, h: 335 },
    { x: 50, y: 1175, w: 500, h: 335 }
  ]},
};

const GIF_W = 360, GIF_H = 270;
const HOLD_FRAMES = 12, TRANSITION_FRAMES = 10, DELAY_CS = 8;

export default function FinalResult({ photos, shotCount, onRetakeAll }) {
  const canvasRef        = useRef(null);
  const previewCanvasRef = useRef(null);
  const gifCanvasRef     = useRef(null);

  const frames = FRAME_DEFS[shotCount] || FRAME_DEFS[3];
  const [selectedFrame, setSelectedFrame] = useState(frames[0]);

  const [isRendering, setIsRendering] = useState(true);
  const [rendered,    setRendered]    = useState(false);
  const [gifStatus,   setGifStatus]   = useState('idle');
  const [gifProgress, setGifProgress] = useState(0);
  const [gifUrl,      setGifUrl]      = useState(null);

  const frameConfig = FRAME_SLOTS[shotCount] || FRAME_SLOTS[3];

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const drawCover = (ctx, img, x, y, w, h) => {
    const ia = img.naturalWidth / img.naturalHeight;
    const sa = w / h;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (ia > sa) { sw = img.naturalHeight * sa; sx = (img.naturalWidth  - sw) / 2; }
    else         { sh = img.naturalWidth  / sa; sy = (img.naturalHeight - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const renderStrip = async (canvas, framePath) => {
    const ctx = canvas.getContext('2d');
    const { canvasW, canvasH, slots } = frameConfig;
    canvas.width  = canvasW;
    canvas.height = canvasH;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvasW, canvasH);

    for (let i = 0; i < photos.length; i++) {
      const slot = slots[i];
      if (!slot) continue;
      try {
        const img = await loadImage(photos[i]);
        ctx.save();
        ctx.beginPath();
        ctx.rect(slot.x, slot.y, slot.w, slot.h);
        ctx.clip();
        drawCover(ctx, img, slot.x, slot.y, slot.w, slot.h);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#141414';
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
      }
    }
    try {
      const fi = await loadImage(framePath);
      ctx.drawImage(fi, 0, 0, canvasW, canvasH);
    } catch (e) { console.warn('Frame overlay missing:', e); }
  };

  // Re-render whenever selected frame changes
  useEffect(() => {
    const run = async () => {
      setIsRendering(true);
      setRendered(false);
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        await renderStrip(canvas, selectedFrame.path);
        const preview = previewCanvasRef.current;
        if (preview) {
          const maxH  = Math.min(window.innerHeight * 0.6, 600);
          const scale = maxH / canvas.height;
          preview.width  = Math.round(canvas.width  * scale);
          preview.height = Math.round(canvas.height * scale);
          preview.getContext('2d').drawImage(canvas, 0, 0, preview.width, preview.height);
        }
        setRendered(true);
      } catch (e) { console.error('Strip render error:', e); }
      setIsRendering(false);
    };
    run();
  }, [selectedFrame]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href     = canvas.toDataURL('image/png');
    link.download = `photobooth-${selectedFrame.id}-${Date.now()}.png`;
    link.click();
  };

  // ── FIXED: each photo fills the full GIF frame instead of appearing at its slot position
  const drawSlide = async (gifCtx, photoIdx) => {
    gifCtx.fillStyle = '#f0f0f0';
    gifCtx.fillRect(0, 0, GIF_W, GIF_H);

    if (!photos[photoIdx]) return;

    try {
      const img = await loadImage(photos[photoIdx]);
      // Draw the photo covering the entire GIF canvas
      drawCover(gifCtx, img, 0, 0, GIF_W, GIF_H);
    } catch (e) {
      gifCtx.fillStyle = '#141414';
      gifCtx.fillRect(0, 0, GIF_W, GIF_H);
    }
  };

  const handleGenerateGif = async () => {
    setGifStatus('rendering');
    setGifProgress(0);

    try {
      const gifCanvas = gifCanvasRef.current;
      if (!gifCanvas) return;
      gifCanvas.width  = GIF_W;
      gifCanvas.height = GIF_H;
      const gifCtx = gifCanvas.getContext('2d');

      const encoder = new GifEncoder(GIF_W, GIF_H, { repeat: 0, delay: DELAY_CS });

      let frameIdx = 0;
      const totalFrames = photos.length * (HOLD_FRAMES + TRANSITION_FRAMES);

      for (let photoIdx = 0; photoIdx < photos.length; photoIdx++) {
        // Hold frames — show the photo for HOLD_FRAMES ticks
        for (let hold = 0; hold < HOLD_FRAMES; hold++) {
          await drawSlide(gifCtx, photoIdx);
          const imageData = gifCtx.getImageData(0, 0, GIF_W, GIF_H);
          encoder.addFrame(imageData.data);
          frameIdx++;
          setGifProgress(Math.round((frameIdx / totalFrames) * 100));
        }

        // Transition: smooth cross-fade, always runs for every photo including last→first (seamless loop)
        {
          const nextPhotoIdx = (photoIdx + 1) % photos.length;
          const nextImg = await loadImage(photos[nextPhotoIdx]);

          for (let t = 0; t < TRANSITION_FRAMES; t++) {
            const progress = t / TRANSITION_FRAMES;
            await drawSlide(gifCtx, photoIdx);
            gifCtx.globalAlpha = progress;
            drawCover(gifCtx, nextImg, 0, 0, GIF_W, GIF_H);
            gifCtx.globalAlpha = 1;
            const imageData = gifCtx.getImageData(0, 0, GIF_W, GIF_H);
            encoder.addFrame(imageData.data);
            frameIdx++;
            setGifProgress(Math.round((frameIdx / totalFrames) * 100));
          }
        }
      }

      const gifBlob    = encoder.finish();
      const gifDataUrl = URL.createObjectURL(gifBlob);
      setGifUrl(gifDataUrl);
      setGifStatus('ready');
    } catch (e) {
      console.error('GIF generation error:', e);
      setGifStatus('error');
    }
  };

  const handleDownloadGif = () => {
    if (!gifUrl) return;
    const link = document.createElement('a');
    link.href     = gifUrl;
    link.download = `photobooth-${selectedFrame.id}-${Date.now()}.gif`;
    link.click();
  };

  return (
    <div className="fr-wrapper animate-fade-in-up" style={{ opacity: 0 }}>
      <canvas ref={canvasRef}    className="fr-hidden-canvas" />
      <canvas ref={gifCanvasRef} className="fr-hidden-canvas" />

      <div className="fr-header">
        <p className="font-mono-ui fr-eyebrow animate-flicker">— developed —</p>
        <h2 className="font-light-ui fr-title">Your Strip</h2>
        <div className="fr-divider" />
      </div>

      {/* ── Frame picker ─────────────────────────────────────────────── */}
      <div className="fr-frame-picker">
        <p className="font-mono-ui fr-picker-label">— select frame —</p>
        <div className="fr-picker-scroll">
          {frames.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFrame(f)}
              className={`fr-picker-btn font-mono-ui${selectedFrame.id === f.id ? ' fr-picker-btn--active' : ''}`}
            >
              <img
                src={f.path}
                alt={f.label}
                className="fr-picker-thumb"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="fr-picker-name">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Strip preview */}
      <div className="fr-preview-area">
        <div className="fr-preview-inner">
          {isRendering && (
            <div className="fr-developing">
              <div className="font-mono-ui fr-dev-text animate-flicker">developing...</div>
              <div className="font-mono-ui fr-dev-sub">do not expose to light</div>
            </div>
          )}
          <canvas
            ref={previewCanvasRef}
            className={`fr-preview-canvas${rendered ? ' fr-preview-canvas--visible' : ''}`}
          />
          {rendered && (
            <div className="fr-corner-overlay">
              <div className="fr-corner fr-corner--tl" />
              <div className="fr-corner fr-corner--tr" />
              <div className="fr-corner fr-corner--bl" />
              <div className="fr-corner fr-corner--br" />
            </div>
          )}
        </div>
      </div>

      {/* GIF Preview */}
      {(gifStatus === 'rendering' || gifStatus === 'ready') && (
        <div className="fr-gif-preview-section animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
          <p className="font-mono-ui fr-gif-preview-label">— gif preview —</p>
          <div className="fr-gif-preview-container">
            {gifUrl && (
              <img src={gifUrl} alt="GIF Preview" className="fr-gif-preview-image" />
            )}
            {gifStatus === 'rendering' && !gifUrl && (
              <div className="fr-gif-placeholder animate-flicker">
                <div className="font-mono-ui">generating...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {rendered && (
        <div className="fr-actions animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
          <button onClick={handleDownload} className="btn-primary fr-btn-full">
            ↓ download png
          </button>
          {gifStatus === 'idle' && (
            <button onClick={handleGenerateGif} className="btn-primary fr-btn-full">
              ✨ generate gif
            </button>
          )}
          {gifStatus === 'rendering' && (
            <div className="fr-gif-status">
              <div className="font-mono-ui fr-gif-text">generating gif...</div>
              <div className="fr-progress-bar">
                <div className="fr-progress-fill" style={{ width: `${gifProgress}%` }} />
              </div>
            </div>
          )}
          {gifStatus === 'ready' && gifUrl && (
            <button onClick={handleDownloadGif} className="btn-primary fr-btn-full">
              ↓ download gif
            </button>
          )}
          {gifStatus === 'error' && (
            <div className="font-mono-ui fr-error-text">gif generation failed</div>
          )}
          <button onClick={onRetakeAll} className="btn-ghost fr-btn-full">↺ start over</button>
        </div>
      )}

      <p className="font-mono-ui fr-footer-text">
        {selectedFrame.label} · {shotCount} shots
      </p>
    </div>
  );
}
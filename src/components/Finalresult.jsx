import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GifEncoder } from './GifEncoder';

const FRAME_SLOTS = {
  'A': { canvasW: 600, canvasH: 1800, slots: [{ x: 55, y: 115, w: 490, h: 375 }, { x: 60, y: 530, w: 490, h: 375 }, { x: 55, y: 945, w: 490, h: 375 }] },
  'B': { canvasW: 600, canvasH: 1800, slots: [{ x: 55, y: 115, w: 490, h: 375 }, { x: 60, y: 530, w: 490, h: 375 }, { x: 55, y: 945, w: 490, h: 375 }] },
  'C': { canvasW: 600, canvasH: 1800, slots: [{ x: 50, y: 65, w: 500, h: 335 }, { x: 50, y: 440, w: 500, h: 335 }, { x: 50, y: 805, w: 500, h: 335 }, { x: 50, y: 1175, w: 500, h: 335 }] },
  'D': { canvasW: 600, canvasH: 1800, slots: [{ x: 55, y: 65, w: 490, h: 335 }, { x: 55, y: 445, w: 490, h: 335 }, { x: 55, y: 825, w: 490, h: 335 }, { x: 55, y: 1205, w: 490, h: 335 }] },
};

const GIF_W = 360, GIF_H = 270;
const HOLD_FRAMES = 12, TRANSITION_FRAMES = 5, DELAY_CS = 8;

export default function FinalResult({ frame, photos, onRetakeAll }) {
  const canvasRef        = useRef(null);
  const previewCanvasRef = useRef(null);
  const gifCanvasRef     = useRef(null);

  const [isRendering, setIsRendering] = useState(true);
  const [rendered,    setRendered]    = useState(false);
  const [gifStatus,   setGifStatus]   = useState('idle');
  const [gifProgress, setGifProgress] = useState(0);
  const [gifUrl,      setGifUrl]      = useState(null);

  const frameConfig = FRAME_SLOTS[frame.id];

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

  const renderStrip = async (canvas) => {
    const ctx = canvas.getContext('2d');
    const { canvasW, canvasH, slots } = frameConfig;
    canvas.width  = canvasW;
    canvas.height = canvasH;
    ctx.fillStyle = frame.theme === 'dark' ? '#0d0d0d' : '#f0f0f0';
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
      const fi = await loadImage(frame.path);
      ctx.drawImage(fi, 0, 0, canvasW, canvasH);
    } catch (e) { console.warn('Frame overlay missing:', e); }
  };

  useEffect(() => {
    const run = async () => {
      setIsRendering(true);
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        await renderStrip(canvas);
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
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href     = canvas.toDataURL('image/png');
    link.download = `photobooth-${frame.id}-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadGif = () => {
    if (!gifUrl) return;
    const link = document.createElement('a');
    link.href     = gifUrl;
    link.download = `photobooth-${frame.id}-anim-${Date.now()}.gif`;
    link.click();
  };

  const drawSlide = (ctx, img, alpha, shotIndex) => {
    const pad = 14, iw = GIF_W - pad * 2, ih = GIF_H - pad * 2;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GIF_W, GIF_H);
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.beginPath(); ctx.rect(pad, pad, iw, ih); ctx.clip();
    drawCover(ctx, img, pad, pad, iw, ih);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#242424';
    ctx.lineWidth   = 1;
    ctx.strokeRect(pad, pad, iw, ih);
    const tl = 7;
    ctx.strokeStyle = '#484848';
    ctx.lineWidth   = 1;
    [[pad, pad], [GIF_W - pad, pad], [pad, GIF_H - pad], [GIF_W - pad, GIF_H - pad]].forEach(([cx, cy]) => {
      const sx = cx === pad ? 1 : -1, sy = cy === pad ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * tl, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + sy * tl); ctx.stroke();
    });
    ctx.fillStyle  = '#404040';
    ctx.font       = '9px monospace';
    ctx.textAlign  = 'right';
    ctx.fillText(`${shotIndex + 1} / ${photos.length}`, GIF_W - pad - 3, GIF_H - pad - 3);
    ctx.textAlign  = 'left';
  };

  const handleGenerateGif = useCallback(async () => {
    setGifStatus('generating');
    setGifProgress(0);
    if (gifUrl) { URL.revokeObjectURL(gifUrl); setGifUrl(null); }

    try {
      const imgs = await Promise.all(photos.map(loadImage));
      const offscreen = gifCanvasRef.current;
      offscreen.width  = GIF_W;
      offscreen.height = GIF_H;
      const ctx = offscreen.getContext('2d');
      const enc = new GifEncoder(GIF_W, GIF_H, { repeat: 0, delay: DELAY_CS });
      const totalFrames = imgs.length * (HOLD_FRAMES + TRANSITION_FRAMES);
      let done = 0;
      const tick = () => new Promise(r => setTimeout(r, 0));

      for (let i = 0; i < imgs.length; i++) {
        const curr = imgs[i], next = imgs[(i + 1) % imgs.length];
        for (let f = 0; f < HOLD_FRAMES; f++) {
          drawSlide(ctx, curr, 1, i);
          enc.addFrame(ctx.getImageData(0, 0, GIF_W, GIF_H).data);
          done++;
          if (f % 4 === 0) { setGifProgress(Math.round((done / totalFrames) * 90)); await tick(); }
        }
        for (let t = 0; t < TRANSITION_FRAMES; t++) {
          const alphaOut = 1 - (t + 1) / (TRANSITION_FRAMES + 1);
          const alphaIn  = 1 - alphaOut;
          const pad = 14, iw = GIF_W - pad * 2, ih = GIF_H - pad * 2;
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, GIF_W, GIF_H);
          ctx.globalAlpha = alphaIn;
          ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, iw, ih); ctx.clip();
          drawCover(ctx, next, pad, pad, iw, ih); ctx.restore();
          ctx.globalAlpha = alphaOut;
          ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, iw, ih); ctx.clip();
          drawCover(ctx, curr, pad, pad, iw, ih); ctx.restore();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#242424'; ctx.lineWidth = 1; ctx.strokeRect(pad, pad, iw, ih);
          const tl = 7; ctx.strokeStyle = '#484848';
          [[pad, pad], [GIF_W - pad, pad], [pad, GIF_H - pad], [GIF_W - pad, GIF_H - pad]].forEach(([cx, cy]) => {
            const sx = cx === pad ? 1 : -1, sy = cy === pad ? 1 : -1;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * tl, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + sy * tl); ctx.stroke();
          });
          enc.addFrame(ctx.getImageData(0, 0, GIF_W, GIF_H).data);
          done++;
          setGifProgress(Math.round((done / totalFrames) * 90));
          await tick();
        }
      }

      setGifProgress(95); await tick();
      const blob = enc.finish();
      const url  = URL.createObjectURL(blob);
      setGifUrl(url);
      setGifStatus('done');
      setGifProgress(100);
    } catch (e) {
      console.error('GIF generation failed:', e);
      setGifStatus('error');
    }
  }, [photos, frame, gifUrl]);

  return (
    <div className="fr-wrapper animate-fade-in-up" style={{ opacity: 0 }}>
      <canvas ref={canvasRef}    className="fr-hidden-canvas" />
      <canvas ref={gifCanvasRef} className="fr-hidden-canvas" />

      {/* Header */}
      <div className="fr-header">
        <p className="font-mono-ui fr-eyebrow animate-flicker">— developed —</p>
        <h2 className="font-light-ui fr-title">Your Strip</h2>
        <div className="fr-divider" />
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

      {/* GIF preview */}
      {gifStatus === 'done' && gifUrl && (
        <div className="fr-gif-preview animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
          <div className="fr-gif-header">
            <p className="font-mono-ui fr-gif-eyebrow animate-flicker">— animated —</p>
          </div>
          <div className="fr-gif-center">
            <div className="fr-gif-inner">
              <img src={gifUrl} alt="Animated GIF" className="fr-gif-img" />
              <div className="fr-corner-overlay">
                <div className="fr-corner fr-corner--tl" />
                <div className="fr-corner fr-corner--tr" />
                <div className="fr-corner fr-corner--bl" />
                <div className="fr-corner fr-corner--br" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {rendered && (
        <div className="fr-actions animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
          <button onClick={handleDownload} className="btn-primary fr-btn-full">
            ↓ download png
          </button>

          {gifStatus === 'idle' && (
            <button
              onClick={handleGenerateGif}
              className="btn-ghost fr-btn-full fr-btn-gif"
            >
              ▶ create animated gif
            </button>
          )}

          {gifStatus === 'generating' && (
            <div className="fr-gif-progress">
              <div className="fr-gif-progress-header">
                <span className="font-mono-ui fr-gif-encoding animate-flicker">encoding frames...</span>
                <span className="font-mono-ui fr-gif-pct">{gifProgress}%</span>
              </div>
              <div className="fr-gif-bar-track">
                <div className="fr-gif-bar-fill" style={{ width: `${gifProgress}%` }} />
              </div>
              <p className="font-mono-ui fr-gif-warning">do not close this tab</p>
            </div>
          )}

          {gifStatus === 'done' && gifUrl && (
            <div className="fr-gif-done">
              <button onClick={handleDownloadGif} className="btn-outline fr-btn-full">
                ↓ download gif
              </button>
              <button onClick={() => { setGifStatus('idle'); setGifProgress(0); setGifUrl(null); }} className="fr-regen-btn font-mono-ui">
                ↺ regenerate
              </button>
            </div>
          )}

          {gifStatus === 'error' && (
            <div className="fr-gif-error">
              <p className="font-mono-ui fr-gif-error-text">gif generation failed</p>
              <button
                onClick={() => { setGifStatus('idle'); setGifProgress(0); }}
                className="font-mono-ui fr-retry-btn"
              >
                try again
              </button>
            </div>
          )}

          <button onClick={onRetakeAll} className="btn-ghost fr-btn-full">↺ start over</button>
        </div>
      )}

      <p className="font-mono-ui fr-footer-text">
        frame {frame.id} · {frame.label} · {photos.length} shots
      </p>
    </div>
  );
}
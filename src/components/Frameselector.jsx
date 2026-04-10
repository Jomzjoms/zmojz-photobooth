import React from 'react';

const FRAMES = [
  { id: 'A', path: '/option-1blk.png', label: 'Option 1 Black', slots: 3, tag: '3 shots', theme: 'dark' },
  { id: 'B', path: '/option-1wht.png', label: 'Option 1 White', slots: 3, tag: '3 shots', theme: 'light' },
  { id: 'C', path: '/option-2blk.png', label: 'Option 2 Black', slots: 4, tag: '4 shots', theme: 'dark' },
  { id: 'D', path: '/option-2wht.png', label: 'Option 2 White', slots: 4, tag: '4 shots', theme: 'light' },
];

export { FRAMES };

export default function FrameSelector({ onSelect, selectedId }) {
  return (
    <div className="fs-wrapper">
      {/* Header */}
      <div className="fs-header">
        <p className="fs-eyebrow font-mono-ui">
          — select frame —
        </p>
        <h2 className="fs-title font-light-ui">
          Choose Your Strip
        </h2>
        <div className="fs-divider" />
      </div>

      {/* Grid */}
      <div className="fs-grid">
        {FRAMES.map((frame, i) => (
          <button
            key={frame.id}
            onClick={() => onSelect(frame)}
            className={`frame-card fs-card animate-fade-in-up${selectedId === frame.id ? ' selected' : ''}`}
            style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}
          >
            {/* Preview area */}
            <div className="fs-preview">
              <div className="fs-slots">
                {Array.from({ length: frame.slots }).map((_, idx) => (
                  <div key={idx} className="fs-slot" />
                ))}
              </div>
              <img
                src={frame.path}
                alt={frame.label}
                className="fs-frame-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="vhs-scanlines fs-scanlines" />
              <div className="fs-badge">
                <span className="font-mono-ui fs-badge-text">{frame.id}</span>
              </div>
            </div>

            {/* Info */}
            <div className="fs-info">
              <div className="fs-info-row">
                <p className="font-mono-ui fs-label">{frame.label}</p>
                <span className="font-mono-ui fs-tag">{frame.tag}</span>
              </div>
              <div className="fs-theme-row">
                <div
                  className="fs-theme-swatch"
                  style={{ background: frame.theme === 'dark' ? '#080808' : '#f0f0f0' }}
                />
                <span className="font-mono-ui fs-theme-label">
                  {frame.theme === 'dark' ? 'black border' : 'white border'}
                </span>
              </div>
            </div>

            {/* Selected ring */}
            {selectedId === frame.id && (
              <div className="fs-selected-ring" />
            )}
          </button>
        ))}
      </div>

      <p className="fs-hint font-mono-ui">tap to continue</p>
    </div>
  );
}
import React from 'react';

export default function ShotSelector({ onSelect }) {
  return (
    <div className="ss-wrapper animate-fade-in-up" style={{ opacity: 0 }}>

      <div className="ss-header">
        <p className="font-mono-ui ss-eyebrow animate-flicker">
          — how many shots? —
        </p>
        <h2 className="font-light-ui ss-title">Choose Format</h2>
        <div className="ss-divider" />
      </div>

      <div className="ss-options">
        {[3, 4].map((count, i) => (
          <button
            key={count}
            onClick={() => onSelect(count)}
            className="ss-option-card animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
          >
            {/* Mini strip visual */}
            <div className="ss-strip-preview">
              {Array.from({ length: count }).map((_, idx) => (
                <div key={idx} className="ss-strip-slot" />
              ))}
            </div>

            <div className="ss-option-info">
              <p className="font-light-ui ss-count">{count}</p>
              <p className="font-mono-ui ss-count-label">shots</p>
            </div>
          </button>
        ))}
      </div>

      <p className="font-mono-ui ss-hint">tap to continue</p>
    </div>
  );
}



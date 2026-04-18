import React, { useEffect, useRef, useState } from 'react';

/* ─── FAQ data ─────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Do I need a camera?',
    a: 'A camera is recommended for the best experience, but not required. You can upload photos directly from your device if your camera is unavailable.',
  },
  {
    q: 'Can I upload my own photos?',
    a: 'Yes! Every shot has an upload option. Simply tap the upload button during the capture step to choose a photo from your device instead.',
  },
  {
    q: 'Is it mobile-friendly?',
    a: 'Absolutely. Photo Booth is designed mobile-first. It works great on iPhone and Android browsers — no app installation needed.',
  },
  {
    q: 'How do I download my photos?',
    a: 'After your strip is generated, tap "Download PNG" to save the full-resolution image. You can also generate an animated GIF of your shots and download that too.',
  },
  {
    q: 'Can I choose 3 or 4 photos?',
    a: "Yes! When you start, you'll be asked to choose between a 3-shot or 4-shot strip format. Each has its own set of frame designs to pick from.",
  },
  {
    q: 'Will my photos be saved or stored in a database?',
    a: "No, your photos are not saved or stored anywhere. All images are processed locally in your browser using your device only. This means, your photos are private, nothing is uploaded to any server, and once you refresh or leave the page, your photos will be gone",
  },
];

/* ─── Feature cards ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Choose Custom Frames',
    desc: 'Pick from Classic, Checker, Swirl, Cow Print, and more patterned overlays.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7e00f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    title: 'Take or Upload Photos',
    desc: 'Use your camera directly or upload photos from your device — your choice.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7e00f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    title: 'Retake Anytime',
    desc: "Not happy with a shot? Retake any photo before finalizing your strip.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7e00f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
      </svg>
    ),
  },
  {
    title: 'Download Instantly',
    desc: 'Save your finished photo strip as a high-quality PNG or animated GIF.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7e00f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

/* ─── Fade-in hook ──────────────────────────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) ref.current?.classList.add('hp-visible'); },
      { threshold: 0.12 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── FAQ Item ──────────────────────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`hp-faq-item${open ? ' hp-faq-open' : ''}`}>
      <button className="hp-faq-q" onClick={() => setOpen(!open)}>
        <span className="hp-faq-q-text">{q}</span>
        <span className="hp-faq-chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div className="hp-faq-a" style={{ maxHeight: open ? '200px' : '0' }}>
        <p className="hp-faq-a-text">{a}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function HomePage({ onStart }) {
  const featRef  = useFadeIn();
  const aboutRef = useFadeIn();
  const faqRef   = useFadeIn();

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="hp-page">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="hp-nav">
        <span className="hp-nav-logo">Zmojz</span>
        <ul className="hp-nav-links">
          <li><button onClick={() => scrollTo('hp-features')}>Features</button></li>
          <li><button onClick={() => scrollTo('hp-about')}>About</button></li>
          <li><button onClick={() => scrollTo('hp-faq')}>FAQ</button></li>
        </ul>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="hp-hero">
        <div className="hp-hero-glow" />
        <div className="hp-hero-glow2" />

        <p className="hp-est-label font-mono-ui">— est. 2026 —</p>

        <h1 className="hp-hero-title font-light-ui">
          <span style={{ fontWeight: 600 }}>PHOTO BOOTH</span><br /><span className="hp-hero-accent">by Zmojz</span>
        </h1>

        <p className="hp-hero-sub">
          Capture moments. Choose your frame. Keep forever.
        </p>

        {/* Strip preview */}
        <div className="hp-strip-group">
          <div className="hp-strip">
            <div className="hp-strip-slot hp-slot-purple" />
            <div className="hp-strip-slot hp-slot-gray" />
            <div className="hp-strip-slot hp-slot-peach" />
            <span className="hp-strip-label font-mono-ui">3 shots</span>
          </div>
          <div className="hp-strip hp-strip-4">
            <div className="hp-strip-slot hp-slot-blue" />
            <div className="hp-strip-slot hp-slot-pink" />
            <div className="hp-strip-slot hp-slot-gray" />
            <div className="hp-strip-slot hp-slot-yellow" />
            <span className="hp-strip-label font-mono-ui">4 shots</span>
          </div>
        </div>

        <div className="hp-hero-btns">
          <button className="hp-btn-main font-mono-ui" onClick={onStart}>
            Start
          </button>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section className="hp-features-section" id="hp-features">
        <div className="hp-section-inner hp-fade-section" ref={featRef}>
          <span className="hp-section-tag font-mono-ui">Features</span>
          <h2 className="hp-section-title font-light-ui">Everything you need</h2>
          <div className="hp-divider" />
          <div className="hp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="hp-feat-card">
                <div className="hp-feat-icon">{f.icon}</div>
                <p className="hp-feat-title">{f.title}</p>
                <p className="hp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section className="hp-about-section" id="hp-about">
        <div className="hp-section-inner hp-fade-section" ref={aboutRef}>
          <div className="hp-about-grid">
            <div className="hp-about-text">
              <span className="hp-section-tag font-mono-ui">About Us</span>
              <h2 className="hp-section-title font-light-ui">Made for moments worth keeping</h2>
              <div className="hp-divider" />
              <p className="hp-about-p">
                Photo Booth by Zmojz brings the charm of a retro photo booth right to your browser.
                No app downloads, no signups — just open, snap, and download your strip.
              </p>
              <p className="hp-about-p">
                I built it to make memories more tangible. Whether it's a solo selfie session
                or a group moment, your photos deserve a beautiful frame.
              </p>
            </div>
            <div className="hp-about-visual">
              <div className="hp-about-strip">
                <div className="hp-about-slot hp-slot-purple" />
                <div className="hp-about-slot hp-slot-blue" />
                <div className="hp-about-slot hp-slot-peach" />
                <span className="hp-strip-label font-mono-ui">by zmojz</span>
              </div>
              <div className="hp-about-strip">
                <div className="hp-about-slot hp-slot-pink" />
                <div className="hp-about-slot hp-slot-green" />
                <div className="hp-about-slot hp-slot-yellow" />
                <div className="hp-about-slot hp-slot-purple" />
                <span className="hp-strip-label font-mono-ui">by zmojz</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="hp-faq-section" id="hp-faq">
        <div className="hp-section-inner hp-fade-section" ref={faqRef}>
          <span className="hp-section-tag font-mono-ui">FAQ</span>
          <h2 className="hp-section-title font-light-ui">Common questions</h2>
          <div className="hp-divider" />
          <div className="hp-faq-list">
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}

    </div>
  );
}
import React from 'react';
import { X, Sparkles, Music, ShieldCheck, Heart } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="qw-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qw-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qw-modal-header">
          <div className="qw-modal-title-wrap">
            {/* Sufi Arch Crest */}
            <svg viewBox="0 0 48 24" fill="none" className="qw-arch-mini">
              <path
                d="M 4 22 L 14 22 C 14 16, 17 12, 20 9 C 22.5 6, 23.5 3, 24 2 C 24.5 3, 25.5 6, 28 9 C 31 12, 34 16, 34 22 L 44 22"
                stroke="#D9A85B"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <h3 className="qw-modal-title">About Qawwali Wala</h3>
          </div>
          <button
            type="button"
            className="qw-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="qw-modal-body">
          <p className="qw-about-lead">
            <strong>Qawwali Wala</strong> is a dedicated sanctuary for timeless Sufi music, bringing the intimacy, devotion, and ecstasy of the traditional Mehfil directly to your digital listening experience.
          </p>

          <div className="qw-about-features-grid">
            <div className="qw-about-feature">
              <div className="qw-feat-icon">
                <Music size={18} />
              </div>
              <div>
                <h4 className="qw-feat-title">Traditional Mehfil Atmosphere</h4>
                <p className="qw-feat-desc">
                  Curated recordings celebrating the harmonium, tabla, and passionate vocal traditions of South Asia.
                </p>
              </div>
            </div>

            <div className="qw-about-feature">
              <div className="qw-feat-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="qw-feat-title">Personal Google Drive Stream</h4>
                <p className="qw-feat-desc">
                  Directly connect your personal Google Drive folders to stream your private audio archive without uploading to third-party servers.
                </p>
              </div>
            </div>

            <div className="qw-about-feature">
              <div className="qw-feat-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="qw-feat-title">Cinematic Minimal UI</h4>
                <p className="qw-feat-desc">
                  Crafted with warm golden hues, rich dark tones, and distraction-free audio controls.
                </p>
              </div>
            </div>
          </div>

          <div className="qw-about-footer-quote">
            <Heart size={14} className="text-gold" />
            <span>Dedicated to the immortal legacy of Sufi masters.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

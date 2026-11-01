import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { MUSIC_QUOTES, getRandomQuote } from '../utils/quotes';

export default function QuoteContainer({ isPlaying, activeTrack }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeAnim, setFadeAnim] = useState(false);
  const prevTrackIdRef = useRef(activeTrack?.id);

  const currentQuote = MUSIC_QUOTES[quoteIndex] || MUSIC_QUOTES[0];

  // Rotate quote periodically when playing (every 30 seconds)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setFadeAnim(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MUSIC_QUOTES.length);
        setFadeAnim(false);
      }, 250);
    }, 30000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // When active track changes, smoothly transition to a fresh quote
  useEffect(() => {
    if (activeTrack?.id && activeTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = activeTrack.id;
      const timeout = setTimeout(() => {
        setFadeAnim(true);
        setTimeout(() => {
          const next = getRandomQuote();
          setQuoteIndex(next.index);
          setFadeAnim(false);
        }, 200);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [activeTrack?.id]);

  const handleNextQuote = (e) => {
    e.stopPropagation();
    setFadeAnim(true);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % MUSIC_QUOTES.length);
      setFadeAnim(false);
    }, 200);
  };

  return (
    <div className="reference-quote-block">
      <p className={`quote-text-body ${fadeAnim ? 'quote-fade' : ''}`}>
        &ldquo;{currentQuote.quote}&rdquo;
      </p>

      <div className="quote-attribution-row">
        <span className="quote-author-name">— {currentQuote.author}</span>
        <button
          type="button"
          className="quote-new-btn"
          onClick={handleNextQuote}
          title="Inspire me with another quote"
        >
          <Sparkles size={11} className="sparkle-icon" />
          <span>New Quote</span>
        </button>
      </div>
    </div>
  );
}

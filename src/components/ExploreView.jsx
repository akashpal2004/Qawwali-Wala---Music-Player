import React from 'react';
import { Play, Sparkles, FolderOpen, Disc3 } from 'lucide-react';

const EXPLORE_COLLECTIONS = [
  {
    id: 'exp-1',
    title: 'Tere Ishq Nachaya',
    subtitle: 'Ecstatic Bulleh Shah Kalaam & Trance',
    tag: 'Legendary',
    artist: 'Ustad Nusrat Fateh Ali Khan',
    duration: '06:12',
    cover: '/cover-tere-ishq.jpg',
  },
  {
    id: 'exp-2',
    title: 'Mast Qalandar',
    subtitle: 'Rousing Spiritual Devotion & Dhamaal',
    tag: 'Classic',
    artist: 'Ustad Nusrat Fateh Ali Khan',
    duration: '05:48',
    cover: '/cover-mast-qalandar.jpg',
  },
  {
    id: 'exp-3',
    title: 'Allah Hoo',
    subtitle: 'Transcendent Zikr & Classical Harmonies',
    tag: 'Spiritual',
    artist: 'Sabri Brothers',
    duration: '07:20',
    cover: '/cover-allah-hoo.jpg',
  },
  {
    id: 'exp-4',
    title: 'Bhar Do Jholi Meri',
    subtitle: 'Timeless Devotional Supplication',
    tag: 'Heritage',
    artist: 'Sabri Brothers',
    duration: '06:37',
    cover: '/cover-bhar-do-jholi.jpg',
  },
];

export default function ExploreView({ onSelectCollection, onOpenLocations }) {
  return (
    <div className="qw-explore-container">
      {/* Explore Banner */}
      <div className="qw-explore-banner">
        <div className="qw-explore-banner-content">
          <div className="qw-explore-badge">
            <Sparkles size={14} />
            <span>Curated Sufi Collections</span>
          </div>
          <h2 className="qw-explore-title">The Mystical World of Qawwali</h2>
          <p className="qw-explore-description">
            Experience centuries of divine verses, ecstatic rhythms, and immortal voices from Nusrat Fateh Ali Khan to the Sabri Brothers.
          </p>
          <div className="qw-explore-actions">
            <button
              type="button"
              className="qw-btn-gold"
              onClick={() => onSelectCollection(EXPLORE_COLLECTIONS[0])}
            >
              <Play size={16} className="play-icon-offset" />
              <span>Listen to Featured</span>
            </button>
            <button
              type="button"
              className="qw-btn-subtle"
              onClick={onOpenLocations}
            >
              <FolderOpen size={16} />
              <span>Browse Drive Folders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="qw-explore-section">
        <div className="qw-section-header">
          <Disc3 size={18} className="text-gold" />
          <h3 className="qw-section-title">Masterpieces of Mehfil</h3>
        </div>

        <div className="qw-explore-grid">
          {EXPLORE_COLLECTIONS.map((item) => (
            <div
              key={item.id}
              className="qw-explore-card"
              onClick={() => onSelectCollection(item)}
              role="button"
              tabIndex={0}
            >
              <div className="qw-explore-card-thumb">
                <img
                  src={item.cover}
                  alt={item.title}
                  onError={(e) => {
                    e.target.src = '/hero-player-thumb.jpg';
                  }}
                />
                <button
                  type="button"
                  className="qw-card-play-btn"
                  title={`Play ${item.title}`}
                  aria-label={`Play ${item.title}`}
                >
                  <Play size={18} className="play-icon-offset" />
                </button>
              </div>
              <div className="qw-explore-card-info">
                <div className="qw-card-tag">{item.tag}</div>
                <h4 className="qw-card-title">{item.title}</h4>
                <p className="qw-card-artist">{item.artist}</p>
                <p className="qw-card-subtitle">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

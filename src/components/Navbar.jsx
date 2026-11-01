import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  User,
  FolderOpen,
  LogOut,
  Loader2,
  CheckCircle2,
  HardDrive,
  X,
  Info,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  onTabChange,
  isAuthenticated,
  isLoading,
  error: _error,
  onLogin,
  onLogout,
  locationsCount,
  onOpenLocations,
  searchQuery,
  onSearchChange,
  onOpenAbout,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    if (activeTab !== 'home' && activeTab !== 'explore') {
      onTabChange('home');
    }
  };

  return (
    <header className="qw-navbar">
      <div className="qw-navbar-inner">
        {/* Left: Brand Logo (Stacked Arch Crest + Serif Name) */}
        <div
          className="qw-brand-wrap"
          onClick={() => onTabChange('home')}
          role="button"
          tabIndex={0}
          aria-label="Qawwali Wala Home"
        >
          <div className="qw-navbar-brand-lockup">
            <div className="qw-logo-crest" aria-hidden="true">
              <svg viewBox="0 0 36 20" fill="none" className="qw-arch-svg">
                <path
                  d="M 3 18 C 7 12, 13 5, 18 2 C 23 5, 29 12, 33 18"
                  stroke="#D9A85B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="18" cy="2" r="1.6" fill="#D9A85B" />
              </svg>
            </div>
            <div className="qw-brand-stacked-text">
              <span className="qw-brand-stacked-qawwali">Qawwali</span>
              <span className="qw-brand-stacked-wala">Wala</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links (Home, Explore, About) */}
        <nav className="qw-nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className={`qw-nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            Home
            {activeTab === 'home' && <span className="qw-nav-active-indicator" />}
          </button>
          <button
            type="button"
            className={`qw-nav-link ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => onTabChange('explore')}
          >
            Explore
            {activeTab === 'explore' && <span className="qw-nav-active-indicator" />}
          </button>
          <button
            type="button"
            className="qw-nav-link"
            onClick={onOpenAbout}
          >
            About
          </button>
        </nav>

        {/* Right: Search Bar & Profile Avatar */}
        <div className="qw-nav-right">
          {/* Desktop Search Bar */}
          <div className="qw-search-bar">
            <Search size={15} className="qw-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="qw-search-input"
              placeholder="Search songs, artists..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
            />
            {searchQuery && (
              <button
                type="button"
                className="qw-search-clear"
                onClick={() => onSearchChange('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Mobile Search Icon Toggle */}
          <button
            type="button"
            className={`qw-icon-btn qw-mobile-search-toggle ${mobileSearchVisible ? 'active' : ''}`}
            onClick={() => {
              setMobileSearchVisible(!mobileSearchVisible);
              if (!mobileSearchVisible && searchInputRef.current) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            title="Search"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* User Profile Avatar / Drive Integration Dropdown */}
          <div className="qw-profile-anchor" ref={dropdownRef}>
            <button
              type="button"
              className={`qw-profile-btn ${isAuthenticated ? 'is-connected' : ''} ${profileDropdownOpen ? 'is-open' : ''}`}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title={isAuthenticated ? 'Account Connected' : 'User Account & Drive'}
              aria-label="Account Settings"
            >
              <User size={18} />
              {isAuthenticated && <span className="qw-online-dot" />}
            </button>

            {/* Profile & Drive Settings Dropdown */}
            {profileDropdownOpen && (
              <div className="qw-profile-dropdown" role="menu">
                <div className="qw-dropdown-header">
                  <div className="qw-user-info">
                    <span className="qw-user-title">Qawwali Wala Member</span>
                    <span className="qw-user-sub">
                      {isAuthenticated ? 'Google Drive Connected' : 'Guest Listener'}
                    </span>
                  </div>
                </div>

                <div className="qw-dropdown-divider" />

                <div className="qw-dropdown-body">
                  {/* Google Drive Status & Connection */}
                  <div className="qw-dropdown-item-wrap">
                    {isAuthenticated ? (
                      <div className="qw-connected-badge">
                        <CheckCircle2 size={15} className="text-gold" />
                        <span>Google Drive Connected</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="qw-btn-drive-connect"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogin();
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={15} className="spin-fast" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <HardDrive size={15} />
                            <span>Connect Google Drive</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Drive Locations Manager */}
                  <button
                    type="button"
                    className="qw-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenLocations();
                    }}
                  >
                    <FolderOpen size={16} />
                    <span>Drive Folders</span>
                    {locationsCount > 0 && (
                      <span className="qw-badge-count">{locationsCount}</span>
                    )}
                  </button>

                  {/* About Modal */}
                  <button
                    type="button"
                    className="qw-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenAbout();
                    }}
                  >
                    <Info size={16} />
                    <span>About Qawwali Wala</span>
                  </button>
                </div>

                {isAuthenticated && (
                  <>
                    <div className="qw-dropdown-divider" />
                    <button
                      type="button"
                      className="qw-dropdown-item qw-signout-item"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Disconnect & Sign Out</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Expanding Search Bar */}
      {mobileSearchVisible && (
        <div className="qw-mobile-search-bar">
          <Search size={16} className="qw-search-icon" />
          <input
            type="text"
            className="qw-mobile-search-input"
            placeholder="Search songs, artists..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="qw-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}
    </header>
  );
}

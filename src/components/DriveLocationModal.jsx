import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Check,
  Trash2,
  X,
  Sparkles,
  HardDrive,
  Info,
} from 'lucide-react';
import { extractDriveFolderId } from '../services/driveService';

export default function DriveLocationModal({
  isOpen,
  onClose,
  locations,
  activeLocationId,
  onSelectLocation,
  onAddLocation,
  onDeleteLocation,
}) {
  const [newLocName, setNewLocName] = useState('');
  const [newLocUrl, setNewLocUrl] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = newLocName.trim();
    const cleanId = extractDriveFolderId(newLocUrl);

    if (!trimmedName) {
      setFormError('Please enter a name for this music folder location.');
      return;
    }

    if (!cleanId) {
      setFormError('Please enter a valid Google Drive Folder ID or share link.');
      return;
    }

    // Check if ID already exists
    const exists = locations.some((loc) => loc.folderId === cleanId);
    if (exists) {
      setFormError('This Google Drive folder location is already added.');
      return;
    }

    onAddLocation({
      name: trimmedName,
      folderId: cleanId,
    });

    setNewLocName('');
    setNewLocUrl('');
    setFormError('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title-group">
            <div className="modal-icon-badge">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 id="modal-title" className="modal-title">Drive Locations</h2>
              <p className="modal-subtitle">
                Switch or add Google Drive folders to stream your music libraries
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Section 1: Active & Configured Locations */}
          <div className="modal-section">
            <h3 className="section-heading">Available Libraries ({locations.length})</h3>
            <div className="locations-list">
              {locations.map((loc) => {
                const isActive = loc.id === activeLocationId;
                return (
                  <div
                    key={loc.id}
                    className={`location-card ${isActive ? 'location-card-active' : ''}`}
                    onClick={() => onSelectLocation(loc.id)}
                  >
                    <div className="location-card-left">
                      <div className={`location-folder-icon ${isActive ? 'active-icon' : ''}`}>
                        <Folder size={18} />
                      </div>
                      <div className="location-info">
                        <div className="location-name-row">
                          <span className="location-name">{loc.name}</span>
                          {isActive && (
                            <span className="location-active-badge">
                              <Check size={12} /> Active
                            </span>
                          )}
                        </div>
                        <span className="location-hint">
                          {loc.isDefault ? 'Default Library' : 'Custom Drive Location'}
                        </span>
                      </div>
                    </div>

                    <div className="location-card-actions" onClick={(e) => e.stopPropagation()}>
                      {!isActive && (
                        <button
                          type="button"
                          className="btn-select-location"
                          onClick={() => onSelectLocation(loc.id)}
                        >
                          Switch
                        </button>
                      )}
                      {locations.length > 1 && (
                        <button
                          type="button"
                          className="btn-delete-location"
                          onClick={() => onDeleteLocation(loc.id)}
                          title="Remove this folder location"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Add New Location Form */}
          <div className="modal-section add-location-section">
            <h3 className="section-heading">
              <FolderPlus size={16} /> Add Another Drive Location
            </h3>
            <form onSubmit={handleSubmit} className="add-location-form">
              {formError && <div className="form-error-banner">{formError}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="loc-name">
                  Location Name
                </label>
                <input
                  id="loc-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acoustic & Lo-Fi, My MP3 Library"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loc-url">
                  Google Drive Folder Link or Folder ID
                </label>
                <input
                  id="loc-url"
                  type="text"
                  className="form-input"
                  placeholder="https://drive.google.com/drive/folders/1nx4Kh... or Folder ID"
                  value={newLocUrl}
                  onChange={(e) => setNewLocUrl(e.target.value)}
                />
                <span className="form-hint">
                  <Info size={12} /> Paste any public or shared Google Drive folder URL.
                </span>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-add-loc">
                  <FolderPlus size={16} />
                  <span>Add Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="modal-footer-tip">
            <Sparkles size={13} className="text-accent" />
            Switching locations automatically scans and loads audio files.
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

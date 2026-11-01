/**
 * Helper to format audio playback seconds to MM:SS string
 *
 * @param {number} seconds
 * @returns {string} formatted time e.g. "03:45"
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

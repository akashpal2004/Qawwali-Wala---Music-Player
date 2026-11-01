import { useState, useEffect, useRef, useCallback } from 'react';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const STORAGE_TOKEN_KEY = 'qw_gdrive_access_token_v1';
const STORAGE_EXPIRES_KEY = 'qw_gdrive_token_expires_at_v1';
const STORAGE_CONNECTED_KEY = 'qw_gdrive_is_connected_v1';

/**
 * Read persisted auth state from localStorage.
 */
function getSavedAuthState() {
  if (typeof window === 'undefined') {
    return { token: null, expiresAt: null, isConnected: false };
  }
  try {
    const isConnected = localStorage.getItem(STORAGE_CONNECTED_KEY) === 'true';
    if (!isConnected) {
      return { token: null, expiresAt: null, isConnected: false };
    }

    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(STORAGE_EXPIRES_KEY);
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

    // Check if stored token is still valid (with 60-second safety grace period)
    if (token && expiresAt && expiresAt > Date.now() + 60000) {
      return { token, expiresAt, isConnected: true };
    }

    // Token expired or missing, but user was marked as connected
    return { token: null, expiresAt: null, isConnected: true };
  } catch (err) {
    console.warn('Failed to read auth state from localStorage:', err);
    return { token: null, expiresAt: null, isConnected: false };
  }
}

/**
 * Persist current auth state to localStorage.
 */
function persistAuthState(token, expiresAt) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_CONNECTED_KEY, 'true');
      if (expiresAt) {
        localStorage.setItem(STORAGE_EXPIRES_KEY, expiresAt.toString());
      }
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_EXPIRES_KEY);
    }
  } catch (err) {
    console.warn('Failed to persist auth state to localStorage:', err);
  }
}

/**
 * Remove all persisted auth state on explicit logout.
 */
function clearPersistedAuthState() {
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_EXPIRES_KEY);
    localStorage.removeItem(STORAGE_CONNECTED_KEY);
  } catch (err) {
    console.warn('Failed to clear auth state from localStorage:', err);
  }
}

/**
 * Custom hook for managing Google Identity Services (GIS) OAuth 2.0 token flow
 * with persistent session across page reloads and automatic token renewal.
 *
 * @param {string} [customClientId] - Optional override for Google Client ID
 * @returns {object} Auth state and login/logout methods
 */
export function useGoogleDriveAuth(customClientId) {
  const clientId = customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize directly from localStorage to keep user connected immediately across refreshes
  const [initialAuth] = useState(() => getSavedAuthState());
  const [token, setToken] = useState(initialAuth.token);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(initialAuth.expiresAt);
  const [isDriveConnected, setIsDriveConnected] = useState(initialAuth.isConnected);
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiReady, setIsGsiReady] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.google?.accounts?.oauth2);
  });
  const [error, setError] = useState(null);

  const tokenClientRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const isManualLoginRef = useRef(false);

  // Poll for Google Identity Services script availability if not yet ready
  useEffect(() => {
    if (isGsiReady) return;

    let checkInterval = null;
    const checkGsi = () => {
      if (window.google?.accounts?.oauth2) {
        setIsGsiReady(true);
        if (checkInterval) clearInterval(checkInterval);
      }
    };

    if (window.google?.accounts?.oauth2) {
      setIsGsiReady(true);
    } else {
      checkInterval = setInterval(checkGsi, 100);
      const timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        if (!window.google?.accounts?.oauth2) {
          setError('Google Identity Services script failed to load. Check your network or ad blockers.');
        }
      }, 10000);

      return () => {
        if (checkInterval) clearInterval(checkInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [isGsiReady]);

  // Initialize the Token Client once GIS is ready and Client ID is available
  useEffect(() => {
    if (!isGsiReady) return;

    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID is not configured in your .env file.');
      return;
    }

    try {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: (tokenResponse) => {
          setIsLoading(false);
          if (tokenResponse.error) {
            console.error('Google OAuth token error:', tokenResponse);

            // If silent refresh failed and user explicitly clicked login, launch interactive consent
            if (tokenResponse.error === 'interaction_required' && isManualLoginRef.current) {
              isManualLoginRef.current = false;
              tokenClientRef.current?.requestAccessToken({ prompt: 'consent' });
              return;
            }

            if (tokenResponse.error !== 'interaction_required') {
              setError(`Authentication failed: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            return;
          }

          if (tokenResponse.access_token) {
            isManualLoginRef.current = false;
            const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600;
            const expiresAtTimestamp = Date.now() + expiresIn * 1000;
            setToken(tokenResponse.access_token);
            setTokenExpiresAt(expiresAtTimestamp);
            setIsDriveConnected(true);
            setError(null);
            persistAuthState(tokenResponse.access_token, expiresAtTimestamp);
          }
        },
        error_callback: (err) => {
          setIsLoading(false);
          isManualLoginRef.current = false;
          console.error('Google Identity Services error:', err);
          if (err?.type !== 'popup_closed') {
            setError(err.message || 'Error occurred while requesting Google authentication.');
          }
        },
      });

      // If user was previously connected but the stored token is expired or missing, auto-refresh silently
      const savedAuth = getSavedAuthState();
      if (savedAuth.isConnected && !savedAuth.token) {
        setIsLoading(true);
        tokenClientRef.current.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      console.error('Failed to initialize Google token client:', err);
      setError('Failed to initialize Google Identity Services client.');
    }
  }, [isGsiReady, clientId]);

  // Proactively renew token 5 minutes before it expires
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!token || !tokenExpiresAt || !isDriveConnected) return;

    const timeUntilExpiry = tokenExpiresAt - Date.now();
    const refreshDelay = Math.max(10000, timeUntilExpiry - 5 * 60 * 1000);

    refreshTimerRef.current = setTimeout(() => {
      if (tokenClientRef.current && isDriveConnected) {
        console.log('Proactively renewing Google Drive access token in background...');
        try {
          tokenClientRef.current.requestAccessToken({ prompt: '' });
        } catch (e) {
          console.warn('Proactive token renewal failed:', e);
        }
      }
    }, refreshDelay);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, tokenExpiresAt, isDriveConnected]);

  /**
   * Trigger Google OAuth 2.0 flow
   */
  const login = useCallback(() => {
    setError(null);

    if (!clientId) {
      setError('Missing Google Client ID. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      return;
    }

    if (!tokenClientRef.current) {
      setError('Google Identity Services is still initializing. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    setIsDriveConnected(true);
    isManualLoginRef.current = true;

    try {
      localStorage.setItem(STORAGE_CONNECTED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to set connected flag:', e);
    }

    try {
      // Prompt user for consent if not previously granted
      tokenClientRef.current.requestAccessToken({ prompt: '' });
    } catch (err) {
      setIsLoading(false);
      isManualLoginRef.current = false;
      console.error('Error invoking requestAccessToken:', err);
      setError('Failed to launch Google sign-in dialog.');
    }
  }, [clientId]);

  /**
   * Revoke token, clear auth state, and remove from localStorage
   */
  const logout = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);

    if (currentToken && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(currentToken, () => {
          console.log('Google OAuth token successfully revoked.');
        });
      } catch (err) {
        console.warn('Could not revoke Google token:', err);
      }
    }

    clearPersistedAuthState();
    setToken(null);
    setTokenExpiresAt(null);
    setIsDriveConnected(false);
    setError(null);
    setIsLoading(false);
    isManualLoginRef.current = false;
  }, [token]);

  return {
    token,
    isAuthenticated: Boolean(token),
    isDriveConnected,
    isLoading,
    isGsiReady,
    error,
    tokenExpiresAt,
    login,
    logout,
  };
}

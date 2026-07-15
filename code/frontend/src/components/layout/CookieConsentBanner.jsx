import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const STORAGE_KEY = 'cyna_cookie_consent';
const COOKIE_NAME = 'cyna_cookie_consent';
const DEFAULT_CONSENT = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  timestamp: null,
};

function readConsent() {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const cookieValue = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

    if (!cookieValue) return DEFAULT_CONSENT;

    try {
      return JSON.parse(decodeURIComponent(cookieValue.split('=').slice(1).join('=')));
    } catch {
      return DEFAULT_CONSENT;
    }
  }

  try {
    return JSON.parse(saved);
  } catch {
    return DEFAULT_CONSENT;
  }
}

function persistConsent(value) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify(value);
  window.localStorage.setItem(STORAGE_KEY, payload);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(payload)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState(DEFAULT_CONSENT);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    setConsent(saved);
    setIsOpen(!saved.timestamp);
  }, []);

  const isAccepted = useMemo(() => Boolean(consent.timestamp), [consent.timestamp]);

  function saveConsent(nextConsent) {
    const payload = {
      ...DEFAULT_CONSENT,
      ...nextConsent,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    persistConsent(payload);
    setConsent(payload);
    setIsOpen(false);
    setShowPreferences(false);
  }

  function rejectAll() {
    saveConsent({ preferences: false, analytics: false, marketing: false });
  }

  function acceptAll() {
    saveConsent({ preferences: true, analytics: true, marketing: true });
  }

  function savePreferences() {
    saveConsent(consent);
  }

  function toggleCategory(key) {
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      {!isAccepted && isOpen && (
        <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Consentement aux cookies">
          <div className="cookie-banner__content">
            <div>
              <p>
                Nous utilisons des cookies essentiels au fonctionnement du site et, si vous acceptez, des cookies pour la personnalisation, l’analyse et la publicité.{' '}
                <Link to="/politique-confidentialite">Consulter la politique</Link>
              </p>
            </div>
            <div className="cookie-banner__actions">
              <Button variante="contour" petit onClick={() => setShowPreferences(true)}>
                Personnaliser
              </Button>
              <Button variante="contour" petit onClick={rejectAll}>
                Refuser
              </Button>
              <Button variante="rose" petit onClick={acceptAll}>
                Accepter tout
              </Button>
            </div>
          </div>

          {showPreferences && (
            <div className="cookie-banner__prefs">
              <label>
                <input type="checkbox" checked={consent.preferences} onChange={() => toggleCategory('preferences')} />
                Cookies de préférence
              </label>
              <label>
                <input type="checkbox" checked={consent.analytics} onChange={() => toggleCategory('analytics')} />
                Cookies d’analyse
              </label>
              <label>
                <input type="checkbox" checked={consent.marketing} onChange={() => toggleCategory('marketing')} />
                Cookies marketing
              </label>
              <div className="cookie-banner__actions cookie-banner__actions--inline">
                <Button variante="contour" petit onClick={savePreferences}>
                  Enregistrer
                </Button>
                <Button variante="rose" petit onClick={acceptAll}>
                  Tout accepter
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAccepted && (
        <div className="cookie-banner cookie-banner--compact">
          <div className="cookie-banner__content">
            <p>Votre choix a été enregistré. Vous pouvez le modifier à tout moment.</p>
            <div className="cookie-banner__actions">
              <Button variante="contour" petit onClick={() => { setConsent(readConsent()); setIsOpen(true); setShowPreferences(true); }}>
                Gérer les cookies
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

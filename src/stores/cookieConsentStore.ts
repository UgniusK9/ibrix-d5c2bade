import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string | null;
  version: number;
}

interface CookieConsentStore {
  consent: CookieConsent | null;
  isModalOpen: boolean;
  hasInteracted: boolean;
  
  // Actions
  setConsent: (consent: Partial<CookieConsent>) => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  openModal: () => void;
  closeModal: () => void;
  getConsent: () => CookieConsent | null;
}

const defaultConsent: CookieConsent = {
  necessary: true, // Always true, cannot be changed
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: null,
  version: 1,
};

// Cookie helper to sync with document.cookie
const setCookieConsentCookie = (consent: CookieConsent) => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `ibrix_cookie_consent=${encodeURIComponent(JSON.stringify(consent))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Clear analytics/marketing cookies when user opts out
const clearThirdPartyCookies = (consent: CookieConsent) => {
  const cookiesToClear: string[] = [];
  
  if (!consent.analytics) {
    // Google Analytics cookies
    cookiesToClear.push('_ga', '_ga_', '_gid', '_gat', '_gcl_au');
  }
  
  if (!consent.marketing) {
    // Meta/Facebook cookies
    cookiesToClear.push('_fbp', '_fbc', 'fr');
  }
  
  cookiesToClear.forEach(cookieName => {
    // Clear for current domain
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    // Clear for .domain
    const domain = window.location.hostname;
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
  });
};

export const useCookieConsentStore = create<CookieConsentStore>()(
  persist(
    (set, get) => ({
      consent: null,
      isModalOpen: false,
      hasInteracted: false,

      setConsent: (partialConsent) => {
        const currentConsent = get().consent || defaultConsent;
        const newConsent: CookieConsent = {
          ...currentConsent,
          ...partialConsent,
          necessary: true, // Always enforce necessary
          updatedAt: new Date().toISOString(),
          version: 1,
        };
        
        set({ consent: newConsent, hasInteracted: true, isModalOpen: false });
        setCookieConsentCookie(newConsent);
        clearThirdPartyCookies(newConsent);
      },

      acceptAll: () => {
        const newConsent: CookieConsent = {
          necessary: true,
          functional: true,
          analytics: true,
          marketing: true,
          updatedAt: new Date().toISOString(),
          version: 1,
        };
        
        set({ consent: newConsent, hasInteracted: true, isModalOpen: false });
        setCookieConsentCookie(newConsent);
      },

      rejectNonEssential: () => {
        const newConsent: CookieConsent = {
          necessary: true,
          functional: false,
          analytics: false,
          marketing: false,
          updatedAt: new Date().toISOString(),
          version: 1,
        };
        
        set({ consent: newConsent, hasInteracted: true, isModalOpen: false });
        setCookieConsentCookie(newConsent);
        clearThirdPartyCookies(newConsent);
      },

      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      
      getConsent: () => get().consent,
    }),
    {
      name: 'ibrix_cookie_consent',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        consent: state.consent,
        hasInteracted: state.hasInteracted,
      }),
    }
  )
);

// Hook to check if specific consent is given
export const useHasConsent = (type: keyof Omit<CookieConsent, 'updatedAt' | 'version'>): boolean => {
  const consent = useCookieConsentStore((state) => state.consent);
  if (!consent) return type === 'necessary';
  return consent[type];
};

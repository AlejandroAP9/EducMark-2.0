/** Thin wrapper around gtag for type-safe event tracking (2.22) */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  window.gtag?.('event', eventName, params);
}

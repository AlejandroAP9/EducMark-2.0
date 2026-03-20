/** Thin wrapper around gtag for type-safe event tracking (2.22) */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  window.gtag?.('event', eventName, params);
}

/** Track page view on mount */
export function trackPageView(page: string) {
  window.gtag?.('event', 'page_view', { page });
}

/** Track scroll depth at section milestones */
const trackedMilestones = new Set<number>();

export function initScrollDepthTracking() {
  if (typeof window === 'undefined') return;

  const milestones = [25, 50, 75, 100];

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight === 0) return;

    const percent = Math.round((scrollTop / scrollHeight) * 100);

    for (const milestone of milestones) {
      if (percent >= milestone && !trackedMilestones.has(milestone)) {
        trackedMilestones.add(milestone);
        trackEvent('scroll_depth', { percent: milestone });
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}

/**
 * Analytics Utility
 *
 * Provides a unified interface for tracking user events.
 * Currently logs to console. In the future, this will connect
 * to PostHog, Google Analytics, or Supabase Telemetry.
 */

export function trackEvent(eventName: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, payload || "");
  }

  // TODO: Add external analytics provider integration here
  // e.g., posthog.capture(eventName, payload);
}

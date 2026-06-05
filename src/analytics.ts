type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = {
  id: string;
  name: string;
  properties: AnalyticsProperties;
  createdAt: string;
  path: string;
};

const ANALYTICS_KEY = 'ggbox.analytics.events';
const MAX_EVENTS = 160;

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function createEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `evt_${crypto.randomUUID()}`;
  }

  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readStoredEvents() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(ANALYTICS_KEY);
    return saved ? (JSON.parse(saved) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function saveStoredEvents(events: AnalyticsEvent[]) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
}

function pushDataLayer(event: AnalyticsEvent) {
  if (typeof window === 'undefined') {
    return;
  }

  const dataLayer = ((window as Window & { dataLayer?: unknown[] }).dataLayer ??= []);
  dataLayer.push({
    event: event.name,
    ...event.properties,
    event_id: event.id,
    page_path: event.path,
  });
}

function sendToEndpoint(event: AnalyticsEvent) {
  if (typeof window === 'undefined') {
    return;
  }

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;

  if (!endpoint) {
    return;
  }

  const payload = JSON.stringify(event);
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  const event: AnalyticsEvent = {
    id: createEventId(),
    name,
    properties,
    createdAt: new Date().toISOString(),
    path: typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`,
  };

  saveStoredEvents([event, ...readStoredEvents()]);
  pushDataLayer(event);
  sendToEndpoint(event);
  return event;
}

export function getStoredAnalyticsEvents() {
  return readStoredEvents();
}

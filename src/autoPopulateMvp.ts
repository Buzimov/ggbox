import {
  type ContentOrigin,
  type CreatorImporterState,
  type CreatorPlatform,
  type CreatorProfile,
  Guardrails,
  type MomentCandidate,
  type MomentCard,
  MomentScoringService,
  type RightsStatus,
  type SourceAsset,
  createMomentCard,
  loadCreatorImporterState,
  saveCreatorImporterState,
} from './creatorMomentImporter';

export type AutoPopulateSource = 'twitch_popular_clips' | 'youtube_safe_videos' | 'mixed_safe' | 'demo_fallback';

export type AutoPopulateSettings = {
  source: AutoPopulateSource;
  numberOfCreators: number;
  momentsPerCreator: number;
  minimumScore: number;
  autoPublish: boolean;
};

export type AutoPopulateResult = {
  provider: string;
  usedFallback: boolean;
  message: string;
  providerStatuses: ProviderStatus[];
  debug: AutoPopulateDebugInfo;
  creators: CreatorProfile[];
  assets: SourceAsset[];
  candidates: MomentCandidate[];
  cards: MomentCard[];
  state: CreatorImporterState;
};

export type ProviderStatus = {
  name: 'DemoProvider' | 'TwitchProvider' | 'YouTubeProvider';
  status: 'ready' | 'missing credentials' | 'missing API key' | 'error';
  detail: string;
};

export type AutoPopulateDebugInfo = {
  credentialsDetected: boolean;
  providerMode: 'demo' | 'real_twitch' | 'real_youtube' | 'mixed_real' | 'fallback';
  lastApiRequestStatus: string;
  fetchedCreatorsCount: number;
  fetchedClipsCount: number;
  fallbackReason?: string;
};

export type TwitchProviderTestResult = {
  ok: boolean;
  credentialsDetected: boolean;
  providerMode: 'real_twitch' | 'fallback';
  status: string;
  fallbackReason?: string;
  creator?: {
    id: string;
    login: string;
    display_name: string;
    profile_image_url: string;
  };
  clips: Array<{
    id: string;
    title: string;
    url: string;
    embed_url: string;
    thumbnail_url: string;
    view_count: number;
    duration: number;
  }>;
};

type DemoCreatorSeed = {
  platform: CreatorPlatform;
  handle: string;
  displayName: string;
  avatarUrl: string;
  channelUrl: string;
  sourceCredit: string;
  clips: DemoClipSeed[];
};

type DemoClipSeed = {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number;
  daysOld: number;
  sourceUrl?: string;
  embedUrl?: string;
  externalClipId?: string;
  externalVideoId?: string;
  contentOrigin?: ContentOrigin;
};

const DAY_MS = 86400000;
const timestamp = () => new Date().toISOString();
const stableId = (prefix: string, raw: string) => `${prefix}_${raw.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
let runtimeEnvOverride: Record<string, string | undefined> | null = null;
export const setAutoPopulateRuntimeEnvForTests = (env: Record<string, string | undefined> | null) => {
  runtimeEnvOverride = env;
};
const getEnv = () => runtimeEnvOverride ?? (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const DEMO_CREATORS: DemoCreatorSeed[] = [
  {
    platform: 'twitch',
    handle: 'kirovfps',
    displayName: 'Max Kirov',
    avatarUrl: './assets/characters/tactical-orange.png',
    channelUrl: 'https://www.twitch.tv/kirovfps',
    sourceCredit: 'Max Kirov on Twitch',
    clips: [
      { id: 'kirov-final-smoke', title: 'Final smoke read into a one HP retake', thumbnailUrl: './assets/drop-pack-counter-strike.png', duration: 10.4, viewCount: 48200, daysOld: 2 },
      { id: 'kirov-ramp-clutch', title: 'Insane ramp clutch with chat exploding', thumbnailUrl: './assets/characters/tactical-orange.png', duration: 8.8, viewCount: 30640, daysOld: 4 },
      { id: 'kirov-perfect-save', title: 'Perfect save round turns into a full buy', thumbnailUrl: './assets/characters/live-purple.png', duration: 14.2, viewCount: 19400, daysOld: 8 },
    ],
  },
  {
    platform: 'youtube',
    handle: 'mirablocks',
    displayName: 'Mira Blocks',
    avatarUrl: './assets/characters/cozy-green.png',
    channelUrl: 'https://www.youtube.com/@mirablocks',
    sourceCredit: 'Mira Blocks on YouTube',
    clips: [
      { id: 'mira-skyline-reveal', title: 'Mega build reveal from bedrock to skyline', thumbnailUrl: './assets/drop-pack-minecraft.png', duration: 48, viewCount: 58800, daysOld: 3 },
      { id: 'mira-lantern-switch', title: 'Lantern switch wakes the whole city', thumbnailUrl: './assets/characters/cozy-green.png', duration: 34, viewCount: 32120, daysOld: 5 },
      { id: 'mira-timelapse-final', title: 'Perfect timelapse lands on the final block', thumbnailUrl: './assets/characters/creator-cream.png', duration: 55, viewCount: 28450, daysOld: 7 },
    ],
  },
  {
    platform: 'twitch',
    handle: 'danicore',
    displayName: 'Dani Core',
    avatarUrl: './assets/characters/mage-red.png',
    channelUrl: 'https://www.twitch.tv/danicore',
    sourceCredit: 'Dani Core on Twitch',
    clips: [
      { id: 'dani-roshan-rampage', title: 'Roshan pit turn into a full rampage', thumbnailUrl: './assets/drop-pack-dota.png', duration: 11.6, viewCount: 64200, daysOld: 1 },
      { id: 'dani-perfect-blink', title: 'Perfect blink saves the final fight', thumbnailUrl: './assets/characters/mage-red.png', duration: 9.8, viewCount: 24800, daysOld: 6 },
      { id: 'dani-mega-reaction', title: 'Mega reaction after the buyback call', thumbnailUrl: './assets/characters/pink-hype.png', duration: 12.1, viewCount: 22650, daysOld: 9 },
    ],
  },
  {
    platform: 'youtube',
    handle: 'alinaframe',
    displayName: 'Alina Frame',
    avatarUrl: './assets/characters/creator-cream.png',
    channelUrl: 'https://www.youtube.com/@alinaframe',
    sourceCredit: 'Alina Frame on YouTube',
    clips: [
      { id: 'alina-neon-rain', title: 'Street camera pass through neon rain', thumbnailUrl: './assets/drop-pack-irl.png', duration: 42, viewCount: 37200, daysOld: 2 },
      { id: 'alina-market-reveal', title: 'Night market reveal as the crowd opens', thumbnailUrl: './assets/characters/creator-cream.png', duration: 37, viewCount: 17900, daysOld: 5 },
      { id: 'alina-final-crosswalk', title: 'Final crosswalk timing feels unreal', thumbnailUrl: './assets/characters/live-purple.png', duration: 29, viewCount: 15240, daysOld: 10 },
    ],
  },
  {
    platform: 'twitch',
    handle: 'verapulse',
    displayName: 'Vera Pulse',
    avatarUrl: './assets/characters/pink-hype.png',
    channelUrl: 'https://www.twitch.tv/verapulse',
    sourceCredit: 'Vera Pulse on Twitch',
    clips: [
      { id: 'vera-bass-drop', title: 'Bass drop synced with the stage blackout', thumbnailUrl: './assets/characters/pink-hype.png', duration: 7.4, viewCount: 41800, daysOld: 3 },
      { id: 'vera-live-pulse', title: 'Live crowd pulse hits on the final beat', thumbnailUrl: './assets/characters/live-purple.png', duration: 9.5, viewCount: 29600, daysOld: 7 },
      { id: 'vera-perfect-cut', title: 'Perfect drop cut becomes a chat moment', thumbnailUrl: './assets/drop-pack-irl.png', duration: 8.9, viewCount: 21750, daysOld: 11 },
    ],
  },
  {
    platform: 'youtube',
    handle: 'rushlive',
    displayName: 'Nikita Rush',
    avatarUrl: './assets/characters/live-purple.png',
    channelUrl: 'https://www.youtube.com/@rushlive',
    sourceCredit: 'Nikita Rush on YouTube',
    clips: [
      { id: 'rush-rooftop-escape', title: 'Rooftop escape into a perfect police dodge', thumbnailUrl: './assets/drop-pack-irl.png', duration: 31, viewCount: 52200, daysOld: 4 },
      { id: 'rush-bike-transfer', title: 'Final bike transfer above downtown', thumbnailUrl: './assets/characters/tactical-orange.png', duration: 27, viewCount: 33950, daysOld: 9 },
      { id: 'rush-mega-chase', title: 'Mega chase turns into a clean exit', thumbnailUrl: './assets/characters/live-purple.png', duration: 39, viewCount: 28600, daysOld: 12 },
    ],
  },
];

const hasTwitchApiArchitectureConfigured = () => {
  const env = getEnv();
  return Boolean(env.VITE_TWITCH_PROVIDER_URL || (env.VITE_TWITCH_CLIENT_ID && env.VITE_TWITCH_ACCESS_TOKEN));
};

const hasYouTubeApiArchitectureConfigured = () => {
  const env = getEnv();
  return Boolean(env.VITE_YOUTUBE_PROVIDER_URL || env.VITE_YOUTUBE_API_KEY);
};

export const getAutoPopulateProviderStatuses = (): ProviderStatus[] => [
  {
    name: 'DemoProvider',
    status: 'ready',
    detail: 'Safe local thumbnails and mock metadata are available.',
  },
  {
    name: 'TwitchProvider',
    status: hasTwitchApiArchitectureConfigured() ? 'ready' : 'missing credentials',
    detail: hasTwitchApiArchitectureConfigured()
      ? 'Configured for official Helix users/clips metadata.'
      : 'Set VITE_TWITCH_PROVIDER_URL or VITE_TWITCH_CLIENT_ID + VITE_TWITCH_ACCESS_TOKEN.',
  },
  {
    name: 'YouTubeProvider',
    status: hasYouTubeApiArchitectureConfigured() ? 'ready' : 'missing API key',
    detail: hasYouTubeApiArchitectureConfigured()
      ? 'Configured for safe embeddable YouTube metadata.'
      : 'Set VITE_YOUTUBE_PROVIDER_URL or VITE_YOUTUBE_API_KEY.',
  },
];

const platformForSource = (source: AutoPopulateSource, index: number): CreatorPlatform | undefined => {
  if (source === 'twitch_popular_clips') return 'twitch';
  if (source === 'youtube_safe_videos') return 'youtube';
  if (source === 'demo_fallback') return undefined;
  return index % 2 === 0 ? 'twitch' : 'youtube';
};

const getEmbedUrl = (platform: CreatorPlatform, externalId: string, contentOrigin: ContentOrigin) => {
  if (contentOrigin === 'demo') {
    return undefined;
  }

  if (platform === 'twitch') {
    const parent = typeof window === 'undefined' ? 'localhost' : window.location?.hostname || 'localhost';
    const params = new URLSearchParams({ clip: externalId, parent, autoplay: 'false' });
    return `https://clips.twitch.tv/embed?${params.toString()}`;
  }

  if (platform === 'youtube') {
    return `https://www.youtube.com/embed/${externalId}`;
  }

  return undefined;
};

const getRightsStatus = (platform: CreatorPlatform): RightsStatus => {
  if (platform === 'twitch') return 'twitch_embed_only';
  if (platform === 'youtube') return 'youtube_embed_only';
  return 'demo';
};

const toCreatorProfile = (seed: DemoCreatorSeed, provider: string): CreatorProfile => {
  const now = timestamp();
  return {
    id: stableId('creator', `${seed.platform}_${seed.handle}`),
    platform: seed.platform,
    external_creator_id: stableId(seed.platform, seed.handle),
    handle: seed.handle,
    display_name: seed.displayName,
    avatar_url: seed.avatarUrl,
    channel_url: seed.channelUrl,
    bio: 'Auto-populated GGBOX MVP creator profile.',
    rights_status: seed.platform === 'local_demo' ? 'demo' : 'public_metadata_only',
    source_metadata_json: {
      provider,
      auto_populate_mvp: true,
      official_api_architecture: seed.platform !== 'local_demo',
    },
    created_at: now,
    updated_at: now,
  };
};

const toSourceAsset = (creator: CreatorProfile, clip: DemoClipSeed, provider: string): SourceAsset => {
  const now = timestamp();
  const contentOrigin: ContentOrigin =
    clip.contentOrigin ?? (provider === 'demo_fallback' ? 'demo' : creator.platform === 'youtube' ? 'real_youtube' : 'real_twitch');
  const externalId = clip.externalVideoId ?? clip.externalClipId ?? stableId(creator.platform === 'youtube' ? 'ytvideo' : 'twclip', clip.id);
  const sourceType = creator.platform === 'youtube' ? 'youtube_existing_video_embed' : 'twitch_existing_clips';
  const asset: SourceAsset = {
    id: stableId('asset', clip.id),
    creator_profile_id: creator.id,
    source_type: sourceType,
    platform: creator.platform,
    source_url:
      clip.sourceUrl ??
      (contentOrigin === 'demo'
        ? '#moments'
        : creator.platform === 'youtube'
          ? `https://www.youtube.com/watch?v=${externalId}`
          : `https://clips.twitch.tv/${externalId}`),
    external_video_id: creator.platform === 'youtube' ? externalId : undefined,
    external_clip_id: creator.platform === 'twitch' ? externalId : undefined,
    title: clip.title,
    description: 'Auto-populated from official-api-shaped metadata. No video download, scrape, or rehost is performed.',
    duration_seconds: clip.duration,
    thumbnail_url: clip.thumbnailUrl,
    embed_url: clip.embedUrl ?? getEmbedUrl(creator.platform, externalId, contentOrigin),
    storage_path: undefined,
    rights_status: getRightsStatus(creator.platform),
    source_credit: `${creator.display_name} on ${creator.platform === 'youtube' ? 'YouTube' : 'Twitch'}`,
    content_origin: contentOrigin,
    view_count: clip.viewCount,
    created_at: now,
    updated_at: now,
  };

  // Twitch and YouTube auto-populate is embed-only. Local mp4 generation is intentionally absent here.
  Guardrails.assertNoExternalDownload(asset);
  return asset;
};

const toMomentCandidate = (creator: CreatorProfile, asset: SourceAsset, clip: DemoClipSeed, autoPublish: boolean): MomentCandidate => {
  const now = timestamp();
  const scoring = MomentScoringService.score({
    view_count: clip.viewCount,
    duration_seconds: clip.duration,
    created_at: new Date(Date.now() - clip.daysOld * DAY_MS).toISOString(),
    title: clip.title,
    manual_admin_priority: 42,
  });

  return {
    id: stableId('candidate', clip.id),
    source_asset_id: asset.id,
    creator_profile_id: creator.id,
    platform: creator.platform,
    duration_seconds: clip.duration,
    title: clip.title,
    description: 'Official embed/source metadata prepared for the GGBOX public product feed.',
    tags_json: [creator.platform, asset.source_type, scoring.suggested_rarity.toLowerCase(), 'auto_populate_mvp'],
    score: scoring.score,
    score_breakdown_json: scoring.score_breakdown_json,
    suggested_rarity: scoring.suggested_rarity,
    thumbnail_url: clip.thumbnailUrl,
    preview_storage_path: undefined,
    embed_url: asset.embed_url,
    source_url: asset.source_url,
    view_count: clip.viewCount,
    source_credit: asset.source_credit,
    content_origin: asset.content_origin,
    rights_status: asset.rights_status,
    status: autoPublish ? 'approved' : 'draft',
    created_at: now,
    updated_at: now,
  };
};

const normalizeSettings = (settings: AutoPopulateSettings): AutoPopulateSettings => ({
  source: settings.source,
  numberOfCreators: Math.max(1, Math.min(12, Math.round(settings.numberOfCreators))),
  momentsPerCreator: Math.max(1, Math.min(6, Math.round(settings.momentsPerCreator))),
  minimumScore: Math.max(0, Math.min(100, Math.round(settings.minimumScore))),
  autoPublish: settings.autoPublish,
});

const getProviderName = (source: AutoPopulateSource) => {
  if (source === 'twitch_popular_clips' && hasTwitchApiArchitectureConfigured()) return 'official_twitch_api_architecture';
  if (source === 'youtube_safe_videos' && hasYouTubeApiArchitectureConfigured()) return 'official_youtube_api_architecture';
  if (source === 'mixed_safe' && (hasTwitchApiArchitectureConfigured() || hasYouTubeApiArchitectureConfigured())) return 'mixed_official_api_architecture';
  return 'demo_fallback';
};

const getProviderMode = (provider: string): AutoPopulateDebugInfo['providerMode'] => {
  if (provider === 'official_twitch_api_architecture') return 'real_twitch';
  if (provider === 'official_youtube_api_architecture') return 'real_youtube';
  if (provider === 'mixed_official_api_architecture') return 'mixed_real';
  if (provider === 'demo_fallback') return 'demo';
  return 'fallback';
};

const selectSeeds = (settings: AutoPopulateSettings) => {
  const filtered = DEMO_CREATORS.filter((seed, index) => {
    const platform = platformForSource(settings.source, index);
    return platform ? seed.platform === platform : true;
  });

  return filtered.slice(0, settings.numberOfCreators);
};

type TwitchHelixUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  description?: string;
};

type TwitchHelixClip = {
  id: string;
  url: string;
  embed_url?: string;
  broadcaster_id: string;
  broadcaster_name: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
};

type YouTubeSearchItem = {
  id: { videoId?: string };
  snippet: {
    channelId: string;
    channelTitle: string;
    title: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
};

type YouTubeVideoItem = {
  id: string;
  snippet: YouTubeSearchItem['snippet'];
  statistics?: { viewCount?: string };
  contentDetails?: { duration?: string };
};

const parseYouTubeDuration = (duration?: string) => {
  const match = duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 30;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
};

const normalizeTwitchThumbnail = (url: string) => url.replace(/%{width}/g, '640').replace(/%{height}/g, '360');

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

const fetchRealTwitchSeeds = async (settings: AutoPopulateSettings): Promise<DemoCreatorSeed[]> => {
  const env = getEnv();
  const handles = DEMO_CREATORS.filter((seed) => seed.platform === 'twitch')
    .slice(0, settings.numberOfCreators)
    .map((seed) => seed.handle);

  if (env.VITE_TWITCH_PROVIDER_URL) {
    return fetchJson<DemoCreatorSeed[]>(
      `${env.VITE_TWITCH_PROVIDER_URL}?handles=${encodeURIComponent(handles.join(','))}&momentsPerCreator=${settings.momentsPerCreator}`,
    );
  }

  if (!env.VITE_TWITCH_CLIENT_ID || !env.VITE_TWITCH_ACCESS_TOKEN) {
    return [];
  }

  const headers = {
    'Client-ID': env.VITE_TWITCH_CLIENT_ID,
    Authorization: `Bearer ${env.VITE_TWITCH_ACCESS_TOKEN}`,
  };
  const usersUrl = `https://api.twitch.tv/helix/users?${handles.map((handle) => `login=${encodeURIComponent(handle)}`).join('&')}`;
  const users = await fetchJson<{ data: TwitchHelixUser[] }>(usersUrl, { headers });
  const startedAt = new Date(Date.now() - DAY_MS * 30).toISOString();

  return Promise.all(
    users.data.slice(0, settings.numberOfCreators).map(async (user) => {
      const clipsUrl = new URL('https://api.twitch.tv/helix/clips');
      clipsUrl.searchParams.set('broadcaster_id', user.id);
      clipsUrl.searchParams.set('first', String(settings.momentsPerCreator));
      clipsUrl.searchParams.set('started_at', startedAt);
      const clips = await fetchJson<{ data: TwitchHelixClip[] }>(clipsUrl.toString(), { headers });

      return {
        platform: 'twitch',
        handle: user.login,
        displayName: user.display_name,
        avatarUrl: user.profile_image_url,
        channelUrl: `https://www.twitch.tv/${user.login}`,
        sourceCredit: `${user.display_name} on Twitch`,
        clips: clips.data.map((clip) => ({
          id: clip.id,
          title: clip.title,
          thumbnailUrl: normalizeTwitchThumbnail(clip.thumbnail_url),
          duration: clip.duration,
          viewCount: clip.view_count,
          daysOld: Math.max(0, Math.round((Date.now() - new Date(clip.created_at).getTime()) / DAY_MS)),
          sourceUrl: clip.url,
          embedUrl: getEmbedUrl('twitch', clip.id, 'real_twitch'),
          externalClipId: clip.id,
          contentOrigin: 'real_twitch',
        })),
      };
    }),
  );
};

export const testTwitchProvider = async (handle: string, limit = 5): Promise<TwitchProviderTestResult> => {
  const env = getEnv();
  const cleanHandle = handle.replace(/^@/, '').trim() || 'kirovfps';

  if (!hasTwitchApiArchitectureConfigured()) {
    return {
      ok: false,
      credentialsDetected: false,
      providerMode: 'fallback',
      status: 'missing credentials',
      fallbackReason: 'Set VITE_TWITCH_PROVIDER_URL, or VITE_TWITCH_CLIENT_ID + VITE_TWITCH_ACCESS_TOKEN for local-only direct Helix testing.',
      clips: [],
    };
  }

  try {
    if (env.VITE_TWITCH_PROVIDER_URL) {
      const url = new URL(env.VITE_TWITCH_PROVIDER_URL, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
      url.searchParams.set('test', '1');
      url.searchParams.set('handle', cleanHandle);
      url.searchParams.set('limit', String(limit));
      return await fetchJson<TwitchProviderTestResult>(url.toString());
    }

    const headers = {
      'Client-ID': env.VITE_TWITCH_CLIENT_ID ?? '',
      Authorization: `Bearer ${env.VITE_TWITCH_ACCESS_TOKEN ?? ''}`,
    };
    const usersUrl = `https://api.twitch.tv/helix/users?login=${encodeURIComponent(cleanHandle)}`;
    const users = await fetchJson<{ data: TwitchHelixUser[] }>(usersUrl, { headers });
    const user = users.data[0];
    if (!user) {
      return {
        ok: false,
        credentialsDetected: true,
        providerMode: 'real_twitch',
        status: `No Twitch user found for ${cleanHandle}.`,
        clips: [],
      };
    }

    const clipsUrl = new URL('https://api.twitch.tv/helix/clips');
    clipsUrl.searchParams.set('broadcaster_id', user.id);
    clipsUrl.searchParams.set('first', String(limit));
    clipsUrl.searchParams.set('started_at', new Date(Date.now() - DAY_MS * 30).toISOString());
    const clips = await fetchJson<{ data: TwitchHelixClip[] }>(clipsUrl.toString(), { headers });

    return {
      ok: true,
      credentialsDetected: true,
      providerMode: 'real_twitch',
      status: `Fetched ${clips.data.length} Twitch clips.`,
      creator: user,
      clips: clips.data.map((clip) => ({
        id: clip.id,
        title: clip.title,
        url: clip.url,
        embed_url: getEmbedUrl('twitch', clip.id, 'real_twitch') ?? clip.url,
        thumbnail_url: normalizeTwitchThumbnail(clip.thumbnail_url),
        view_count: clip.view_count,
        duration: clip.duration,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      credentialsDetected: true,
      providerMode: 'fallback',
      status: 'error',
      fallbackReason: error instanceof Error ? error.message : 'Twitch provider test failed.',
      clips: [],
    };
  }
};

const fetchRealYouTubeSeeds = async (settings: AutoPopulateSettings): Promise<DemoCreatorSeed[]> => {
  const env = getEnv();
  if (env.VITE_YOUTUBE_PROVIDER_URL) {
    return fetchJson<DemoCreatorSeed[]>(
      `${env.VITE_YOUTUBE_PROVIDER_URL}?maxCreators=${settings.numberOfCreators}&momentsPerCreator=${settings.momentsPerCreator}`,
    );
  }

  if (!env.VITE_YOUTUBE_API_KEY) {
    return [];
  }

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('safeSearch', 'strict');
  searchUrl.searchParams.set('maxResults', String(settings.numberOfCreators * settings.momentsPerCreator));
  searchUrl.searchParams.set('q', 'gaming creator highlight moments');
  searchUrl.searchParams.set('key', env.VITE_YOUTUBE_API_KEY);
  const search = await fetchJson<{ items: YouTubeSearchItem[] }>(searchUrl.toString());
  const ids = search.items.map((item) => item.id.videoId).filter(Boolean) as string[];
  if (ids.length === 0) return [];

  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
  videosUrl.searchParams.set('id', ids.join(','));
  videosUrl.searchParams.set('key', env.VITE_YOUTUBE_API_KEY);
  const videos = await fetchJson<{ items: YouTubeVideoItem[] }>(videosUrl.toString());
  const grouped = new Map<string, YouTubeVideoItem[]>();
  for (const video of videos.items) {
    const existing = grouped.get(video.snippet.channelId) ?? [];
    if (existing.length < settings.momentsPerCreator) {
      grouped.set(video.snippet.channelId, [...existing, video]);
    }
  }

  return Array.from(grouped.entries())
    .slice(0, settings.numberOfCreators)
    .map(([channelId, videosForChannel]) => {
      const first = videosForChannel[0];
      return {
        platform: 'youtube',
        handle: channelId,
        displayName: first.snippet.channelTitle,
        avatarUrl: './assets/characters/cozy-green.png',
        channelUrl: `https://www.youtube.com/channel/${channelId}`,
        sourceCredit: `${first.snippet.channelTitle} on YouTube`,
        clips: videosForChannel.map((video) => ({
          id: video.id,
          title: video.snippet.title,
          thumbnailUrl: video.snippet.thumbnails?.high?.url ?? video.snippet.thumbnails?.medium?.url ?? video.snippet.thumbnails?.default?.url ?? './assets/drop-pack-minecraft.png',
          duration: parseYouTubeDuration(video.contentDetails?.duration),
          viewCount: Number(video.statistics?.viewCount ?? 0),
          daysOld: 7,
          sourceUrl: `https://www.youtube.com/watch?v=${video.id}`,
          embedUrl: getEmbedUrl('youtube', video.id, 'real_youtube'),
          externalVideoId: video.id,
          contentOrigin: 'real_youtube',
        })),
      };
    });
};

const mergeById = <T extends { id: string }>(incoming: T[], existing: T[]) => [
  ...incoming,
  ...existing.filter((item) => !incoming.some((next) => next.id === item.id)),
];

export const getDefaultAutoPopulateSettings = (): AutoPopulateSettings => ({
  source: 'mixed_safe',
  numberOfCreators: 4,
  momentsPerCreator: 2,
  minimumScore: 55,
  autoPublish: true,
});

export const autoPopulateCreatorMoments = async (
  inputSettings: AutoPopulateSettings,
  currentState = loadCreatorImporterState(),
): Promise<AutoPopulateResult> => {
  Guardrails.assertFeatureEnabled();
  const settings = normalizeSettings(inputSettings);
  let provider = getProviderName(settings.source);
  let providerStatuses = getAutoPopulateProviderStatuses();
  let seeds: DemoCreatorSeed[] = [];
  let providerError = '';
  let lastApiRequestStatus = provider === 'demo_fallback' ? 'not attempted' : 'pending';

  try {
    if (settings.source === 'twitch_popular_clips' && hasTwitchApiArchitectureConfigured()) {
      seeds = await fetchRealTwitchSeeds(settings);
    } else if (settings.source === 'youtube_safe_videos' && hasYouTubeApiArchitectureConfigured()) {
      seeds = await fetchRealYouTubeSeeds(settings);
    } else if (settings.source === 'mixed_safe') {
      const [twitchSeeds, youtubeSeeds] = await Promise.all([
        hasTwitchApiArchitectureConfigured() ? fetchRealTwitchSeeds(settings) : Promise.resolve([]),
        hasYouTubeApiArchitectureConfigured() ? fetchRealYouTubeSeeds(settings) : Promise.resolve([]),
      ]);
      seeds = [...twitchSeeds, ...youtubeSeeds].slice(0, settings.numberOfCreators);
    }
    if (provider !== 'demo_fallback') {
      lastApiRequestStatus = `ok: ${seeds.length} creator groups`;
    }
  } catch (error) {
    providerError = error instanceof Error ? error.message : 'Provider request failed.';
    lastApiRequestStatus = `error: ${providerError}`;
    providerStatuses = providerStatuses.map((status) =>
      provider.includes('twitch') && status.name === 'TwitchProvider'
        ? { ...status, status: 'error', detail: providerError }
        : provider.includes('youtube') && status.name === 'YouTubeProvider'
          ? { ...status, status: 'error', detail: providerError }
          : status,
    );
  }

  if (seeds.length === 0) {
    provider = 'demo_fallback';
    if (!providerError) {
      lastApiRequestStatus = 'fallback: no configured provider data';
    }
    seeds = selectSeeds(settings);
  }

  const creators: CreatorProfile[] = [];
  const assets: SourceAsset[] = [];
  const candidates: MomentCandidate[] = [];
  const cards: MomentCard[] = [];

  // Real Twitch/YouTube providers use official API metadata only. DemoProvider uses local safe thumbnails.
  // No provider downloads videos, scrapes pages, or creates mp4 files from Twitch/YouTube content.
  for (const seed of seeds) {
    const creator = toCreatorProfile(seed, provider);
    const creatorAssets: SourceAsset[] = [];
    const creatorCandidates: MomentCandidate[] = [];

    for (const clip of seed.clips.slice(0, settings.momentsPerCreator)) {
      const asset = toSourceAsset(creator, clip, provider);
      const candidate = toMomentCandidate(creator, asset, clip, settings.autoPublish);
      if (candidate.score < settings.minimumScore) continue;
      creatorAssets.push(asset);
      creatorCandidates.push(candidate);
    }

    if (creatorCandidates.length === 0) continue;
    creators.push(creator);
    assets.push(...creatorAssets);
    candidates.push(...creatorCandidates);
    if (settings.autoPublish) {
      cards.push(...creatorCandidates.map((candidate) => createMomentCard(candidate, creator)));
    }
  }

  const state: CreatorImporterState = {
    creators: mergeById(creators, currentState.creators),
    assets: mergeById(assets, currentState.assets),
    candidates: mergeById(candidates, currentState.candidates),
    cards: mergeById(cards, currentState.cards),
  };

  saveCreatorImporterState(state);

  return {
    provider,
    usedFallback: provider === 'demo_fallback',
    message:
      providerError
        ? `${providerError}. DemoProvider fallback populated safe cards.`
        : provider === 'demo_fallback'
        ? 'Real API keys were not available in the browser MVP, so DemoProvider populated safe embed-only cards.'
        : 'Official API architecture selected. Browser MVP still stores embed metadata only.',
    providerStatuses,
    debug: {
      credentialsDetected:
        settings.source === 'twitch_popular_clips'
          ? hasTwitchApiArchitectureConfigured()
          : settings.source === 'youtube_safe_videos'
            ? hasYouTubeApiArchitectureConfigured()
            : hasTwitchApiArchitectureConfigured() || hasYouTubeApiArchitectureConfigured(),
      providerMode: provider === 'demo_fallback' && providerError ? 'fallback' : getProviderMode(provider),
      lastApiRequestStatus,
      fetchedCreatorsCount: creators.length,
      fetchedClipsCount: assets.length,
      fallbackReason:
        provider === 'demo_fallback'
          ? providerError || 'Missing real provider credentials/API keys or no real clips returned.'
          : undefined,
    },
    creators,
    assets,
    candidates,
    cards,
    state,
  };
};

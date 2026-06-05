import {
  type CreatorImporterState,
  type CreatorProfile,
  type MomentCard,
  type MomentCandidate,
  type MomentRarity,
  type SourceAsset,
  createMomentCard,
  loadCreatorImporterState,
  saveCreatorImporterState,
  setCreatorImporterEnabled,
} from './creatorMomentImporter';

export type ReadyClip = {
  index: number;
  id: string;
  title: string;
  rarity: MomentRarity;
  score: number;
  creatorName: string;
  creatorHandle: string;
  creatorUrl: string;
  creatorAvatarUrl: string;
  creatorBio: string;
  sourceCredit: string;
  category: string;
  video_url: string;
  public_file_path: string;
  source_file_path: string;
};

export type ReadyClipConfig = {
  twitchUrl?: string;
  title?: string;
  category?: string;
  rarity?: MomentRarity;
  score?: number;
  avatarUrl?: string;
  creatorName?: string;
};
export type ReadyClipConfigs = Record<number, ReadyClipConfig>;
export type ReadyClipTwitchUrls = Record<number, string>;

export type ReadyClipLoadResult = {
  creator: CreatorProfile;
  creators: CreatorProfile[];
  assets: SourceAsset[];
  candidates: MomentCandidate[];
  cards: MomentCard[];
  state: CreatorImporterState;
};

export const READY_CLIP_TWITCH_URLS_KEY = 'ggbox.readyClipTwitchUrls.v1';
export const READY_CLIP_CONFIGS_KEY = 'ggbox.readyClipConfigs.v1';
export const READY_CLIP_INDEXES = [1, 2, 3, 4, 5, 6] as const;
export const READY_CLIP_SCORE_TOTAL = 50;
const LEGACY_SCORE_TO_READY_SCORE: Record<number, number> = {
  86: 44,
  88: 44,
  90: 45,
  91: 46,
  92: 46,
  94: 47,
};

const KNOWN_TWITCH_AVATARS: Record<string, string> = {
  faith: '/streamer-avatars/faith.png',
  berticuss: '/streamer-avatars/berticuss.png',
  boggles: '/streamer-avatars/boggles.png',
  gunnar: '/streamer-avatars/gunnar.png',
  xrohat: '/streamer-avatars/xrohat.png',
  skywhywalker: '/streamer-avatars/skywhywalker.png',
};

const READY_CLIP_PRESETS: Record<
  number,
  Pick<
    ReadyClip,
    | 'title'
    | 'rarity'
    | 'score'
    | 'creatorName'
    | 'creatorHandle'
    | 'creatorUrl'
    | 'creatorAvatarUrl'
    | 'creatorBio'
    | 'sourceCredit'
    | 'category'
  >
> = {
  1: {
    title: 'Faith stream highlight #1',
    rarity: 'Epic',
    score: 44,
    creatorName: 'Faith',
    creatorHandle: '@faith',
    creatorUrl: 'https://www.twitch.tv/faith',
    creatorAvatarUrl: KNOWN_TWITCH_AVATARS.faith,
    creatorBio: 'Faith on Twitch. Authorized local ready clip prepared for the GGBOX investor demo.',
    sourceCredit: 'Faith on Twitch · Investor demo asset',
    category: 'Just Chatting',
  },
  2: {
    title: 'Berticuss stream highlight #1',
    rarity: 'Legendary',
    score: 46,
    creatorName: 'Berticuss',
    creatorHandle: '@berticuss',
    creatorUrl: 'https://www.twitch.tv/berticuss',
    creatorAvatarUrl: KNOWN_TWITCH_AVATARS.berticuss,
    creatorBio: 'Berticuss on Twitch. Authorized local ready clip prepared for the GGBOX investor demo.',
    sourceCredit: 'Berticuss on Twitch · Investor demo asset',
    category: 'Just Chatting',
  },
  3: {
    title: 'Boggles stream highlight #1',
    rarity: 'Legendary',
    score: 45,
    creatorName: 'Boggles',
    creatorHandle: '@boggles',
    creatorUrl: 'https://www.twitch.tv/boggles',
    creatorAvatarUrl: KNOWN_TWITCH_AVATARS.boggles,
    creatorBio: 'Boggles on Twitch. Ready local clip prepared for GGBOX.',
    sourceCredit: 'Boggles on Twitch',
    category: 'Minecraft',
  },
  4: {
    title: 'Gunnar stream highlight #1',
    rarity: 'Common',
    score: 44,
    creatorName: 'Gunnar',
    creatorHandle: '@gunnar',
    creatorUrl: 'https://www.twitch.tv/gunnar',
    creatorAvatarUrl: KNOWN_TWITCH_AVATARS.gunnar,
    creatorBio: 'Gunnar on Twitch. Ready local clip prepared for GGBOX.',
    sourceCredit: 'Gunnar on Twitch',
    category: 'Dota 2',
  },
  5: {
    title: 'xRohat stream highlight #1',
    rarity: 'Legendary',
    score: 46,
    creatorName: 'xRohat',
    creatorHandle: '@xrohat',
    creatorUrl: 'https://www.twitch.tv/xrohat',
    creatorAvatarUrl: KNOWN_TWITCH_AVATARS.xrohat,
    creatorBio: 'xRohat on Twitch. Ready local clip prepared for GGBOX.',
    sourceCredit: 'xRohat on Twitch',
    category: 'GTA V',
  },
  6: {
    title: 'Skywhywalker stream highlight #1',
    rarity: 'Legendary',
    score: 47,
    creatorName: 'Skywhywalker',
    creatorHandle: '@skywhywalker',
    creatorUrl: 'https://www.twitch.tv/skywhywalker',
    creatorAvatarUrl: KNOWN_TWITCH_AVATARS.skywhywalker,
    creatorBio: 'Skywhywalker on Twitch. Ready local clip prepared for GGBOX.',
    sourceCredit: 'Skywhywalker on Twitch',
    category: 'Counter-Strike',
  },
};

const CANDIDATE_PUBLIC_DIRS = ['/investor-source-clips', '/demo-vods'];

const nowIso = () => new Date().toISOString();

const mergeById = <T extends { id: string }>(incoming: T[], existing: T[]) => [
  ...incoming,
  ...existing.filter((item) => !incoming.some((next) => next.id === item.id)),
];

const isPublicVideo = async (url: string) =>
  fetch(url, { cache: 'no-store' })
    .then((response) => {
      const contentType = response.headers.get('content-type') ?? '';
      return response.ok && !contentType.includes('text/html');
    })
    .catch(() => false);

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const displayNameForHandle = (handle: string) => {
  if (handle === 'xrohat') return 'xRohat';
  return toTitleCase(handle);
};

const normalizeTwitchUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const handle = url.pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
    return handle ? `https://www.twitch.tv/${handle}` : '';
  } catch {
    return '';
  }
};

const avatarForHandle = (handle: string) => {
  return KNOWN_TWITCH_AVATARS[handle] ?? `https://unavatar.io/twitch/${encodeURIComponent(handle)}`;
};

const isLegacyCharacterAvatar = (avatarUrl?: string) =>
  Boolean(avatarUrl && /^\.?\/assets\/characters\//.test(avatarUrl));

export const getReadyClipAvatarUrlForTwitchUrl = (value: string) => {
  const normalizedUrl = normalizeTwitchUrl(value);
  if (!normalizedUrl) return '';
  const handle = new URL(normalizedUrl).pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
  return handle ? avatarForHandle(handle) : '';
};

const inferCategoryForHandle = (handle: string, fallback: string) => {
  if (handle === 'boggles') return 'Minecraft';
  if (handle === 'gunnar') return 'Dota 2';
  if (handle === 'xrohat') return 'GTA V';
  if (handle === 'skywhywalker') return 'Counter-Strike';
  return fallback;
};

const inferScoreForHandle = (handle: string, fallback: number) => {
  if (handle === 'boggles') return 45;
  if (handle === 'gunnar') return 44;
  if (handle === 'xrohat') return 46;
  if (handle === 'skywhywalker') return 47;
  return fallback;
};

export const normalizeReadyClipScore = (score: number) => {
  const normalized = score > READY_CLIP_SCORE_TOTAL ? LEGACY_SCORE_TO_READY_SCORE[Math.round(score)] ?? Math.round(score / 2) : score;
  return Math.max(0, Math.min(READY_CLIP_SCORE_TOTAL, Math.round(normalized)));
};

export const formatReadyClipScore = (score: number) => `${normalizeReadyClipScore(score)} / ${READY_CLIP_SCORE_TOTAL}`;

const inferRarityForHandle = (handle: string, fallback: MomentRarity): MomentRarity => {
  if (handle === 'boggles' || handle === 'xrohat' || handle === 'skywhywalker') return 'Legendary';
  if (handle === 'gunnar') return 'Common';
  return fallback;
};

const presetFromConfig = (index: number, fallback: (typeof READY_CLIP_PRESETS)[number], config: ReadyClipConfig = {}) => {
  const normalizedUrl = normalizeTwitchUrl(config.twitchUrl ?? fallback.creatorUrl);
  if (!normalizedUrl) {
    return {
      ...fallback,
      title: config.title || fallback.title,
      category: config.category || fallback.category,
      rarity: config.rarity || fallback.rarity,
      score: normalizeReadyClipScore(config.score ?? fallback.score),
      creatorAvatarUrl: config.avatarUrl && !isLegacyCharacterAvatar(config.avatarUrl) ? config.avatarUrl : fallback.creatorAvatarUrl,
      creatorName: config.creatorName || fallback.creatorName,
    };
  }

  const handle = new URL(normalizedUrl).pathname.split('/').filter(Boolean)[0] ?? fallback.creatorHandle.replace('@', '');
  const creatorName = config.creatorName || displayNameForHandle(handle);

  return {
    ...fallback,
    title: config.title || `${creatorName} stream highlight #1`,
    creatorName,
    creatorHandle: `@${handle}`,
    creatorUrl: normalizedUrl,
    creatorAvatarUrl: config.avatarUrl && !isLegacyCharacterAvatar(config.avatarUrl) ? config.avatarUrl : avatarForHandle(handle),
    creatorBio: `${creatorName} on Twitch. Ready local clip prepared for GGBOX.`,
    sourceCredit: `${creatorName} on Twitch`,
    category: config.category || inferCategoryForHandle(handle, fallback.category),
    score: normalizeReadyClipScore(config.score ?? inferScoreForHandle(handle, fallback.score)),
    rarity: config.rarity || inferRarityForHandle(handle, fallback.rarity),
  };
};

export const loadReadyClipTwitchUrls = (): ReadyClipTwitchUrls => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(READY_CLIP_TWITCH_URLS_KEY) ?? '{}') as ReadyClipTwitchUrls;
  } catch {
    return {};
  }
};

export const saveReadyClipTwitchUrls = (urls: ReadyClipTwitchUrls) => {
  window.localStorage.setItem(READY_CLIP_TWITCH_URLS_KEY, JSON.stringify(urls));
};

export const loadReadyClipConfigs = (): ReadyClipConfigs => {
  if (typeof window === 'undefined') return {};
  try {
    const savedConfigs = window.localStorage.getItem(READY_CLIP_CONFIGS_KEY);
    if (savedConfigs) return JSON.parse(savedConfigs) as ReadyClipConfigs;

    const legacyUrls = loadReadyClipTwitchUrls();
    return Object.fromEntries(Object.entries(legacyUrls).map(([index, twitchUrl]) => [index, { twitchUrl }]));
  } catch {
    return {};
  }
};

export const saveReadyClipConfigs = (configs: ReadyClipConfigs) => {
  window.localStorage.setItem(READY_CLIP_CONFIGS_KEY, JSON.stringify(configs));
};

export const findReadyInvestorClips = async (configs = loadReadyClipConfigs()): Promise<ReadyClip[]> => {
  const clips: ReadyClip[] = [];

  for (const index of READY_CLIP_INDEXES) {
    for (const publicDir of CANDIDATE_PUBLIC_DIRS) {
      const videoUrl = `${publicDir}/${index}.mp4`;
      if (!(await isPublicVideo(videoUrl))) continue;

      const preset = presetFromConfig(index, READY_CLIP_PRESETS[index], configs[index]);
      clips.push({
        index,
        id: `${preset.creatorHandle.replace('@', '')}_ready_clip_${index}`,
        title: preset.title,
        rarity: preset.rarity,
        score: preset.score,
        creatorName: preset.creatorName,
        creatorHandle: preset.creatorHandle,
        creatorUrl: preset.creatorUrl,
        creatorAvatarUrl: preset.creatorAvatarUrl,
        creatorBio: preset.creatorBio,
        sourceCredit: preset.sourceCredit,
        category: preset.category,
        video_url: videoUrl,
        public_file_path: videoUrl,
        source_file_path: `public${videoUrl}`,
      });
      break;
    }
  }

  return clips;
};

export const loadReadyClipsIntoState = (
  clips: ReadyClip[],
  currentState = loadCreatorImporterState(),
): ReadyClipLoadResult => {
  setCreatorImporterEnabled(true);

  const timestamp = nowIso();
  const creators: CreatorProfile[] = Array.from(new Map(clips.map((clip) => [clip.creatorHandle, clip])).values()).map(
    (clip) => ({
      id: `creator_investor_demo_${clip.creatorHandle.replace('@', '')}`,
      platform: 'twitch',
      external_creator_id: `twitch_${clip.creatorHandle.replace('@', '')}_investor_demo`,
      handle: clip.creatorHandle.replace('@', ''),
      display_name: clip.creatorName,
      avatar_url: clip.creatorAvatarUrl,
      channel_url: clip.creatorUrl,
      bio: clip.creatorBio,
      rights_status: 'demo_authorized',
      source_metadata_json: {
        mode: 'Investor Demo',
        source: 'ready_local_mp4',
        category: clip.category,
      },
      created_at: timestamp,
      updated_at: timestamp,
    }),
  );

  const creatorByHandle = new Map(creators.map((creator) => [`@${creator.handle}`, creator]));

  const assets: SourceAsset[] = clips.map((clip) => {
    const creator = creatorByHandle.get(clip.creatorHandle)!;
    return {
      id: `asset_${clip.id}`,
      creator_profile_id: creator.id,
      source_type: 'demo_sample',
      platform: 'twitch',
      source_url: creator.channel_url,
      external_video_id: clip.id,
      title: clip.title,
      description: 'Authorized ready mp4 used directly as an investor demo GGBOX moment.',
      duration_seconds: undefined,
      thumbnail_url: undefined,
      embed_url: undefined,
      storage_path: clip.video_url,
      rights_status: 'demo_authorized',
      source_credit: clip.sourceCredit,
      content_origin: 'investor_demo',
      view_count: 0,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });

  const candidates: MomentCandidate[] = clips.map((clip) => {
    const creator = creatorByHandle.get(clip.creatorHandle)!;
    return {
      id: `candidate_${clip.id}`,
      source_asset_id: `asset_${clip.id}`,
      creator_profile_id: creator.id,
      platform: 'twitch',
      start_time_seconds: 0,
      end_time_seconds: undefined,
      duration_seconds: 0,
      title: clip.title,
      description: 'Prepared authorized local mp4 published as a premium GGBOX investor demo card.',
      tags_json: ['twitch', clip.category.toLowerCase().replace(/\W+/g, '_'), 'investor_demo', 'authorized_sample'],
      score: clip.score,
      score_breakdown_json: {
        popularity: clip.score,
        recency: 100,
        duration_fit: 100,
        title_keywords: 88,
        manual_boost: 100,
      },
      suggested_rarity: clip.rarity,
      thumbnail_url: undefined,
      preview_storage_path: clip.video_url,
      embed_url: undefined,
      source_url: creator.channel_url,
      view_count: 0,
      source_credit: clip.sourceCredit,
      content_origin: 'investor_demo',
      rights_status: 'demo_authorized',
      status: 'approved',
      created_at: timestamp,
      updated_at: timestamp,
    };
  });

  const cards = candidates.map((candidate, index) => {
    const clip = clips[index];
    const creator = creatorByHandle.get(clip.creatorHandle)!;
    return {
      ...createMomentCard(candidate, creator, 'GGBOX Investor Demo Moments'),
      id: `card_${clip.id}`,
      platform: 'twitch' as const,
      category: clip.category,
      duration_label: 'Ready clip',
      source_url: creator.channel_url,
      creator_avatar_url: creator.avatar_url,
      creator_bio: creator.bio,
    };
  });
  const readyVideoUrls = new Set(clips.map((clip) => clip.video_url));
  const preservedState: CreatorImporterState = {
    creators: currentState.creators,
    assets: currentState.assets.filter((asset) => !asset.storage_path || !readyVideoUrls.has(asset.storage_path)),
    candidates: currentState.candidates.filter(
      (candidate) => !candidate.preview_storage_path || !readyVideoUrls.has(candidate.preview_storage_path),
    ),
    cards: currentState.cards.filter((card) => {
      const url = card.video_url ?? card.display_asset_url;
      return !url || !readyVideoUrls.has(url);
    }),
  };

  const state: CreatorImporterState = {
    creators: mergeById(creators, preservedState.creators),
    assets: mergeById(assets, preservedState.assets),
    candidates: mergeById(candidates, preservedState.candidates),
    cards: mergeById(cards, preservedState.cards),
  };

  saveCreatorImporterState(state);

  return { creator: creators[0], creators, assets, candidates, cards, state };
};

export const clearDemoCardsAndLoadReadyClips = (clips: ReadyClip[], currentState = loadCreatorImporterState()) => {
  const cleanedState: CreatorImporterState = {
    creators: currentState.creators.filter((creator) => creator.rights_status !== 'demo'),
    assets: currentState.assets.filter((asset) => asset.content_origin !== 'demo'),
    candidates: currentState.candidates.filter((candidate) => candidate.content_origin !== 'demo'),
    cards: currentState.cards.filter((card) => card.content_origin !== 'demo'),
  };

  return loadReadyClipsIntoState(clips, cleanedState);
};

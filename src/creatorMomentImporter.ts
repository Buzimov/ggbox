export const CREATOR_IMPORTER_STORAGE_KEY = 'ggbox.creatorMomentImporter.v1';
export const CREATOR_IMPORTER_FLAG_KEY = 'ggbox.flags.creatorMomentImporterMvp';

export const DEFAULT_ENABLE_CREATOR_MOMENT_IMPORTER_MVP = false;

export type CreatorPlatform = 'twitch' | 'youtube' | 'local_demo';
export type RightsStatus =
  | 'public_metadata_only'
  | 'oauth_authorized'
  | 'uploaded_by_owner'
  | 'demo'
  | 'demo_authorized'
  | 'twitch_embed_only'
  | 'youtube_embed_only';
export type SourceType =
  | 'twitch_existing_clips'
  | 'twitch_authorized_clip_creation'
  | 'youtube_existing_video_embed'
  | 'local_authorized_upload'
  | 'demo_sample';
export type MomentStatus = 'draft' | 'approved' | 'rejected';
export type MomentRarity = 'Legendary' | 'Epic' | 'Rare' | 'Common';
export type MomentDisplayType = 'embed' | 'local_video' | 'image_only';
export type ContentOrigin = 'demo' | 'investor_demo' | 'real_twitch' | 'real_youtube' | 'manual';

export type CreatorProfile = {
  id: string;
  platform: CreatorPlatform;
  external_creator_id: string;
  handle: string;
  display_name: string;
  avatar_url: string;
  channel_url: string;
  bio?: string;
  rights_status: RightsStatus;
  source_metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SourceAsset = {
  id: string;
  creator_profile_id: string;
  source_type: SourceType;
  platform: CreatorPlatform;
  source_url: string;
  external_video_id?: string;
  external_clip_id?: string;
  title: string;
  description?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  embed_url?: string;
  storage_path?: string;
  rights_status: RightsStatus;
  source_credit: string;
  content_origin: ContentOrigin;
  view_count?: number;
  created_at: string;
  updated_at: string;
};

export type ScoreBreakdown = {
  popularity: number;
  recency: number;
  duration_fit: number;
  title_keywords: number;
  manual_boost: number;
};

export type MomentCandidate = {
  id: string;
  source_asset_id: string;
  creator_profile_id: string;
  platform: CreatorPlatform;
  start_time_seconds?: number;
  end_time_seconds?: number;
  duration_seconds: number;
  title: string;
  description: string;
  tags_json: string[];
  score: number;
  score_breakdown_json: ScoreBreakdown;
  suggested_rarity: MomentRarity;
  thumbnail_url?: string;
  preview_storage_path?: string;
  embed_url?: string;
  source_url?: string;
  view_count?: number;
  source_credit: string;
  content_origin: ContentOrigin;
  rights_status: RightsStatus;
  status: MomentStatus;
  created_at: string;
  updated_at: string;
};

export type MomentCard = {
  id: string;
  moment_candidate_id: string;
  creator_profile_id: string;
  title: string;
  description: string;
  rarity: MomentRarity;
  collection_name: string;
  pack_id?: string;
  platform: CreatorPlatform;
  display_type: MomentDisplayType;
  display_asset_url?: string;
  video_url?: string;
  embed_url?: string;
  source_url?: string;
  thumbnail_url?: string;
  creator_avatar_url: string;
  creator_display_name: string;
  creator_handle?: string;
  creator_url?: string;
  creator_bio?: string;
  category?: string;
  duration_label?: string;
  score: number;
  view_count?: number;
  source_credit: string;
  content_origin: ContentOrigin;
  rights_status: RightsStatus;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatorImporterState = {
  creators: CreatorProfile[];
  assets: SourceAsset[];
  candidates: MomentCandidate[];
  cards: MomentCard[];
};

type ScoringInput = {
  view_count?: number;
  duration_seconds?: number;
  created_at?: string;
  title?: string;
  manual_admin_priority?: number;
};

const DEFAULT_STATE: CreatorImporterState = {
  creators: [],
  assets: [],
  candidates: [],
  cards: [],
};

const DEMO_AVATARS = [
  './assets/characters/tactical-orange.png',
  './assets/characters/mage-red.png',
  './assets/characters/creator-cream.png',
  './assets/characters/live-purple.png',
];

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const isCreatorImporterEnabled = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_ENABLE_CREATOR_MOMENT_IMPORTER_MVP;
  }

  return window.localStorage.getItem(CREATOR_IMPORTER_FLAG_KEY) === 'true';
};

export const setCreatorImporterEnabled = (enabled: boolean) => {
  window.localStorage.setItem(CREATOR_IMPORTER_FLAG_KEY, String(enabled));
};

export const loadCreatorImporterState = (): CreatorImporterState => {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const saved = window.localStorage.getItem(CREATOR_IMPORTER_STORAGE_KEY);
    return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
};

export const saveCreatorImporterState = (state: CreatorImporterState) => {
  window.localStorage.setItem(CREATOR_IMPORTER_STORAGE_KEY, JSON.stringify(state));
};

export const createEmptyCreatorForm = () => ({
  platform: 'twitch' as CreatorPlatform,
  creator_url: '',
  creator_handle: '',
  external_creator_id: '',
  rights_status: 'public_metadata_only' as RightsStatus,
  notes: '',
});

export const MomentScoringService = {
  score(input: ScoringInput) {
    const popularity = Math.min(100, Math.round(((input.view_count ?? 0) / 10000) * 100));
    const duration = input.duration_seconds ?? 0;
    const duration_fit = duration >= 5 && duration <= 30 ? 100 : duration > 30 && duration <= 60 ? 55 : 35;
    const createdAt = input.created_at ? new Date(input.created_at).getTime() : Date.now();
    const daysOld = Math.max(0, (Date.now() - createdAt) / 86400000);
    const recency = Math.max(20, Math.round(100 - daysOld * 1.8));
    const title = (input.title ?? '').toLowerCase();
    const title_keywords = ['clutch', 'escape', 'final', 'mega', 'rampage', 'perfect', 'live', 'insane'].some((keyword) =>
      title.includes(keyword),
    )
      ? 92
      : 58;
    const manual_boost = Math.max(0, Math.min(100, input.manual_admin_priority ?? 0));
    const score = Math.round(
      popularity * 0.4 + recency * 0.2 + duration_fit * 0.15 + title_keywords * 0.15 + manual_boost * 0.1,
    );

    return {
      score,
      suggested_rarity: suggestRarity(score),
      score_breakdown_json: { popularity, recency, duration_fit, title_keywords, manual_boost },
    };
  },
};

export const OfficialPlatformImportService = {
  async fetchTwitchProfileMetadata(handle: string) {
    // Production must call the official Twitch API with app credentials/OAuth.
    // Scraping twitch.tv pages is intentionally not implemented.
    return {
      platform: 'twitch' as CreatorPlatform,
      handle: handle.replace(/^@/, ''),
      source: 'official_twitch_api_placeholder',
    };
  },

  async fetchYouTubeChannelMetadata(handle: string) {
    // Production must call the official YouTube Data API and store public metadata/embeds.
    // Downloading or scraping YouTube videos is intentionally blocked by guardrails.
    return {
      platform: 'youtube' as CreatorPlatform,
      handle: handle.replace(/^@/, ''),
      source: 'official_youtube_api_placeholder',
    };
  },
};

export const AuthorizedLocalPreviewService = {
  createPreviewPath(source: SourceAsset) {
    // Production can run FFmpeg here only after assertCanCreateLocalPreview passes.
    // Embed-only Twitch/YouTube sources never enter this path.
    Guardrails.assertCanCreateLocalPreview(source);
    return source.storage_path ?? `/demo/previews/${source.id}.mp4`;
  },
};

export const suggestRarity = (score: number): MomentRarity => {
  if (score >= 90) return 'Legendary';
  if (score >= 75) return 'Epic';
  if (score >= 55) return 'Rare';
  return 'Common';
};

export const Guardrails = {
  assertFeatureEnabled() {
    if (!isCreatorImporterEnabled()) {
      throw new Error('Creator Moment Importer MVP is disabled by ENABLE_CREATOR_MOMENT_IMPORTER_MVP.');
    }
  },

  assertNoExternalDownload(source: Pick<SourceAsset, 'platform' | 'source_type' | 'rights_status'>) {
    // Rights-safe decision: Twitch and YouTube media remains on the original platform.
    // The MVP stores metadata/embed URLs only and never creates local mp4 copies from embed-only sources.
    if (
      (source.platform === 'twitch' || source.platform === 'youtube') &&
      (source.rights_status === 'twitch_embed_only' || source.rights_status === 'youtube_embed_only')
    ) {
      return;
    }

    if (
      (source.platform === 'twitch' || source.platform === 'youtube') &&
      source.source_type !== 'twitch_authorized_clip_creation'
    ) {
      throw new Error('External Twitch/YouTube downloads and scraping are blocked. Use official APIs/embeds only.');
    }
  },

  assertCanCreateLocalPreview(source: SourceAsset) {
    // FFmpeg is intentionally limited to local/demo files where the admin confirms ownership or edit permission.
    if (!['local_authorized_upload', 'demo_sample'].includes(source.source_type)) {
      throw new Error('Local previews can only be generated from authorized uploads or demo samples.');
    }
    if (!['uploaded_by_owner', 'demo', 'demo_authorized'].includes(source.rights_status)) {
      throw new Error('Local video processing requires uploaded_by_owner, demo, or demo_authorized rights_status.');
    }
  },

  assertPublishable(card: MomentCard) {
    // Every public card carries rights_status and source_credit so the MVP never hides provenance.
    if (!card.rights_status) {
      throw new Error('MomentCard cannot publish without rights_status.');
    }
    if (!card.source_credit) {
      throw new Error('MomentCard cannot publish without source_credit.');
    }
  },
};

export const createCreatorProfile = (form: ReturnType<typeof createEmptyCreatorForm>): CreatorProfile => {
  Guardrails.assertFeatureEnabled();

  const timestamp = nowIso();
  const handle = form.creator_handle.replace(/^@/, '') || 'creator';
  const platformName = form.platform === 'local_demo' ? 'Demo' : form.platform === 'youtube' ? 'YouTube' : 'Twitch';

  return {
    id: makeId('creator'),
    platform: form.platform,
    external_creator_id: form.external_creator_id || `${form.platform}_${handle}`,
    handle,
    display_name: handle
      .split(/[-_.\s]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' '),
    avatar_url: DEMO_AVATARS[Math.floor(Math.random() * DEMO_AVATARS.length)],
    channel_url: form.creator_url || `https://${platformName.toLowerCase()}.com/${handle}`,
    bio: form.notes || undefined,
    rights_status: form.rights_status,
    source_metadata_json: {
      mvp_source: 'manual_admin_entry',
      rights_note: 'Use official APIs/OAuth to enrich this record in production.',
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
};

export const createMockSourceAsset = (
  creator: CreatorProfile,
  sourceType: SourceType,
  title: string,
): SourceAsset => {
  Guardrails.assertFeatureEnabled();

  const timestamp = nowIso();
  const isTwitch = sourceType.startsWith('twitch');
  const isYoutube = sourceType.startsWith('youtube');
  const local = sourceType === 'local_authorized_upload' || sourceType === 'demo_sample';
  const platform: CreatorPlatform = local ? 'local_demo' : isTwitch ? 'twitch' : 'youtube';
  const externalId = makeId(isTwitch ? 'twclip' : isYoutube ? 'ytvideo' : 'local');

  const asset: SourceAsset = {
    id: makeId('asset'),
    creator_profile_id: creator.id,
    source_type: sourceType,
    platform,
    source_url: local ? `/authorized/${externalId}` : creator.channel_url,
    external_video_id: isYoutube ? externalId : undefined,
    external_clip_id: isTwitch ? externalId : undefined,
    title,
    description: 'Metadata imported for internal review. No third-party media is downloaded or rehosted.',
    duration_seconds: sourceType === 'youtube_existing_video_embed' ? 44 : 8 + Math.round(Math.random() * 18),
    thumbnail_url: creator.avatar_url,
    embed_url: local
      ? undefined
      : isTwitch
        ? `https://clips.twitch.tv/embed?clip=${externalId}&parent=localhost`
        : `https://www.youtube.com/embed/${externalId}`,
    storage_path: local ? `/demo/previews/${externalId}.mp4` : undefined,
    rights_status: local
      ? sourceType === 'demo_sample'
        ? 'demo'
        : 'uploaded_by_owner'
      : sourceType === 'twitch_authorized_clip_creation'
        ? 'oauth_authorized'
        : isTwitch
          ? 'twitch_embed_only'
          : 'youtube_embed_only',
    source_credit: `${creator.display_name} on ${platform}`,
    content_origin: 'demo',
    view_count: 1200 + Math.round(Math.random() * 22000),
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (local) {
    Guardrails.assertCanCreateLocalPreview(asset);
  } else {
    Guardrails.assertNoExternalDownload(asset);
  }

  return asset;
};

export const createMomentCandidate = (asset: SourceAsset, creator: CreatorProfile): MomentCandidate => {
  Guardrails.assertFeatureEnabled();
  const timestamp = nowIso();
  const scoring = MomentScoringService.score({
    view_count: asset.view_count,
    duration_seconds: asset.duration_seconds,
    created_at: asset.created_at,
    title: asset.title,
    manual_admin_priority: 30,
  });
  const duration = asset.duration_seconds ?? 8;
  const local = Boolean(asset.storage_path);
  const preview_storage_path = local ? AuthorizedLocalPreviewService.createPreviewPath(asset) : undefined;

  // Admin approval is required before publishing so imported clips never become public automatically.
  return {
    id: makeId('candidate'),
    source_asset_id: asset.id,
    creator_profile_id: creator.id,
    platform: asset.platform,
    start_time_seconds: local ? 0 : undefined,
    end_time_seconds: local ? Math.min(10, duration) : undefined,
    duration_seconds: local ? Math.min(10, Math.max(6, duration)) : duration,
    title: asset.title,
    description: local
      ? 'Authorized local preview generated for GGBOX review.'
      : 'Official embed/source preview. No local video copy is created.',
    tags_json: [creator.platform, asset.source_type, scoring.suggested_rarity.toLowerCase()],
    score: scoring.score,
    score_breakdown_json: scoring.score_breakdown_json,
    suggested_rarity: scoring.suggested_rarity,
    thumbnail_url: asset.thumbnail_url,
    preview_storage_path,
    embed_url: asset.embed_url,
    source_url: asset.source_url,
    view_count: asset.view_count,
    source_credit: asset.source_credit,
    content_origin: asset.content_origin,
    rights_status: asset.rights_status,
    status: 'draft',
    created_at: timestamp,
    updated_at: timestamp,
  };
};

export const createMomentCard = (
  candidate: MomentCandidate,
  creator: CreatorProfile,
  collectionName = 'GGBOX Creator Moments',
): MomentCard => {
  Guardrails.assertFeatureEnabled();

  if (candidate.status !== 'approved') {
    throw new Error('MomentCard cannot publish before admin approval.');
  }

  const timestamp = nowIso();
  const display_type: MomentDisplayType = candidate.preview_storage_path ? 'local_video' : candidate.embed_url ? 'embed' : 'image_only';
  const card: MomentCard = {
    id: makeId('card'),
    moment_candidate_id: candidate.id,
    creator_profile_id: creator.id,
    title: candidate.title,
    description: candidate.description,
    rarity: candidate.suggested_rarity,
    collection_name: collectionName,
    pack_id: 'creator-moments-mvp',
    platform: creator.platform,
    display_type,
    display_asset_url: candidate.preview_storage_path,
    video_url: candidate.preview_storage_path,
    embed_url: candidate.embed_url,
    source_url: candidate.source_url,
    thumbnail_url: candidate.thumbnail_url,
    creator_avatar_url: creator.avatar_url,
    creator_display_name: creator.display_name,
    creator_handle: creator.handle ? `@${creator.handle.replace(/^@/, '')}` : undefined,
    creator_url: creator.channel_url,
    creator_bio: creator.bio,
    score: candidate.score,
    view_count: candidate.view_count,
    source_credit: candidate.source_credit,
    content_origin: candidate.content_origin,
    rights_status: candidate.rights_status,
    published: true,
    created_at: timestamp,
    updated_at: timestamp,
  };

  Guardrails.assertPublishable(card);
  return card;
};

export const getPublishedMomentCards = (state = loadCreatorImporterState()) =>
  state.cards.filter((card) => card.published && card.rights_status && card.source_credit);

export const seedDemoImporterState = () => {
  const creator = createCreatorProfile({
    ...createEmptyCreatorForm(),
    platform: 'local_demo',
    creator_handle: 'ggbox-demo',
    creator_url: 'https://ggbox.demo/creator',
    external_creator_id: 'local_demo_ggbox',
    rights_status: 'demo',
    notes: 'Demo profile for internal MVP review.',
  });
  const asset = createMockSourceAsset(creator, 'demo_sample', 'Demo creator clutch synced with pack reveal');
  const candidate = createMomentCandidate(asset, creator);
  const approvedCandidate = { ...candidate, status: 'approved' as MomentStatus };
  const card = createMomentCard(approvedCandidate, creator);
  const state = { creators: [creator], assets: [asset], candidates: [approvedCandidate], cards: [card] };

  saveCreatorImporterState(state);
  return state;
};

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
} from './creatorMomentImporter';

export type InvestorDemoClipMetadata = {
  id: string;
  title: string;
  rarity: MomentRarity;
  score: number;
  start: string;
  duration: number;
  video_url: string;
  thumbnail_url: string;
  source_credit: string;
  rights_status: 'demo_authorized';
};

export type InvestorDemoMetadata = {
  mode: 'Investor Demo';
  rights: 'Authorized sample';
  source_vod: string;
  generated_at: string;
  creator: {
    name: string;
    handle: string;
    avatar_url: string;
  };
  clips: InvestorDemoClipMetadata[];
};

export type InvestorDemoLoadResult = {
  creator: CreatorProfile;
  assets: SourceAsset[];
  candidates: MomentCandidate[];
  cards: MomentCard[];
  state: CreatorImporterState;
};

const nowIso = () => new Date().toISOString();

const mergeById = <T extends { id: string }>(incoming: T[], existing: T[]) => [
  ...incoming,
  ...existing.filter((item) => !incoming.some((next) => next.id === item.id)),
];

export const getInvestorDemoMetadataUrl = () => '/generated-clips/investor-demo-moments.json';
export const getInvestorDemoVodUrl = () => '/demo-vods/index.mp4';

export const fetchInvestorDemoMetadata = async () => {
  const response = await fetch(getInvestorDemoMetadataUrl(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Run pnpm investor:demo to generate clips automatically.');
  }
  return response.json() as Promise<InvestorDemoMetadata>;
};

export const probeInvestorDemoFiles = async () => {
  const vod = await fetch(getInvestorDemoVodUrl(), { cache: 'no-store' })
    .then((response) => {
      const contentType = response.headers.get('content-type') ?? '';
      return response.ok && !contentType.includes('text/html');
    })
    .catch(() => false);
  const metadata = await fetch(getInvestorDemoMetadataUrl(), { cache: 'no-store' })
    .then(async (response) => {
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || contentType.includes('text/html')) return false;
      const body = (await response.json()) as Partial<InvestorDemoMetadata>;
      return Array.isArray(body.clips);
    })
    .catch(() => false);

  return { vodFound: vod, metadataFound: metadata };
};

export const loadInvestorDemoClipsIntoState = (
  metadata: InvestorDemoMetadata,
  currentState = loadCreatorImporterState(),
): InvestorDemoLoadResult => {
  const timestamp = nowIso();
  const creator: CreatorProfile = {
    id: 'creator_investor_demo_ggbox',
    platform: 'local_demo',
    external_creator_id: 'investor_demo_ggbox',
    handle: metadata.creator.handle,
    display_name: metadata.creator.name,
    avatar_url: metadata.creator.avatar_url,
    channel_url: '#moments',
    bio: 'Authorized local investor demo sample.',
    rights_status: 'demo_authorized',
    source_metadata_json: {
      mode: metadata.mode,
      rights: metadata.rights,
      source_vod: metadata.source_vod,
    },
    created_at: timestamp,
    updated_at: timestamp,
  };

  const assets: SourceAsset[] = metadata.clips.map((clip) => ({
    id: `asset_${clip.id}`,
    creator_profile_id: creator.id,
    source_type: 'demo_sample',
    platform: 'local_demo',
    source_url: clip.video_url,
    external_video_id: clip.id,
    title: clip.title,
    description: 'Authorized investor demo clip generated from local VOD.',
    duration_seconds: clip.duration,
    thumbnail_url: clip.thumbnail_url,
    embed_url: undefined,
    storage_path: clip.video_url,
    rights_status: 'demo_authorized',
    source_credit: clip.source_credit,
    content_origin: 'investor_demo',
    view_count: 0,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const candidates: MomentCandidate[] = metadata.clips.map((clip) => ({
    id: `candidate_${clip.id}`,
    source_asset_id: `asset_${clip.id}`,
    creator_profile_id: creator.id,
    platform: 'local_demo',
    start_time_seconds: 0,
    end_time_seconds: clip.duration,
    duration_seconds: clip.duration,
    title: clip.title,
    description: 'Playable 6-10 second authorized investor demo moment.',
    tags_json: ['investor_demo', 'authorized_sample', clip.rarity.toLowerCase()],
    score: clip.score,
    score_breakdown_json: {
      popularity: clip.score,
      recency: 100,
      duration_fit: 100,
      title_keywords: clip.rarity === 'Legendary' ? 96 : 84,
      manual_boost: 100,
    },
    suggested_rarity: clip.rarity,
    thumbnail_url: clip.thumbnail_url,
    preview_storage_path: clip.video_url,
    embed_url: undefined,
    source_url: clip.video_url,
    view_count: 0,
    source_credit: clip.source_credit,
    content_origin: 'investor_demo',
    rights_status: 'demo_authorized',
    status: 'approved',
    created_at: timestamp,
    updated_at: timestamp,
  }));

  const cards = candidates.map((candidate) => createMomentCard(candidate, creator, 'GGBOX Investor Demo Moments'));
  const state: CreatorImporterState = {
    creators: mergeById([creator], currentState.creators),
    assets: mergeById(assets, currentState.assets),
    candidates: mergeById(candidates, currentState.candidates),
    cards: mergeById(cards, currentState.cards),
  };

  saveCreatorImporterState(state);

  return { creator, assets, candidates, cards, state };
};

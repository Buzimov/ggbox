import {
  type CreatorProfile,
  type MomentCandidate,
  type ScoreBreakdown,
  type SourceAsset,
  MomentScoringService,
} from './creatorMomentImporter';

export type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  broadcaster_type?: string;
  description?: string;
};

export type TwitchClip = {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id?: string;
  game_id?: string;
  language?: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
};

export interface TwitchApiClient {
  getCreatorByHandle(handle: string): Promise<TwitchUser>;
  getCreatorClips(broadcasterId: string): Promise<TwitchClip[]>;
  mapTwitchUserToCreatorProfile(user: TwitchUser): CreatorProfile;
  mapTwitchClipToSourceAsset(clip: TwitchClip, creator: CreatorProfile): SourceAsset;
  mapTwitchClipToMomentCandidate(clip: TwitchClip, asset: SourceAsset, creator: CreatorProfile): MomentCandidate;
}

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string, stableId?: string) =>
  stableId ? `${prefix}_${stableId}` : `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const getTwitchEmbedUrl = (clipId: string) => {
  // TODO: In production, compute the correct Twitch embed parent from the deployed domain.
  // Official Twitch embeds require a parent domain; no video file is downloaded or rehosted.
  const parent = typeof window === 'undefined' ? 'localhost' : window.location?.hostname || 'localhost';
  return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parent}`;
};

export class MockTwitchApiClient implements TwitchApiClient {
  async getCreatorByHandle(handle: string): Promise<TwitchUser> {
    const login = handle.replace(/^@/, '').trim().toLowerCase() || 'ggboxcreator';

    return {
      id: `mock_broadcaster_${login}`,
      login,
      display_name: login
        .split(/[-_.\s]/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' '),
      profile_image_url: './assets/characters/tactical-orange.png',
      broadcaster_type: 'partner',
      description: 'Mock Twitch profile from official-api-shaped adapter.',
    };
  }

  async getCreatorClips(broadcasterId: string): Promise<TwitchClip[]> {
    const seedName = broadcasterId.replace('mock_broadcaster_', '') || 'creator';
    const baseDate = Date.now();

    return [
      {
        id: `mock_clip_${seedName}_clutch`,
        url: `https://clips.twitch.tv/mock_clip_${seedName}_clutch`,
        embed_url: getTwitchEmbedUrl(`mock_clip_${seedName}_clutch`),
        broadcaster_id: broadcasterId,
        broadcaster_name: seedName,
        creator_id: `mock_editor_${seedName}`,
        creator_name: seedName,
        title: 'Final clutch escape into a perfect GGBOX moment',
        view_count: 18420,
        created_at: new Date(baseDate - 86400000 * 2).toISOString(),
        thumbnail_url: './assets/characters/tactical-orange.png',
        duration: 9.2,
      },
      {
        id: `mock_clip_${seedName}_retake`,
        url: `https://clips.twitch.tv/mock_clip_${seedName}_retake`,
        embed_url: getTwitchEmbedUrl(`mock_clip_${seedName}_retake`),
        broadcaster_id: broadcasterId,
        broadcaster_name: seedName,
        creator_id: `mock_editor_${seedName}`,
        creator_name: seedName,
        title: 'One HP retake with chat going live',
        view_count: 12680,
        created_at: new Date(baseDate - 86400000 * 5).toISOString(),
        thumbnail_url: './assets/characters/mage-red.png',
        duration: 12.8,
      },
      {
        id: `mock_clip_${seedName}_mega`,
        url: `https://clips.twitch.tv/mock_clip_${seedName}_mega`,
        embed_url: getTwitchEmbedUrl(`mock_clip_${seedName}_mega`),
        broadcaster_id: broadcasterId,
        broadcaster_name: seedName,
        creator_id: `mock_editor_${seedName}`,
        creator_name: seedName,
        title: 'Mega reaction after the perfect timing',
        view_count: 9200,
        created_at: new Date(baseDate - 86400000 * 9).toISOString(),
        thumbnail_url: './assets/characters/live-purple.png',
        duration: 7.4,
      },
    ];
  }

  mapTwitchUserToCreatorProfile(user: TwitchUser): CreatorProfile {
    const timestamp = nowIso();

    return {
      id: makeId('creator', user.id),
      platform: 'twitch',
      external_creator_id: user.id,
      handle: user.login,
      display_name: user.display_name,
      avatar_url: user.profile_image_url,
      channel_url: `https://www.twitch.tv/${user.login}`,
      bio: user.description,
      rights_status: 'public_metadata_only',
      source_metadata_json: {
        source: 'mock_twitch_api_client',
        production_note: 'Replace MockTwitchApiClient with a real official Twitch API implementation.',
      },
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  mapTwitchClipToSourceAsset(clip: TwitchClip, creator: CreatorProfile): SourceAsset {
    const timestamp = nowIso();

    return {
      id: makeId('asset', clip.id),
      creator_profile_id: creator.id,
      source_type: 'twitch_existing_clips',
      platform: 'twitch',
      source_url: clip.url,
      external_clip_id: clip.id,
      title: clip.title,
      description: 'Twitch clip metadata imported through an official-api-shaped adapter.',
      duration_seconds: clip.duration,
      thumbnail_url: clip.thumbnail_url,
      embed_url: clip.embed_url || getTwitchEmbedUrl(clip.id),
      // Rights-safe decision: Twitch clips are embed-only in this MVP. No local mp4 is created.
      storage_path: undefined,
      rights_status: 'twitch_embed_only',
      source_credit: `${clip.broadcaster_name || creator.display_name} on Twitch`,
      content_origin: 'demo',
      view_count: clip.view_count,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  mapTwitchClipToMomentCandidate(clip: TwitchClip, asset: SourceAsset, creator: CreatorProfile): MomentCandidate {
    const scoring = MomentScoringService.score({
      view_count: clip.view_count,
      duration_seconds: clip.duration,
      created_at: clip.created_at,
      title: clip.title,
      manual_admin_priority: 30,
    });
    const timestamp = nowIso();

    return {
      id: makeId('candidate', clip.id),
      source_asset_id: asset.id,
      creator_profile_id: creator.id,
      platform: 'twitch',
      // For Twitch, timestamps are metadata only. We never cut/rehost Twitch media locally.
      start_time_seconds: clip.duration > 10 ? 0 : undefined,
      end_time_seconds: clip.duration > 10 ? 10 : undefined,
      duration_seconds: clip.duration,
      title: clip.title,
      description: clip.duration > 10 ? 'Official Twitch source clip. Suggested 0-10 second moment is metadata only.' : 'Official Twitch clip embed.',
      tags_json: ['twitch', 'official_embed', scoring.suggested_rarity.toLowerCase()],
      score: scoring.score,
      score_breakdown_json: scoring.score_breakdown_json as ScoreBreakdown,
      suggested_rarity: scoring.suggested_rarity,
      thumbnail_url: clip.thumbnail_url,
      preview_storage_path: undefined,
      embed_url: asset.embed_url,
      source_url: asset.source_url,
      view_count: clip.view_count,
      source_credit: asset.source_credit,
      content_origin: asset.content_origin,
      rights_status: asset.rights_status,
      status: 'draft',
      created_at: timestamp,
      updated_at: timestamp,
    };
  }
}

export const twitchApiClient: TwitchApiClient = new MockTwitchApiClient();

// TODO: Real Twitch OAuth token exchange must be implemented on backend/serverless function.
// Never expose TWITCH_CLIENT_SECRET in the frontend bundle. The browser should only receive
// short-lived access tokens or API responses returned by a trusted backend/serverless boundary.

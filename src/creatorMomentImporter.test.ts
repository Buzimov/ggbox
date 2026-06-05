import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CREATOR_IMPORTER_FLAG_KEY,
  createCreatorProfile,
  createEmptyCreatorForm,
  createMockSourceAsset,
  createMomentCandidate,
  createMomentCard,
  getPublishedMomentCards,
  loadCreatorImporterState,
  saveCreatorImporterState,
  setCreatorImporterEnabled,
} from './creatorMomentImporter';
import { MockTwitchApiClient } from './twitchApiClient';
import {
  autoPopulateCreatorMoments,
  getDefaultAutoPopulateSettings,
  setAutoPopulateRuntimeEnvForTests,
  testTwitchProvider,
} from './autoPopulateMvp';
import { loadInvestorDemoClipsIntoState, type InvestorDemoMetadata } from './investorDemo';
import {
  findReadyInvestorClips,
  formatReadyClipScore,
  getReadyClipAvatarUrlForTwitchUrl,
  normalizeReadyClipScore,
} from './readyClipImporter';

const makeCreator = () =>
  createCreatorProfile({
    ...createEmptyCreatorForm(),
    platform: 'twitch',
    creator_handle: 'safecreator',
    creator_url: 'https://twitch.tv/safecreator',
    external_creator_id: '123',
    rights_status: 'public_metadata_only',
  });

describe('Creator Moment Importer MVP guardrails', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    window.localStorage.setItem(CREATOR_IMPORTER_FLAG_KEY, 'true');
    setAutoPopulateRuntimeEnvForTests(null);
  });

  it('saves creator profile metadata with avatar and display name', () => {
    const creator = makeCreator();

    expect(creator.display_name).toBe('Safecreator');
    expect(creator.avatar_url).toContain('./assets/characters/');
  });

  it('turns Twitch clip metadata into a draft MomentCandidate', () => {
    const creator = makeCreator();
    const asset = createMockSourceAsset(creator, 'twitch_existing_clips', 'Final clutch escape');
    const candidate = createMomentCandidate(asset, creator);

    expect(asset.embed_url).toContain('clips.twitch.tv/embed');
    expect(candidate.status).toBe('draft');
    expect(candidate.rights_status).toBe('twitch_embed_only');
  });

  it('does not create local mp4 files from Twitch embed-only sources', () => {
    const creator = makeCreator();
    const asset = createMockSourceAsset(creator, 'twitch_existing_clips', 'Twitch source clip');
    const candidate = createMomentCandidate(asset, creator);

    expect(asset.storage_path).toBeUndefined();
    expect(candidate.preview_storage_path).toBeUndefined();
  });

  it('does not create local mp4 files from YouTube embed-only sources', () => {
    const creator = createCreatorProfile({
      ...createEmptyCreatorForm(),
      platform: 'youtube',
      creator_handle: 'safechannel',
      rights_status: 'public_metadata_only',
    });
    const asset = createMockSourceAsset(creator, 'youtube_existing_video_embed', 'YouTube embed review');
    const candidate = createMomentCandidate(asset, creator);

    expect(asset.embed_url).toContain('youtube.com/embed');
    expect(candidate.preview_storage_path).toBeUndefined();
  });

  it('allows local authorized upload to create an internal preview path', () => {
    const creator = createCreatorProfile({
      ...createEmptyCreatorForm(),
      platform: 'local_demo',
      creator_handle: 'owner-upload',
      rights_status: 'uploaded_by_owner',
    });
    const asset = createMockSourceAsset(creator, 'local_authorized_upload', 'Owned local highlight');
    const candidate = createMomentCandidate(asset, creator);

    expect(candidate.preview_storage_path).toContain('/demo/previews/');
  });

  it('requires rights_status on MomentCandidate', () => {
    const creator = makeCreator();
    const asset = createMockSourceAsset(creator, 'twitch_existing_clips', 'Safe source');
    const candidate = createMomentCandidate(asset, creator);

    expect(candidate.rights_status).toBeTruthy();
  });

  it('requires source_credit on MomentCard', () => {
    const creator = makeCreator();
    const asset = createMockSourceAsset(creator, 'twitch_existing_clips', 'Safe source');
    const candidate = { ...createMomentCandidate(asset, creator), status: 'approved' as const };
    const card = createMomentCard(candidate, creator);

    expect(card.source_credit).toContain(creator.display_name);
  });

  it('does not show draft moments publicly', () => {
    const creator = makeCreator();
    const asset = createMockSourceAsset(creator, 'twitch_existing_clips', 'Draft only');
    const candidate = createMomentCandidate(asset, creator);
    saveCreatorImporterState({ creators: [creator], assets: [asset], candidates: [candidate], cards: [] });

    expect(getPublishedMomentCards()).toHaveLength(0);
  });

  it('shows approved and published moments in the MVP', () => {
    const creator = makeCreator();
    const asset = createMockSourceAsset(creator, 'twitch_existing_clips', 'Published safe source');
    const candidate = { ...createMomentCandidate(asset, creator), status: 'approved' as const };
    const card = createMomentCard(candidate, creator);
    saveCreatorImporterState({ creators: [creator], assets: [asset], candidates: [candidate], cards: [card] });

    expect(getPublishedMomentCards()).toHaveLength(1);
  });

  it('maps mock Twitch API data into embed-only assets and candidates', async () => {
    const client = new MockTwitchApiClient();
    const user = await client.getCreatorByHandle('@rushlive');
    const creator = client.mapTwitchUserToCreatorProfile(user);
    const [clip] = await client.getCreatorClips(user.id);
    const asset = client.mapTwitchClipToSourceAsset(clip, creator);
    const candidate = client.mapTwitchClipToMomentCandidate(clip, asset, creator);

    expect(creator.platform).toBe('twitch');
    expect(asset.external_clip_id).toBe(clip.id);
    expect(asset.storage_path).toBeUndefined();
    expect(asset.embed_url).toContain('clips.twitch.tv/embed');
    expect(candidate.status).toBe('draft');
    expect(candidate.rights_status).toBe('twitch_embed_only');
  });

  it('feature flag disables the module when false', () => {
    setCreatorImporterEnabled(false);

    expect(() => makeCreator()).toThrow('disabled');
    expect(loadCreatorImporterState().cards).toEqual([]);
  });
});

describe('Auto Populate MVP flow', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      location: { hostname: 'localhost' },
      localStorage: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    window.localStorage.setItem(CREATOR_IMPORTER_FLAG_KEY, 'true');
    setAutoPopulateRuntimeEnvForTests(null);
  });

  it('fills the MVP with public creator moment cards through DemoProvider fallback', async () => {
    const result = await autoPopulateCreatorMoments(getDefaultAutoPopulateSettings());

    expect(result.usedFallback).toBe(true);
    expect(result.creators.length).toBeGreaterThan(0);
    expect(result.assets.length).toBeGreaterThan(0);
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.debug.credentialsDetected).toBe(false);
    expect(result.debug.providerMode).toBe('demo');
    expect(result.debug.fetchedClipsCount).toBe(result.assets.length);
    expect(getPublishedMomentCards(result.state)).toHaveLength(result.cards.length);
  });

  it('keeps demo auto-populated media thumbnail-only with no local mp4 files', async () => {
    const result = await autoPopulateCreatorMoments({
      source: 'mixed_safe',
      numberOfCreators: 4,
      momentsPerCreator: 2,
      minimumScore: 0,
      autoPublish: true,
    });

    expect(result.assets.every((asset) => asset.storage_path === undefined)).toBe(true);
    expect(result.candidates.every((candidate) => candidate.preview_storage_path === undefined)).toBe(true);
    expect(result.assets.every((asset) => asset.embed_url === undefined)).toBe(true);
    expect(result.cards.every((card) => card.content_origin === 'demo')).toBe(true);
    expect(result.cards.every((card) => card.display_type === 'image_only')).toBe(true);
  });

  it('respects minimum score and auto publish settings', async () => {
    const result = await autoPopulateCreatorMoments({
      source: 'demo_fallback',
      numberOfCreators: 6,
      momentsPerCreator: 3,
      minimumScore: 85,
      autoPublish: false,
    });

    expect(result.candidates.every((candidate) => candidate.score >= 85)).toBe(true);
    expect(result.candidates.every((candidate) => candidate.status === 'draft')).toBe(true);
    expect(result.cards).toHaveLength(0);
  });

  it('uses real Twitch Helix metadata when Twitch credentials are configured', async () => {
    setAutoPopulateRuntimeEnvForTests({
      VITE_TWITCH_CLIENT_ID: 'client_id',
      VITE_TWITCH_ACCESS_TOKEN: 'token',
    });
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/helix/users')) {
        return {
          ok: true,
          json: async () => ({
            data: [{ id: '123', login: 'kirovfps', display_name: 'Max Kirov', profile_image_url: './assets/characters/tactical-orange.png' }],
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'RealClipSlug',
              url: 'https://clips.twitch.tv/RealClipSlug',
              broadcaster_id: '123',
              broadcaster_name: 'Max Kirov',
              title: 'Real Twitch clutch moment',
              view_count: 44000,
              created_at: new Date().toISOString(),
              thumbnail_url: 'https://static-cdn.jtvnw.net/twitch-clips/%{width}x%{height}.jpg',
              duration: 12,
            },
          ],
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await autoPopulateCreatorMoments({
      source: 'twitch_popular_clips',
      numberOfCreators: 1,
      momentsPerCreator: 1,
      minimumScore: 0,
      autoPublish: true,
    });

    expect(result.usedFallback).toBe(false);
    expect(result.assets[0].content_origin).toBe('real_twitch');
    expect(result.assets[0].external_clip_id).toBe('RealClipSlug');
    expect(result.assets[0].thumbnail_url).toContain('640x360');
    expect(result.cards[0].embed_url).toContain('clips.twitch.tv/embed');
    expect(result.cards[0].display_type).toBe('embed');
    expect(result.debug.credentialsDetected).toBe(true);
    expect(result.debug.providerMode).toBe('real_twitch');
    expect(result.debug.lastApiRequestStatus).toContain('ok');

    setAutoPopulateRuntimeEnvForTests(null);
  });

  it('reports missing credentials for Twitch provider smoke test', async () => {
    const result = await testTwitchProvider('kirovfps');

    expect(result.ok).toBe(false);
    expect(result.credentialsDetected).toBe(false);
    expect(result.status).toBe('missing credentials');
  });

  it('tests Twitch provider and returns top clips when credentials are configured', async () => {
    setAutoPopulateRuntimeEnvForTests({
      VITE_TWITCH_CLIENT_ID: 'client_id',
      VITE_TWITCH_ACCESS_TOKEN: 'token',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/helix/users')) {
          return {
            ok: true,
            json: async () => ({
              data: [{ id: '123', login: 'kirovfps', display_name: 'Max Kirov', profile_image_url: './avatar.png' }],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 'RealClipSlug',
                url: 'https://clips.twitch.tv/RealClipSlug',
                title: 'Real Twitch clutch moment',
                view_count: 44000,
                created_at: new Date().toISOString(),
                thumbnail_url: 'https://static-cdn.jtvnw.net/twitch-clips/%{width}x%{height}.jpg',
                duration: 12,
              },
            ],
          }),
        };
      }),
    );

    const result = await testTwitchProvider('kirovfps');

    expect(result.ok).toBe(true);
    expect(result.credentialsDetected).toBe(true);
    expect(result.creator?.display_name).toBe('Max Kirov');
    expect(result.clips).toHaveLength(1);
    expect(result.clips[0].embed_url).toContain('parent=localhost');
  });
});

describe('Investor Demo Mode', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      location: { hostname: 'localhost' },
      localStorage: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    window.localStorage.setItem(CREATOR_IMPORTER_FLAG_KEY, 'true');
  });

  it('loads generated investor demo clips as playable local video cards', () => {
    const metadata: InvestorDemoMetadata = {
      mode: 'Investor Demo',
      rights: 'Authorized sample',
      source_vod: '/demo-vods/index.mp4',
      generated_at: new Date().toISOString(),
      creator: {
        name: 'GGBOX Demo Creator',
        handle: '@ggboxdemo',
        avatar_url: '/assets/characters/creator-cream.png',
      },
      clips: [
        {
          id: 'investor-demo-01',
          title: 'Chat reacts to cozy stream moment',
          rarity: 'Epic',
          score: 87,
          start: '00:03',
          duration: 8,
          video_url: '/generated-clips/investor-demo-01.mp4',
          thumbnail_url: '/generated-clips/investor-demo-01.jpg',
          source_credit: 'Authorized investor demo sample',
          rights_status: 'demo_authorized',
        },
      ],
    };

    const result = loadInvestorDemoClipsIntoState(metadata);

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].display_type).toBe('local_video');
    expect(result.cards[0].video_url).toBe('/generated-clips/investor-demo-01.mp4');
    expect(result.cards[0].content_origin).toBe('investor_demo');
    expect(result.cards[0].rights_status).toBe('demo_authorized');
    expect(getPublishedMomentCards(result.state)).toHaveLength(1);
  });
});

describe('Ready local clip Twitch avatars', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it('resolves known Twitch handles to local streamer avatar files', () => {
    expect(getReadyClipAvatarUrlForTwitchUrl('https://www.twitch.tv/faith')).toBe('/streamer-avatars/faith.png');
    expect(getReadyClipAvatarUrlForTwitchUrl('twitch.tv/berticuss')).toBe('/streamer-avatars/berticuss.png');
    expect(getReadyClipAvatarUrlForTwitchUrl('https://www.twitch.tv/boggles')).toBe('/streamer-avatars/boggles.png');
  });

  it('uses a public avatar fallback for new Twitch handles', () => {
    expect(getReadyClipAvatarUrlForTwitchUrl('https://www.twitch.tv/newcreator')).toBe('https://unavatar.io/twitch/newcreator');
  });

  it('formats ready clip scores as a 50 moment scale', () => {
    expect(formatReadyClipScore(44)).toBe('44 / 50');
    expect(formatReadyClipScore(2)).toBe('2 / 50');
  });

  it('normalizes legacy 100 point scores into the 50 moment scale', () => {
    expect(normalizeReadyClipScore(86)).toBe(44);
    expect(normalizeReadyClipScore(88)).toBe(44);
    expect(formatReadyClipScore(86)).toBe('44 / 50');
  });

  it('replaces old GGBOX character avatars for ready Twitch clips', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: url === '/investor-source-clips/1.mp4',
        headers: { get: () => 'video/mp4' },
      })),
    );

    const [clip] = await findReadyInvestorClips({
      1: {
        twitchUrl: 'https://www.twitch.tv/faith',
        avatarUrl: './assets/characters/pink-hype.png',
      },
    });

    expect(clip.creatorAvatarUrl).toBe('/streamer-avatars/faith.png');
  });
});

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  ExternalLink,
  FileVideo,
  Plus,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import {
  type AutoPopulateResult,
  type AutoPopulateSettings,
  type AutoPopulateSource,
  type ProviderStatus,
  type TwitchProviderTestResult,
  autoPopulateCreatorMoments,
  getAutoPopulateProviderStatuses,
  getDefaultAutoPopulateSettings,
  testTwitchProvider,
} from './autoPopulateMvp';
import {
  CREATOR_IMPORTER_FLAG_KEY,
  type CreatorImporterState,
  type CreatorPlatform,
  type MomentCandidate,
  type MomentCard,
  type RightsStatus,
  type SourceType,
  createCreatorProfile,
  createEmptyCreatorForm,
  createMockSourceAsset,
  createMomentCandidate,
  createMomentCard,
  getPublishedMomentCards,
  isCreatorImporterEnabled,
  loadCreatorImporterState,
  saveCreatorImporterState,
  seedDemoImporterState,
  setCreatorImporterEnabled,
} from './creatorMomentImporter';
import { twitchApiClient, type TwitchClip, type TwitchUser } from './twitchApiClient';
import {
  type InvestorDemoLoadResult,
  fetchInvestorDemoMetadata,
  loadInvestorDemoClipsIntoState,
  probeInvestorDemoFiles,
} from './investorDemo';
import {
  type ReadyClip,
  type ReadyClipConfig,
  type ReadyClipConfigs,
  type ReadyClipLoadResult,
  READY_CLIP_INDEXES,
  READY_CLIP_SCORE_TOTAL,
  clearDemoCardsAndLoadReadyClips,
  findReadyInvestorClips,
  formatReadyClipScore,
  getReadyClipAvatarUrlForTwitchUrl,
  loadReadyClipConfigs,
  loadReadyClipsIntoState,
  normalizeReadyClipScore,
  saveReadyClipConfigs,
} from './readyClipImporter';

type AdminRoute =
  | '/admin/import-ready-clips'
  | '/admin/investor-demo'
  | '/admin/auto-populate'
  | '/admin/creators/import'
  | '/admin/creators'
  | '/admin/moments/import'
  | '/admin/moments/review';

const ADMIN_ROUTES: { href: AdminRoute; label: string }[] = [
  { href: '/admin/import-ready-clips', label: 'Ready clip' },
  { href: '/admin/investor-demo', label: 'Investor demo' },
  { href: '/admin/auto-populate', label: 'Auto populate' },
  { href: '/admin/creators/import', label: 'Import creator' },
  { href: '/admin/creators', label: 'Creators' },
  { href: '/admin/moments/import', label: 'Import clips' },
  { href: '/admin/moments/review', label: 'Review' },
];

const autoPopulateSourceOptions: AutoPopulateSource[] = ['twitch_popular_clips', 'youtube_safe_videos', 'mixed_safe', 'demo_fallback'];
const autoPopulateSourceLabels: Record<AutoPopulateSource, string> = {
  twitch_popular_clips: 'Twitch Popular Clips',
  youtube_safe_videos: 'YouTube Safe Videos',
  mixed_safe: 'Mixed Safe',
  demo_fallback: 'Demo Fallback',
};
const platformOptions: CreatorPlatform[] = ['twitch', 'youtube', 'local_demo'];
const rightsOptions: RightsStatus[] = ['public_metadata_only', 'oauth_authorized', 'uploaded_by_owner', 'demo'];
const sourceOptions: SourceType[] = [
  'twitch_existing_clips',
  'twitch_authorized_clip_creation',
  'youtube_existing_video_embed',
  'local_authorized_upload',
  'demo_sample',
];

const getSourceOptionsForPlatform = (platform?: CreatorPlatform): SourceType[] => {
  if (platform === 'twitch') return ['twitch_existing_clips', 'twitch_authorized_clip_creation'];
  if (platform === 'youtube') return ['youtube_existing_video_embed'];
  if (platform === 'local_demo') return ['local_authorized_upload', 'demo_sample'];
  return sourceOptions;
};

const adminShell =
  'relative min-h-screen overflow-hidden bg-[#050506] px-4 py-8 text-white sm:px-8 sm:py-10';
const fieldClass =
  'h-12 w-full border border-white/12 bg-black/40 px-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#54b9ff]';
const labelClass = 'mb-2 block text-[11px] font-semibold uppercase text-white/58';
const fallbackAvatarUrl = './assets/characters/creator-cream.png';

function AdminHeader({ route }: { route: AdminRoute }) {
  return (
    <div className="relative z-10 mx-auto mb-8 flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <a href="/" className="mb-7 inline-flex text-xs font-semibold uppercase text-white/72 no-underline" style={{ letterSpacing: '0.18em' }}>
          GGBOX
        </a>
        <div className="flex items-center gap-3 text-[#54b9ff]">
          <ShieldCheck size={20} />
          <span className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.18em' }}>
            Creator Moment Importer MVP
          </span>
        </div>
        <h1 className="mt-3 text-[42px] uppercase leading-none sm:text-[72px]" style={{ fontFamily: "'Anton', sans-serif" }}>
          Internal admin
        </h1>
      </div>
      <nav className="flex flex-wrap gap-2">
        {ADMIN_ROUTES.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="border px-4 py-3 text-[11px] font-semibold uppercase text-white no-underline transition-colors hover:border-[#54b9ff]"
            style={{
              borderColor: item.href === route ? '#54b9ff' : 'rgba(255,255,255,0.16)',
              backgroundColor: item.href === route ? 'rgba(84,185,255,0.14)' : 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              letterSpacing: '0.12em',
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function RightsWarning() {
  return (
    <div className="border border-[#ffb84d]/35 bg-[#2a1602]/70 p-4 text-sm font-semibold text-[#ffd39a]" style={{ borderRadius: 8 }}>
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
        <p className="m-0">
          Only add creators or content that you own, manage, or have permission to use. Twitch and YouTube content will be displayed through official embeds unless the creator provides an authorized file.
        </p>
      </div>
    </div>
  );
}

function FeatureFlagGate({ children, onState }: { children: ReactNode; onState: (state: CreatorImporterState) => void }) {
  const [enabled, setEnabled] = useState(isCreatorImporterEnabled());

  if (enabled) {
    return children;
  }

  return (
    <div className="relative z-10 mx-auto max-w-4xl border border-white/12 bg-black/38 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42)]" style={{ borderRadius: 8 }}>
      <div className="flex items-start gap-4">
        <Database className="mt-1 text-[#54b9ff]" size={26} />
        <div>
          <h2 className="m-0 text-2xl font-extrabold text-white">Feature flag is off</h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/58">
            `ENABLE_CREATOR_MOMENT_IMPORTER_MVP` is false by default. The admin module is hidden until an internal reviewer enables the local MVP preview.
          </p>
          <button
            type="button"
            className="mt-5 border border-[#54b9ff] bg-[#54b9ff] px-5 py-3 text-xs font-black uppercase text-black"
            style={{ borderRadius: 8, letterSpacing: '0.14em' }}
            onClick={() => {
              setCreatorImporterEnabled(true);
              setEnabled(true);
              if (loadCreatorImporterState().creators.length === 0) {
                onState(seedDemoImporterState());
              }
            }}
          >
            Enable internal preview
          </button>
          <p className="mt-3 text-xs font-semibold text-white/35">Local flag key: {CREATOR_IMPORTER_FLAG_KEY}</p>
        </div>
      </div>
    </div>
  );
}

function AdminLayout({
  route,
  children,
  onState,
  skipFeatureGate = false,
}: {
  route: AdminRoute;
  children: ReactNode;
  onState: (state: CreatorImporterState) => void;
  skipFeatureGate?: boolean;
}) {
  return (
    <main className={adminShell} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 12% 16%, rgba(84,185,255,0.18), transparent 28%), radial-gradient(circle at 86% 20%, rgba(255,122,184,0.12), transparent 24%), linear-gradient(135deg, #050506 0%, #07111f 48%, #030304 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <AdminHeader route={route} />
      {skipFeatureGate ? children : <FeatureFlagGate onState={onState}>{children}</FeatureFlagGate>}
    </main>
  );
}

export function CreatorMomentImporterApp({ route }: { route: AdminRoute }) {
  const [state, setState] = useState(loadCreatorImporterState);
  const updateState = (next: CreatorImporterState) => {
    setState(next);
    saveCreatorImporterState(next);
  };

  return (
    <AdminLayout route={route} onState={updateState} skipFeatureGate={route === '/admin/import-ready-clips'}>
      {route === '/admin/import-ready-clips' ? <ImportReadyClipsPage state={state} updateState={updateState} /> : null}
      {route === '/admin/investor-demo' ? <InvestorDemoPage state={state} updateState={updateState} /> : null}
      {route === '/admin/auto-populate' ? <AutoPopulatePage state={state} updateState={updateState} /> : null}
      {route === '/admin/creators/import' ? <CreatorImportPage state={state} updateState={updateState} /> : null}
      {route === '/admin/creators' ? <CreatorListPage state={state} /> : null}
      {route === '/admin/moments/import' ? <MomentImportPage state={state} updateState={updateState} /> : null}
      {route === '/admin/moments/review' ? <MomentReviewPage state={state} updateState={updateState} /> : null}
    </AdminLayout>
  );
}

function ImportReadyClipsPage({ state, updateState }: { state: CreatorImporterState; updateState: (state: CreatorImporterState) => void }) {
  const [clips, setClips] = useState<ReadyClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReadyClipLoadResult | null>(null);
  const [message, setMessage] = useState('');
  const [clipConfigs, setClipConfigs] = useState<ReadyClipConfigs>(loadReadyClipConfigs);
  const primaryClip = clips[0];
  const clipByIndex = new Map(clips.map((clip) => [clip.index, clip]));
  const creatorSummary = result
    ? result.creators.map((creator) => creator.display_name).join(', ')
    : clips.map((clip) => clip.creatorName).join(', ') || 'Faith, Berticuss, Boggles, Gunnar, xRohat, Skywhywalker';

  const refresh = async () => {
    setLoading(true);
    const next = await findReadyInvestorClips(clipConfigs);
    setClips(next);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const updateClipConfig = async (index: number, patch: ReadyClipConfig) => {
    const currentConfig = clipConfigs[index] ?? {};
    const nextAvatarUrl =
      patch.avatarUrl ??
      (patch.twitchUrl ? getReadyClipAvatarUrlForTwitchUrl(patch.twitchUrl) || currentConfig.avatarUrl : currentConfig.avatarUrl);
    const nextConfigs = { ...clipConfigs, [index]: { ...currentConfig, ...patch, avatarUrl: nextAvatarUrl } };
    setClipConfigs(nextConfigs);
    saveReadyClipConfigs(nextConfigs);
    setLoading(true);
    const next = await findReadyInvestorClips(nextConfigs);
    setClips(next);
    setLoading(false);
  };

  const loadReadyClip = () => {
    if (clips.length === 0) {
      setMessage('Source file not found. Add 1.mp4 to public/investor-source-clips/ or public/demo-vods/.');
      return;
    }

    const next = loadReadyClipsIntoState(clips, state);
    updateState(next.state);
    setResult(next);
    setMessage(`Ready clips loaded into the MOMENTS section: ${next.cards.length}.`);
  };

  const clearOldDemoAndLoad = () => {
    if (clips.length === 0) {
      setMessage('Source files not found. Add 1.mp4 and 2.mp4 to public/demo-vods/.');
      return;
    }

    const next = clearDemoCardsAndLoadReadyClips(clips, state);
    updateState(next.state);
    setResult(next);
    setMessage(`Old demo cards cleared. Ready clips loaded: ${next.cards.length}. Opening MOMENTS...`);
    window.setTimeout(() => {
      window.location.href = '/#moments';
    }, 250);
  };

  return (
    <section className="relative z-10 mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <div className="grid content-start gap-4">
        <div
          className="relative overflow-hidden border border-[#54b9ff]/45 bg-black/48 p-5 shadow-[0_34px_110px_rgba(0,0,0,0.48)]"
          style={{ borderRadius: 8 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(circle at 18% 12%, rgba(84,185,255,0.22), transparent 32%), radial-gradient(circle at 86% 18%, rgba(145,70,255,0.18), transparent 28%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3 text-[#54b9ff]">
              <Sparkles size={18} />
              <span className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.16em' }}>
                Ready local clips
              </span>
            </div>
            <h2 className="m-0 mt-3 text-3xl font-extrabold">Import Ready Clip</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
              Use an already prepared video clip and publish it as a GGBOX moment.
            </p>
          </div>
        </div>

        <div className="border border-white/12 bg-black/34 p-5" style={{ borderRadius: 8 }}>
          <h3 className="m-0 text-xl font-extrabold text-white">Success report</h3>
          <div className="mt-4 grid gap-3">
            <Metric label="Ready clips found" value={loading ? 'checking' : String(clips.length)} />
            {READY_CLIP_INDEXES.map((index) => {
              const clip = clipByIndex.get(index);
              return <Metric key={`status-${index}`} label={`${index}.mp4`} value={loading ? 'checking' : clip ? 'found' : 'missing'} />;
            })}
            {READY_CLIP_INDEXES.map((index) => {
              const clip = clipByIndex.get(index);
              return <Metric key={`path-${index}`} label={`${index}.mp4 public path`} value={clip?.public_file_path ?? `/demo-vods/${index}.mp4`} />;
            })}
            <Metric label="Cards loaded" value={String(result?.cards.length ?? 0)} />
            <Metric label="Creators" value={creatorSummary} />
            <Metric label="Editable fields" value="Twitch URL, title, category, rarity, score, avatar" />
            <Metric label="Next" value="Open /#moments" />
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <div
          className="relative overflow-hidden border bg-black/56 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.44)]"
          style={{
            borderColor: primaryClip ? 'rgba(84,185,255,0.48)' : 'rgba(255,255,255,0.12)',
            borderRadius: 8,
            boxShadow: primaryClip
              ? '0 0 0 1px rgba(84,185,255,0.16), 0 34px 120px rgba(84,185,255,0.12)'
              : '0 30px 100px rgba(0,0,0,0.44)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'linear-gradient(135deg, rgba(84,185,255,0.14), transparent 34%), radial-gradient(circle at 84% 0%, rgba(145,70,255,0.24), transparent 30%)',
            }}
          />
          <div className="relative">
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Source file found" value={loading ? 'checking' : primaryClip ? 'yes' : 'no'} />
              <Metric label="Source file path" value={primaryClip?.source_file_path ?? 'public/investor-source-clips/1.mp4'} />
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {(clips.length > 0 ? clips : []).map((clip) => {
                const config = clipConfigs[clip.index] ?? {};
                const selectedRarity = (config.rarity ?? clip.rarity) === 'Legendary' ? 'Legendary' : 'Common';

                return (
                  <div key={clip.id} className="grid gap-4 border border-white/12 bg-black/32 p-4" style={{ borderRadius: 8 }}>
                  <div className="flex items-center gap-4">
                    <img
                      src={clip.creatorAvatarUrl}
                      alt=""
                      className="h-16 w-16 rounded-full border border-[#9146ff]/45 object-cover object-top"
                      onError={(event) => {
                        event.currentTarget.src = fallbackAvatarUrl;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-xl font-extrabold text-white">{clip.creatorName}</h3>
                        <Badge accent="#9146ff">TWITCH</Badge>
                      </div>
                      <p className="m-0 mt-1 text-sm font-semibold text-white/50">
                        {clip.creatorHandle} · {clip.category}
                      </p>
                      <a href={clip.creatorUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-[#54b9ff] no-underline">
                        {clip.creatorUrl}
                      </a>
                    </div>
                  </div>
                  <label>
                    <span className={labelClass} style={{ letterSpacing: '0.14em' }}>
                      {clip.index}.mp4 Twitch URL
                    </span>
                    <input
                      className={fieldClass}
                      style={{ borderRadius: 8 }}
                      value={config.twitchUrl ?? clip.creatorUrl}
                      placeholder="https://www.twitch.tv/channel"
                      onChange={(event) => void updateClipConfig(clip.index, { twitchUrl: event.currentTarget.value })}
                    />
                  </label>
                  <label>
                    <span className={labelClass} style={{ letterSpacing: '0.14em' }}>
                      Title
                    </span>
                    <input
                      className={fieldClass}
                      style={{ borderRadius: 8 }}
                      value={config.title ?? clip.title}
                      onChange={(event) => void updateClipConfig(clip.index, { title: event.currentTarget.value })}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label>
                      <span className={labelClass} style={{ letterSpacing: '0.14em' }}>
                        Category
                      </span>
                      <input
                        className={fieldClass}
                        style={{ borderRadius: 8 }}
                        value={config.category ?? clip.category}
                        onChange={(event) => void updateClipConfig(clip.index, { category: event.currentTarget.value })}
                      />
                    </label>
                    <label>
                      <span className={labelClass} style={{ letterSpacing: '0.14em' }}>
                        Rarity
                      </span>
                      <select
                        className={fieldClass}
                        style={{ borderRadius: 8 }}
                        value={selectedRarity}
                        onChange={(event) => void updateClipConfig(clip.index, { rarity: event.currentTarget.value as ReadyClipConfig['rarity'] })}
                      >
                        <option value="Legendary">Legendary</option>
                        <option value="Common">Standard (no badge)</option>
                      </select>
                    </label>
                    <label>
                      <span className={labelClass} style={{ letterSpacing: '0.14em' }}>
                        Score
                      </span>
                      <input
                        className={fieldClass}
                        style={{ borderRadius: 8 }}
                        type="number"
                        min={0}
                        max={READY_CLIP_SCORE_TOTAL}
                        value={normalizeReadyClipScore(config.score ?? clip.score)}
                        onChange={(event) => void updateClipConfig(clip.index, { score: normalizeReadyClipScore(Number(event.currentTarget.value)) })}
                      />
                    </label>
                  </div>
                  <label>
                    <span className={labelClass} style={{ letterSpacing: '0.14em' }}>
                      Avatar image path or URL
                    </span>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        className={fieldClass}
                        style={{ borderRadius: 8 }}
                        value={config.avatarUrl ?? clip.creatorAvatarUrl}
                        onChange={(event) => void updateClipConfig(clip.index, { avatarUrl: event.currentTarget.value })}
                      />
                      <button
                        type="button"
                        className="h-12 border border-[#9146ff]/70 bg-[#9146ff]/18 px-4 text-[11px] font-black uppercase text-white"
                        style={{ borderRadius: 8, letterSpacing: '0.12em' }}
                        onClick={() =>
                          void updateClipConfig(clip.index, {
                            avatarUrl: getReadyClipAvatarUrlForTwitchUrl(config.twitchUrl ?? clip.creatorUrl) || clip.creatorAvatarUrl,
                          })
                        }
                      >
                        Auto avatar
                      </button>
                    </div>
                  </label>
                  </div>
                );
              })}
            </div>

            <div className="relative overflow-hidden border border-white/12 bg-black" style={{ borderRadius: 8 }}>
              <div className="aspect-video">
                {primaryClip ? (
                  <video src={primaryClip.video_url} className="h-full w-full object-cover" controls playsInline preload="metadata" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-5 text-center text-sm font-semibold text-white/56">
                    Source clip unavailable. Add a prepared local mp4 and refresh.
                  </div>
                )}
              </div>
            </div>

            {clips.length > 1 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {clips.map((clip) => (
                  <div key={clip.id} className="border border-white/10 bg-white/5 p-3" style={{ borderRadius: 8 }}>
                    <div className="text-sm font-extrabold text-white">{clip.title}</div>
                    <div className="mt-2 text-xs font-semibold uppercase text-white/44" style={{ letterSpacing: '0.1em' }}>
                      {clip.rarity === 'Legendary' ? 'Legendary · ' : ''}score {formatReadyClipScore(clip.score)}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#54b9ff] bg-[#54b9ff] px-5 py-4 text-xs font-black uppercase text-black shadow-[0_0_34px_rgba(84,185,255,0.24)]"
                style={{ borderRadius: 8, letterSpacing: '0.14em' }}
                onClick={loadReadyClip}
              >
                <Sparkles size={17} /> Reload Ready Clips into GGBOX
              </button>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#8cff2f] bg-[#8cff2f] px-5 py-4 text-xs font-black uppercase text-black shadow-[0_0_34px_rgba(140,255,47,0.22)]"
                style={{ borderRadius: 8, letterSpacing: '0.14em' }}
                onClick={clearOldDemoAndLoad}
              >
                <Sparkles size={17} /> Clear old demo cards and load ready clips
              </button>
              <a
                href="/#moments"
                className="inline-flex min-h-12 items-center justify-center border border-white/18 bg-white/6 px-5 py-4 text-xs font-black uppercase text-white no-underline"
                style={{ borderRadius: 8, letterSpacing: '0.14em' }}
              >
                Open Moments
              </a>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center border border-white/12 bg-black/28 px-5 py-4 text-xs font-black uppercase text-white/70"
                style={{ borderRadius: 8, letterSpacing: '0.14em' }}
                onClick={refresh}
              >
                Refresh
              </button>
            </div>

            {message ? <p className="mt-4 text-sm font-semibold text-[#8cff2f]">{message}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function InvestorDemoPage({ state, updateState }: { state: CreatorImporterState; updateState: (state: CreatorImporterState) => void }) {
  const [vodFound, setVodFound] = useState(false);
  const [metadataFound, setMetadataFound] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<InvestorDemoLoadResult | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    const status = await probeInvestorDemoFiles();
    setVodFound(status.vodFound);
    setMetadataFound(status.metadataFound);
    if (status.metadataFound) {
      try {
        const metadata = await fetchInvestorDemoMetadata();
        setGeneratedCount(metadata.clips.length);
      } catch {
        setGeneratedCount(0);
      }
    } else {
      setGeneratedCount(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const loadGeneratedClips = async () => {
    setMessage('');
    try {
      const metadata = await fetchInvestorDemoMetadata();
      const next = loadInvestorDemoClipsIntoState(metadata, state);
      updateState(next.state);
      setResult(next);
      setGeneratedCount(metadata.clips.length);
      setMessage(`Loaded ${next.cards.length} investor demo cards into GGBOX.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load investor demo clips.');
    }
  };

  return (
    <section className="relative z-10 mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="grid content-start gap-4">
        <div className="border border-[#54b9ff]/35 bg-black/44 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)]" style={{ borderRadius: 8 }}>
          <div className="flex items-center gap-3 text-[#54b9ff]">
            <Sparkles size={18} />
            <span className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.16em' }}>
              Investor Demo Mode
            </span>
          </div>
          <h2 className="m-0 mt-3 text-3xl font-extrabold">Investor Demo Mode</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/58">
            VOD {'->'} AI moment detection {'->'} 10 sec clip {'->'} GGBOX card
          </p>
          <div className="mt-5 grid gap-3 text-xs font-semibold uppercase text-white/48" style={{ letterSpacing: '0.1em' }}>
            <span>Authorized local sample only</span>
            <span>No Twitch or YouTube API</span>
            <span>No downloads, scraping, yt-dlp, or streamlink</span>
          </div>
        </div>

        <div className="border border-white/12 bg-black/34 p-5" style={{ borderRadius: 8 }}>
          <h3 className="m-0 text-xl font-extrabold text-white">Investor report</h3>
          <div className="mt-4 grid gap-3">
            <Metric label="Demo VOD found" value={loading ? 'checking' : vodFound ? 'yes' : 'no'} />
            <Metric label="Generated clips found" value={String(generatedCount)} />
            <Metric label="Cards added" value={String(result?.cards.length ?? state.cards.filter((card) => card.content_origin === 'investor_demo').length)} />
            <Metric label="Mode" value="Investor Demo" />
            <Metric label="Rights" value="Authorized sample" />
          </div>
          <a href="/#moments" className="mt-4 inline-flex h-11 items-center justify-center border border-[#54b9ff] px-4 text-xs font-black uppercase text-[#54b9ff] no-underline" style={{ borderRadius: 8, letterSpacing: '0.12em' }}>
            Open /#moments
          </a>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="border border-white/12 bg-black/44 p-5" style={{ borderRadius: 8 }}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-2xl font-extrabold">Generate Investor Demo Clips</h2>
              <p className="m-0 mt-1 text-sm font-semibold text-white/48">Run the generator locally, then load the generated metadata into GGBOX.</p>
            </div>
            <button
              type="button"
              className="h-11 border border-white/18 px-4 text-xs font-black uppercase text-white"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
              onClick={refreshStatus}
            >
              Refresh
            </button>
          </div>

          {!metadataFound ? (
            <div className="grid gap-4">
              <div className="border border-[#ffb84d]/35 bg-[#2a1602]/55 p-4 text-sm font-semibold text-[#ffd39a]" style={{ borderRadius: 8 }}>
                {vodFound
                  ? 'Generated clips are missing. Run pnpm investor:demo to generate clips automatically.'
                  : 'Missing investor demo VOD: add index.mp4 to public/demo-vods/index.mp4'}
              </div>
              <div className="border border-white/12 bg-black/50 p-4" style={{ borderRadius: 8 }}>
                <div className="mb-2 text-[11px] font-semibold uppercase text-white/42" style={{ letterSpacing: '0.14em' }}>
                  Command
                </div>
                <code className="block overflow-x-auto whitespace-nowrap text-sm font-extrabold text-[#8cff2f]">pnpm investor:demo</code>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="border border-[#8cff2f]/35 bg-[#0b2608]/45 p-4 text-sm font-semibold text-[#baff9a]" style={{ borderRadius: 8 }}>
                Generated clips found. Ready to load investor demo cards into the public GGBOX feed.
              </div>
              <button
                type="button"
                className="inline-flex h-14 items-center justify-center gap-2 border border-[#8cff2f] bg-[#8cff2f] px-6 text-sm font-black uppercase text-black"
                style={{ borderRadius: 8, letterSpacing: '0.14em' }}
                onClick={loadGeneratedClips}
              >
                <Sparkles size={17} /> Load Generated Clips into GGBOX
              </button>
            </div>
          )}

          {message ? <p className="mt-4 text-sm font-semibold text-white/62">{message}</p> : null}
        </div>

        {result ? (
          <div className="border border-white/12 bg-black/38 p-5" style={{ borderRadius: 8 }}>
            <h3 className="m-0 text-xl font-extrabold text-white">Loaded cards</h3>
            <div className="mt-4 grid gap-3">
              {result.cards.map((card) => (
                <div key={card.id} className="grid gap-3 border border-white/10 bg-black/28 p-3 sm:grid-cols-[96px_1fr_auto]" style={{ borderRadius: 8 }}>
                  <video src={card.video_url ?? card.display_asset_url} poster={card.thumbnail_url} className="h-16 w-24 object-cover" muted playsInline controls style={{ borderRadius: 6 }} />
                  <div>
                    <div className="text-sm font-extrabold text-white">{card.title}</div>
                    <div className="mt-1 text-xs font-semibold uppercase text-white/42" style={{ letterSpacing: '0.08em' }}>
                      {card.rarity} · score {formatReadyClipScore(card.score)} · {card.rights_status}
                    </div>
                  </div>
                  <a href="/#moments" className="self-center text-xs font-black uppercase text-[#54b9ff] no-underline" style={{ letterSpacing: '0.1em' }}>
                    View feed
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AutoPopulatePage({ state, updateState }: { state: CreatorImporterState; updateState: (state: CreatorImporterState) => void }) {
  const [settings, setSettings] = useState<AutoPopulateSettings>(getDefaultAutoPopulateSettings);
  const [result, setResult] = useState<AutoPopulateResult | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>(getAutoPopulateProviderStatuses);
  const [testHandle, setTestHandle] = useState('kirovfps');
  const [twitchTest, setTwitchTest] = useState<TwitchProviderTestResult | null>(null);
  const [testingTwitch, setTestingTwitch] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runAutoPopulate = async () => {
    setLoading(true);
    setError('');
    try {
      const next = await autoPopulateCreatorMoments(settings, state);
      updateState(next.state);
      setResult(next);
      setProviderStatuses(next.providerStatuses);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Auto populate failed.');
    } finally {
      setLoading(false);
    }
  };

  const runTwitchTest = async () => {
    setTestingTwitch(true);
    setError('');
    const next = await testTwitchProvider(testHandle);
    setTwitchTest(next);
    setTestingTwitch(false);
  };

  return (
    <section className="relative z-10 mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="grid content-start gap-4">
        <RightsWarning />
        <div className="border border-white/12 bg-black/38 p-5" style={{ borderRadius: 8 }}>
          <div className="flex items-center gap-3 text-[#54b9ff]">
            <Sparkles size={18} />
            <span className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.16em' }}>
              One-click MVP feed
            </span>
          </div>
          <h2 className="m-0 mt-3 text-3xl font-extrabold">Auto Populate MVP</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/58">
            Populates the public GGBOX product area with creator cards using official-API-shaped metadata. Twitch and YouTube remain embed-only.
          </p>
          <div className="mt-5 grid gap-3 text-xs font-semibold uppercase text-white/48" style={{ letterSpacing: '0.1em' }}>
            <span>No video download</span>
            <span>No scraping</span>
            <span>No local mp4 from Twitch or YouTube</span>
          </div>
        </div>
        <ProviderStatusPanel statuses={providerStatuses} />
      </div>

      <div className="grid gap-5">
        <div className="border border-[#54b9ff]/35 bg-black/44 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)]" style={{ borderRadius: 8 }}>
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="text-[#54b9ff]" />
            <h2 className="m-0 text-2xl font-extrabold">Auto Populate Settings</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Source selector"
              value={settings.source}
              values={autoPopulateSourceOptions}
              labels={autoPopulateSourceLabels}
              onChange={(value) => setSettings({ ...settings, source: value as AutoPopulateSource })}
            />
            <NumberField
              label="Number of creators"
              value={settings.numberOfCreators}
              min={1}
              max={12}
              onChange={(value) => setSettings({ ...settings, numberOfCreators: value })}
            />
            <NumberField
              label="Moments per creator"
              value={settings.momentsPerCreator}
              min={1}
              max={6}
              onChange={(value) => setSettings({ ...settings, momentsPerCreator: value })}
            />
            <NumberField
              label="Minimum score"
              value={settings.minimumScore}
              min={0}
              max={100}
              onChange={(value) => setSettings({ ...settings, minimumScore: value })}
            />
          </div>

          <label className="mt-4 flex items-center gap-3 border border-white/12 bg-black/30 p-4 text-sm font-semibold text-white/68" style={{ borderRadius: 8 }}>
            <input
              type="checkbox"
              checked={settings.autoPublish}
              onChange={(event) => setSettings({ ...settings, autoPublish: event.currentTarget.checked })}
            />
            Auto publish approved MomentCards to the public GGBOX feed
          </label>

          <button
            type="button"
            className="mt-5 inline-flex h-14 items-center justify-center gap-2 border border-[#8cff2f] bg-[#8cff2f] px-6 text-sm font-black uppercase text-black disabled:cursor-wait disabled:opacity-60"
            style={{ borderRadius: 8, letterSpacing: '0.14em' }}
            disabled={loading}
            onClick={runAutoPopulate}
          >
            <Sparkles size={17} /> {loading ? 'Populating...' : 'Auto Populate MVP'}
          </button>

          {error ? (
            <div className="mt-4 border border-[#ff5f7a]/45 bg-[#2a0610]/70 p-4 text-sm font-semibold text-[#ffb6c3]" style={{ borderRadius: 8 }}>
              {error}
            </div>
          ) : null}
        </div>

        <TwitchProviderTestPanel
          handle={testHandle}
          onHandleChange={setTestHandle}
          result={twitchTest}
          loading={testingTwitch}
          onTest={runTwitchTest}
        />
        <AutoPopulateResults result={result} state={state} loading={loading} />
      </div>
    </section>
  );
}

function TwitchProviderTestPanel({
  handle,
  onHandleChange,
  result,
  loading,
  onTest,
}: {
  handle: string;
  onHandleChange: (value: string) => void;
  result: TwitchProviderTestResult | null;
  loading: boolean;
  onTest: () => void;
}) {
  return (
    <div className="border border-white/12 bg-black/38 p-5" style={{ borderRadius: 8 }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="m-0 text-xl font-extrabold text-white">Real Twitch smoke test</h3>
          <p className="m-0 mt-1 text-sm font-semibold text-white/48">Tests Helix users/clips through the configured safe provider.</p>
        </div>
        <button
          type="button"
          className="h-11 border border-[#54b9ff] bg-[#54b9ff] px-4 text-xs font-black uppercase text-black disabled:cursor-wait disabled:opacity-60"
          style={{ borderRadius: 8, letterSpacing: '0.12em' }}
          disabled={loading}
          onClick={onTest}
        >
          {loading ? 'Testing...' : 'Test Twitch Provider'}
        </button>
      </div>
      <TextField label="Streamer handle" value={handle} onChange={onHandleChange} placeholder="kirovfps" />
      {result ? (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Credentials" value={result.credentialsDetected ? 'yes' : 'no'} />
            <Metric label="Mode" value={result.providerMode} />
            <Metric label="Status" value={result.status} />
            <Metric label="Clips" value={String(result.clips.length)} />
          </div>
          {result.fallbackReason ? (
            <div className="border border-[#ffb84d]/35 bg-[#2a1602]/55 p-3 text-sm font-semibold text-[#ffd39a]" style={{ borderRadius: 8 }}>
              Fallback reason: {result.fallbackReason}
            </div>
          ) : null}
          {result.creator ? (
            <div className="flex items-center gap-3 border border-white/10 bg-black/28 p-3" style={{ borderRadius: 8 }}>
              <img src={result.creator.profile_image_url} alt="" className="h-14 w-14 rounded-full object-cover object-top" />
              <div>
                <div className="text-base font-extrabold text-white">{result.creator.display_name}</div>
                <div className="text-xs font-semibold uppercase text-white/42" style={{ letterSpacing: '0.08em' }}>
                  {result.creator.login}
                </div>
              </div>
            </div>
          ) : null}
          {result.clips.length > 0 ? (
            <div className="grid gap-3">
              {result.clips.slice(0, 5).map((clip) => (
                <div key={clip.id} className="grid gap-3 border border-white/10 bg-black/28 p-3 sm:grid-cols-[86px_1fr_auto]" style={{ borderRadius: 8 }}>
                  <img src={clip.thumbnail_url} alt="" className="h-14 w-[86px] object-cover object-top" style={{ borderRadius: 6 }} />
                  <div>
                    <div className="text-sm font-extrabold text-white">{clip.title}</div>
                    <div className="mt-1 text-xs font-semibold uppercase text-white/42" style={{ letterSpacing: '0.08em' }}>
                      {clip.view_count.toLocaleString()} views · {clip.duration}s
                    </div>
                  </div>
                  <a href={clip.url} target="_blank" rel="noreferrer" className="self-center text-xs font-black uppercase text-[#54b9ff] no-underline" style={{ letterSpacing: '0.1em' }}>
                    Open Source
                  </a>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProviderStatusPanel({ statuses }: { statuses: ProviderStatus[] }) {
  return (
    <div className="border border-white/12 bg-black/34 p-5" style={{ borderRadius: 8 }}>
      <h3 className="m-0 text-xl font-extrabold text-white">Provider Status</h3>
      <div className="mt-4 grid gap-3">
        {statuses.map((provider) => {
          const ready = provider.status === 'ready';
          const error = provider.status === 'error';
          return (
            <div key={provider.name} className="border border-white/10 bg-black/28 p-3" style={{ borderRadius: 8 }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-white">{provider.name}</span>
                <span
                  className="border px-3 py-1 text-[10px] font-black uppercase"
                  style={{
                    borderColor: ready ? '#8cff2f88' : error ? '#ff5f7a88' : '#ffb84d88',
                    color: ready ? '#8cff2f' : error ? '#ff9caf' : '#ffd39a',
                    borderRadius: 999,
                    letterSpacing: '0.1em',
                  }}
                >
                  {provider.status}
                </span>
              </div>
              <p className="m-0 mt-2 text-xs font-semibold leading-5 text-white/44">{provider.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutoPopulateResults({ result, state, loading }: { result: AutoPopulateResult | null; state: CreatorImporterState; loading: boolean }) {
  if (loading) {
    return (
      <div className="border border-white/12 bg-black/32 p-5 text-sm font-semibold text-white/58" style={{ borderRadius: 8 }}>
        Preparing safe creator metadata and public feed cards...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="border border-white/12 bg-black/32 p-5" style={{ borderRadius: 8 }}>
        <h3 className="m-0 text-xl font-extrabold text-white">Results panel</h3>
        <p className="mt-2 text-sm font-semibold text-white/52">
          No auto-populate run yet. Current MVP has {state.creators.length} creators, {state.assets.length} clips/videos, {state.candidates.length} candidates, and {state.cards.length} public cards.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/12 bg-black/38 p-5" style={{ borderRadius: 8 }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-xl font-extrabold text-white">Imported results</h3>
          <p className="m-0 mt-1 text-sm font-semibold text-white/50">{result.message}</p>
        </div>
        <a href="/#moments" className="border border-[#54b9ff] px-4 py-3 text-xs font-black uppercase text-[#54b9ff] no-underline" style={{ borderRadius: 8, letterSpacing: '0.12em' }}>
          View public feed
        </a>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Creators" value={String(result.creators.length)} />
        <Metric label="Clips/videos" value={String(result.assets.length)} />
        <Metric label="Candidates" value={String(result.candidates.length)} />
        <Metric label="Published cards" value={String(result.cards.length)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Metric label="Credentials detected" value={result.debug.credentialsDetected ? 'yes' : 'no'} />
        <Metric label="Provider mode" value={result.debug.providerMode} />
        <Metric label="Last API status" value={result.debug.lastApiRequestStatus} />
      </div>
      {result.debug.fallbackReason ? (
        <div className="mt-3 border border-[#ffb84d]/35 bg-[#2a1602]/55 p-3 text-sm font-semibold text-[#ffd39a]" style={{ borderRadius: 8 }}>
          Fallback reason: {result.debug.fallbackReason}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {result.creators.map((creator) => (
          <div key={creator.id} className="flex items-center gap-3 border border-white/10 bg-black/28 p-3" style={{ borderRadius: 8 }}>
            <img src={creator.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover object-top" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-extrabold text-white">{creator.display_name}</div>
              <div className="truncate text-xs font-semibold uppercase text-white/42" style={{ letterSpacing: '0.08em' }}>
                {creator.platform} · {result.candidates.filter((candidate) => candidate.creator_profile_id === creator.id).length} moments
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatorImportPage({ state, updateState }: { state: CreatorImporterState; updateState: (state: CreatorImporterState) => void }) {
  const [form, setForm] = useState(createEmptyCreatorForm);
  const [message, setMessage] = useState('');
  const [twitchHandle, setTwitchHandle] = useState('rushlive');
  const [twitchProfile, setTwitchProfile] = useState<TwitchUser | null>(null);
  const [twitchClips, setTwitchClips] = useState<TwitchClip[]>([]);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [twitchMessage, setTwitchMessage] = useState('');

  const twitchCreator = twitchProfile ? twitchApiClient.mapTwitchUserToCreatorProfile(twitchProfile) : null;
  const selectedTwitchClips = twitchClips.filter((clip) => selectedClipIds.includes(clip.id));
  const generatedTwitchCandidates = twitchCreator
    ? selectedTwitchClips.map((clip) => {
        const asset = twitchApiClient.mapTwitchClipToSourceAsset(clip, twitchCreator);
        return {
          clip,
          asset,
          candidate: twitchApiClient.mapTwitchClipToMomentCandidate(clip, asset, twitchCreator),
        };
      })
    : [];

  const fetchMockTwitchProfile = async () => {
    const profile = await twitchApiClient.getCreatorByHandle(twitchHandle);
    setTwitchProfile(profile);
    setTwitchClips([]);
    setSelectedClipIds([]);
    setTwitchMessage(`Fetched mock Twitch profile for ${profile.display_name}.`);
  };

  const fetchMockTwitchClips = async () => {
    const profile = twitchProfile ?? (await twitchApiClient.getCreatorByHandle(twitchHandle));
    const clips = await twitchApiClient.getCreatorClips(profile.id);
    setTwitchProfile(profile);
    setTwitchClips(clips);
    setSelectedClipIds(clips.map((clip) => clip.id));
    setTwitchMessage(`Fetched ${clips.length} mock Twitch clips. No mp4 files were created.`);
  };

  const publishSelectedTwitchClips = () => {
    if (!twitchCreator || generatedTwitchCandidates.length === 0) {
      setTwitchMessage('Fetch mock Twitch profile and clips, then select clips to publish.');
      return;
    }

    const approvedCandidates = generatedTwitchCandidates.map(({ candidate }) => ({
      ...candidate,
      status: 'approved' as const,
      updated_at: new Date().toISOString(),
    }));
    const cards = approvedCandidates.map((candidate) => createMomentCard(candidate, twitchCreator));

    updateState({
      ...state,
      creators: [twitchCreator, ...state.creators.filter((creator) => creator.id !== twitchCreator.id)],
      assets: [
        ...generatedTwitchCandidates.map(({ asset }) => asset),
        ...state.assets.filter((asset) => !generatedTwitchCandidates.some(({ asset: next }) => next.id === asset.id)),
      ],
      candidates: [
        ...approvedCandidates,
        ...state.candidates.filter((candidate) => !approvedCandidates.some((next) => next.id === candidate.id)),
      ],
      cards: [...cards, ...state.cards.filter((card) => !cards.some((next) => next.moment_candidate_id === card.moment_candidate_id))],
    });
    setTwitchMessage(`Published ${cards.length} approved Twitch GGBOX cards for ${twitchCreator.display_name}.`);
  };

  return (
    <section className="relative z-10 mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="grid gap-4">
        <RightsWarning />
        <div className="border border-white/12 bg-black/38 p-5" style={{ borderRadius: 8 }}>
          <h2 className="m-0 text-xl font-extrabold">Rights-safe import rules</h2>
          <ul className="mt-4 grid gap-3 pl-5 text-sm font-semibold leading-6 text-white/58">
            <li>Twitch and YouTube are metadata/embed-only unless OAuth proves owner/editor permission.</li>
            <li>Local video processing is reserved for owner uploads and demo files.</li>
            <li>Every asset, candidate, and public card stores rights status and source credit.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="border border-[#54b9ff]/35 bg-black/44 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)]" style={{ borderRadius: 8 }}>
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="text-[#54b9ff]" />
            <div>
              <h2 className="m-0 text-2xl font-extrabold">Import Twitch creator by handle</h2>
              <p className="m-0 mt-1 text-sm font-semibold text-white/48">Mock adapter now, official Twitch API shape later.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <TextField label="Twitch handle" value={twitchHandle} onChange={setTwitchHandle} placeholder="@creator" required />
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 border border-white/16 bg-white/6 px-4 text-xs font-black uppercase text-white"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
              onClick={fetchMockTwitchProfile}
            >
              Fetch profile
            </button>
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 border border-[#54b9ff] bg-[#54b9ff] px-4 text-xs font-black uppercase text-black"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
              onClick={fetchMockTwitchClips}
            >
              Fetch clips
            </button>
          </div>

          {twitchCreator ? (
            <div className="mt-5 grid gap-4 border border-white/12 bg-black/32 p-4 sm:grid-cols-[auto_1fr]" style={{ borderRadius: 8 }}>
              <img src={twitchCreator.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover object-top" />
              <div>
                <h3 className="m-0 text-xl font-extrabold">{twitchCreator.display_name}</h3>
                <p className="m-0 mt-1 text-sm font-semibold text-white/50">{twitchCreator.channel_url}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase text-white/48" style={{ letterSpacing: '0.1em' }}>
                  <span className="border border-white/12 px-3 py-2" style={{ borderRadius: 999 }}>creator name</span>
                  <span className="border border-white/12 px-3 py-2" style={{ borderRadius: 999 }}>avatar_url</span>
                  <span className="border border-white/12 px-3 py-2" style={{ borderRadius: 999 }}>embed metadata only</span>
                </div>
              </div>
            </div>
          ) : null}

          {twitchClips.length > 0 ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="m-0 text-lg font-extrabold">Generate MomentCandidates</h3>
                <button
                  type="button"
                  className="h-11 border border-[#8cff2f] bg-[#8cff2f] px-4 text-xs font-black uppercase text-black"
                  style={{ borderRadius: 8, letterSpacing: '0.12em' }}
                  onClick={publishSelectedTwitchClips}
                >
                  Approve selected and publish cards
                </button>
              </div>
              <div className="grid gap-3">
                {twitchClips.map((clip) => {
                  const selected = selectedClipIds.includes(clip.id);
                  return (
                    <label key={clip.id} className="grid cursor-pointer gap-3 border border-white/12 bg-black/30 p-3 sm:grid-cols-[auto_72px_1fr_auto]" style={{ borderRadius: 8 }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          setSelectedClipIds((ids) =>
                            event.currentTarget.checked ? [...ids, clip.id] : ids.filter((id) => id !== clip.id),
                          );
                        }}
                      />
                      <img src={clip.thumbnail_url} alt="" className="h-14 w-[72px] object-cover object-top" style={{ borderRadius: 6 }} />
                      <div>
                        <div className="font-extrabold text-white">{clip.title}</div>
                        <div className="mt-1 text-xs font-semibold uppercase text-white/42" style={{ letterSpacing: '0.08em' }}>
                          clip_id {clip.id} · {clip.view_count.toLocaleString()} views · {clip.duration}s
                        </div>
                      </div>
                      <div className="text-xs font-semibold uppercase text-[#54b9ff]" style={{ letterSpacing: '0.1em' }}>
                        MomentCandidate
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {generatedTwitchCandidates.length > 0 ? (
            <p className="mt-4 text-sm font-semibold text-white/58">
              Generated {generatedTwitchCandidates.length} draft candidates from selected Twitch clips. Publishing approves them and adds public GGBOX cards.
            </p>
          ) : null}
          {twitchMessage ? <p className="mt-4 text-sm font-semibold text-[#8cff2f]">{twitchMessage}</p> : null}
        </div>

        <form
          className="border border-white/12 bg-black/44 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)]"
          style={{ borderRadius: 8 }}
          onSubmit={(event) => {
            event.preventDefault();
            const creator = createCreatorProfile(form);
            updateState({ ...state, creators: [creator, ...state.creators] });
            setMessage(`${creator.display_name} saved as ${creator.platform} creator.`);
            setForm(createEmptyCreatorForm());
          }}
        >
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="text-[#54b9ff]" />
            <h2 className="m-0 text-2xl font-extrabold">Add creator manually</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Platform" value={form.platform} values={platformOptions} onChange={(value) => setForm({ ...form, platform: value as CreatorPlatform })} />
            <SelectField label="Rights status" value={form.rights_status} values={rightsOptions} onChange={(value) => setForm({ ...form, rights_status: value as RightsStatus })} />
            <TextField label="Creator URL" value={form.creator_url} onChange={(value) => setForm({ ...form, creator_url: value })} placeholder="https://twitch.tv/creator" />
            <TextField label="Creator handle" value={form.creator_handle} onChange={(value) => setForm({ ...form, creator_handle: value })} placeholder="@creator" required />
            <TextField label="External creator ID" value={form.external_creator_id} onChange={(value) => setForm({ ...form, external_creator_id: value })} placeholder="Official platform ID when available" />
            <TextField label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} placeholder="Permission notes, manager contact, OAuth scope..." />
          </div>
          <button className="mt-5 inline-flex h-12 items-center gap-2 border border-[#54b9ff] bg-[#54b9ff] px-5 text-xs font-black uppercase text-black" style={{ borderRadius: 8, letterSpacing: '0.14em' }}>
            <Plus size={16} /> Save creator
          </button>
          {message ? <p className="mt-4 text-sm font-semibold text-[#8cff2f]">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}

function CreatorListPage({ state }: { state: CreatorImporterState }) {
  return (
    <section className="relative z-10 mx-auto max-w-7xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="m-0 text-2xl font-extrabold">Creators</h2>
        <a href="/admin/creators/import" className="text-xs font-semibold uppercase text-[#54b9ff] no-underline" style={{ letterSpacing: '0.14em' }}>
          Add creator
        </a>
      </div>
      <div className="grid gap-3">
        {state.creators.map((creator) => {
          const imported = state.assets.filter((asset) => asset.creator_profile_id === creator.id).length;
          return (
            <div key={creator.id} className="grid gap-4 border border-white/12 bg-black/36 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center" style={{ borderRadius: 8 }}>
              <img src={creator.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover object-top" />
              <div>
                <h3 className="m-0 text-lg font-extrabold">{creator.display_name}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase text-white/50" style={{ letterSpacing: '0.08em' }}>
                  <span>{creator.platform}</span>
                  <span>{creator.rights_status}</span>
                  <span>{imported} clips</span>
                </div>
                <a href={creator.channel_url} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#54b9ff] no-underline">
                  Channel URL <ExternalLink size={13} />
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/admin/moments/import" className="border border-white/14 px-4 py-3 text-xs font-black uppercase text-white no-underline" style={{ borderRadius: 8 }}>
                  Import clips
                </a>
                <a href="/admin/moments/review" className="border border-[#54b9ff]/55 px-4 py-3 text-xs font-black uppercase text-white no-underline" style={{ borderRadius: 8 }}>
                  View moments
                </a>
              </div>
            </div>
          );
        })}
        {state.creators.length === 0 ? <EmptyState label="No creators yet. Add one or enable the demo seed." /> : null}
      </div>
    </section>
  );
}

function MomentImportPage({ state, updateState }: { state: CreatorImporterState; updateState: (state: CreatorImporterState) => void }) {
  const firstCreator = state.creators[0]?.id ?? '';
  const [creatorId, setCreatorId] = useState(firstCreator);
  const [sourceType, setSourceType] = useState<SourceType>('demo_sample');
  const [title, setTitle] = useState('Perfect creator moment for GGBOX review');
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const creator = state.creators.find((item) => item.id === creatorId);
  const availableSources = useMemo(() => getSourceOptionsForPlatform(creator?.platform), [creator?.platform]);
  const needsConfirmation = sourceType === 'local_authorized_upload';

  useEffect(() => {
    if (creator && !availableSources.includes(sourceType)) {
      setSourceType(availableSources[0]);
    }
  }, [availableSources, creator, sourceType]);

  return (
    <section className="relative z-10 mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <RightsWarning />
      <form
        className="border border-white/12 bg-black/44 p-5"
        style={{ borderRadius: 8 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!creator) return;
          if (needsConfirmation && !confirmed) {
            setMessage('Confirm ownership or edit permission before local processing.');
            return;
          }
          const asset = createMockSourceAsset(creator, sourceType, title);
          const candidate = createMomentCandidate(asset, creator);
          updateState({
            ...state,
            assets: [asset, ...state.assets],
            candidates: [candidate, ...state.candidates],
          });
          setMessage('Moment candidate created as draft for admin review.');
        }}
      >
        <div className="mb-5 flex items-center gap-3">
          <FileVideo className="text-[#54b9ff]" />
          <h2 className="m-0 text-2xl font-extrabold">Import source clip</h2>
        </div>
        <div className="grid gap-4">
          <SelectField label="Creator" value={creatorId} values={state.creators.map((item) => item.id)} labels={Object.fromEntries(state.creators.map((item) => [item.id, item.display_name]))} onChange={setCreatorId} />
          <SelectField label="Source type" value={sourceType} values={availableSources} onChange={(value) => setSourceType(value as SourceType)} />
          <TextField label="Moment title" value={title} onChange={setTitle} required />
          {needsConfirmation ? (
            <label className="flex gap-3 border border-white/12 bg-black/30 p-4 text-sm font-semibold text-white/68" style={{ borderRadius: 8 }}>
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.currentTarget.checked)} />
              I confirm that I own this video or have permission to use and edit it.
            </label>
          ) : null}
        </div>
        <button className="mt-5 inline-flex h-12 items-center gap-2 border border-[#54b9ff] bg-[#54b9ff] px-5 text-xs font-black uppercase text-black" style={{ borderRadius: 8, letterSpacing: '0.14em' }}>
          <Sparkles size={16} /> Generate draft candidate
        </button>
        {message ? <p className="mt-4 text-sm font-semibold text-white/62">{message}</p> : null}
      </form>
    </section>
  );
}

function MomentReviewPage({ state, updateState }: { state: CreatorImporterState; updateState: (state: CreatorImporterState) => void }) {
  const enriched = useMemo(
    () =>
      state.candidates.map((candidate) => ({
        candidate,
        creator: state.creators.find((item) => item.id === candidate.creator_profile_id),
      })),
    [state],
  );

  const setStatus = (candidate: MomentCandidate, status: MomentCandidate['status']) => {
    updateState({
      ...state,
      candidates: state.candidates.map((item) =>
        item.id === candidate.id ? { ...item, status, updated_at: new Date().toISOString() } : item,
      ),
    });
  };

  const publish = (candidate: MomentCandidate) => {
    const creator = state.creators.find((item) => item.id === candidate.creator_profile_id);
    if (!creator) return;
    const approved = { ...candidate, status: 'approved' as const };
    const card = createMomentCard(approved, creator);
    updateState({
      ...state,
      candidates: state.candidates.map((item) => (item.id === candidate.id ? approved : item)),
      cards: [card, ...state.cards.filter((item) => item.moment_candidate_id !== candidate.id)],
    });
  };

  return (
    <section className="relative z-10 mx-auto max-w-7xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="m-0 text-2xl font-extrabold">Review generated moment candidates</h2>
        <span className="text-xs font-semibold uppercase text-white/42" style={{ letterSpacing: '0.14em' }}>
          Draft first, public after approval
        </span>
      </div>
      <div className="grid gap-4">
        {enriched.map(({ candidate, creator }) => (
          <div key={candidate.id} className="grid gap-5 border border-white/12 bg-black/40 p-4 lg:grid-cols-[340px_1fr_auto]" style={{ borderRadius: 8 }}>
            <MomentCandidatePreview candidate={candidate} />
            <div>
              <div className="flex items-center gap-3">
                <img src={creator?.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover object-top" />
                <div>
                  <h3 className="m-0 text-xl font-extrabold">{candidate.title}</h3>
                  <p className="m-0 mt-1 text-sm font-semibold text-white/48">{creator?.display_name} · {candidate.source_credit}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Score" value={formatReadyClipScore(candidate.score)} />
                <Metric label="Rarity" value={candidate.suggested_rarity} />
                <Metric label="Rights" value={candidate.rights_status} />
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/54">{candidate.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase text-white/48" style={{ letterSpacing: '0.1em' }}>
                {Object.entries(candidate.score_breakdown_json).map(([key, value]) => (
                  <span key={key} className="border border-white/12 bg-white/5 px-3 py-2" style={{ borderRadius: 999 }}>
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-row gap-2 lg:flex-col">
              <button className="h-11 border border-[#8cff2f]/55 px-4 text-xs font-black uppercase text-white" style={{ borderRadius: 8 }} onClick={() => setStatus(candidate, 'approved')}>
                <Check size={15} /> Approve
              </button>
              <button className="h-11 border border-[#ff5f7a]/55 px-4 text-xs font-black uppercase text-white" style={{ borderRadius: 8 }} onClick={() => setStatus(candidate, 'rejected')}>
                <X size={15} /> Reject
              </button>
              <button className="h-11 border border-[#54b9ff] bg-[#54b9ff] px-4 text-xs font-black uppercase text-black" style={{ borderRadius: 8 }} onClick={() => publish(candidate)}>
                Create card
              </button>
            </div>
          </div>
        ))}
        {enriched.length === 0 ? <EmptyState label="No candidates yet. Import clips from a creator first." /> : null}
      </div>
    </section>
  );
}

function MomentCandidatePreview({ candidate }: { candidate: MomentCandidate }) {
  return (
    <div className="relative min-h-[220px] overflow-hidden border border-white/12 bg-black" style={{ borderRadius: 8 }}>
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(circle at 28% 28%, rgba(84,185,255,0.62), transparent 28%), radial-gradient(circle at 76% 64%, rgba(255,122,184,0.38), transparent 25%), linear-gradient(135deg, #030713 0%, #07192d 52%, #050506 100%)',
        }}
      />
      <div className="absolute inset-5 border border-[#54b9ff]/55" style={{ borderRadius: 8 }} />
      <div className="absolute left-5 top-5 border border-white/18 bg-black/38 px-3 py-2 text-[11px] font-black uppercase text-white" style={{ borderRadius: 999 }}>
        {candidate.embed_url ? 'Official embed' : candidate.preview_storage_path ? 'Authorized local preview' : 'Image only'}
      </div>
      <div className="absolute inset-x-5 bottom-5">
        <p className="m-0 text-sm font-semibold text-white/54">Source credit visible:</p>
        <p className="m-0 mt-1 text-lg font-extrabold text-white">{candidate.source_credit}</p>
      </div>
    </div>
  );
}

export function PublishedMomentCardsStrip({ trackRef }: { trackRef?: RefObject<HTMLDivElement | null> }) {
  const [cards, setCards] = useState(() => getPublishedMomentCards());

  useEffect(() => {
    findReadyInvestorClips().then((clips) => {
      if (clips.length === 0) return;
      const readyCardsAreCurrent = clips.every((clip) =>
        cards.some((card) => {
          const videoUrl = card.video_url ?? card.display_asset_url;
          return (
            videoUrl === clip.video_url &&
            card.title === clip.title &&
            card.creator_display_name === clip.creatorName &&
            card.creator_avatar_url === clip.creatorAvatarUrl
          );
        }),
      );
      if (readyCardsAreCurrent) return;
      const next = loadReadyClipsIntoState(clips);
      setCards(getPublishedMomentCards(next.state));
    });
  }, [cards]);

  const hasReadyLocalCards = cards.some((card) => card.content_origin === 'investor_demo' && card.display_type === 'local_video');
  const visibleCards = hasReadyLocalCards
    ? cards.filter((card) => card.content_origin === 'investor_demo' && card.display_type === 'local_video')
    : cards;

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div
        ref={trackRef}
        className="moments-scroll -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-5 sm:-mx-8 sm:gap-6 sm:px-8"
      >
        {visibleCards.map((card) => (
          <PublishedMomentCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

const getPlatformAccent = (platform: CreatorPlatform) => {
  if (platform === 'twitch') return '#9146ff';
  if (platform === 'youtube') return '#ff4d4d';
  return '#8cff2f';
};

const formatDuration = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return '';
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = String(rounded % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const stopOtherMomentVideos = (activeVideo: HTMLVideoElement) => {
  document.querySelectorAll<HTMLVideoElement>('#moments article video').forEach((video) => {
    if (video === activeVideo) return;
    video.pause();
    video.muted = true;
    video.currentTime = 0;
    video.dispatchEvent(new Event('ggbox:moment-preview-stop'));
  });
};

function PublishedMomentCard({ card }: { card: MomentCard }) {
  const accent = card.content_origin === 'investor_demo' ? '#54b9ff' : getPlatformAccent(card.platform);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoTimeLabel, setVideoTimeLabel] = useState('--:--');
  const previewAreaRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewFrameRef = useRef<number | null>(null);
  const isPreviewingRef = useRef(false);
  const unmuteTimeoutRef = useRef<number | null>(null);
  const replayTimeoutRef = useRef<number | null>(null);
  const boundsWatcherRef = useRef<((event: MouseEvent) => void) | null>(null);
  const actionLabel = card.embed_url ? 'View Moment' : card.content_origin === 'demo' ? 'View Moment' : 'Open Source';
  const videoUrl = card.video_url ?? card.display_asset_url;
  const viewUrl = premiumVideoUrl(card, videoUrl) ?? card.embed_url ?? card.source_url ?? card.display_asset_url ?? '#';
  const purchaseUrl = card.content_origin === 'investor_demo' ? `/market/moment/${encodeURIComponent(card.id)}` : viewUrl;
  const platformLabel = card.platform === 'local_demo' ? 'LOCAL' : card.platform.toUpperCase();
  const creatorLinkLabel = card.creator_url ? card.creator_url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
  const category = card.category ?? (card.content_origin === 'investor_demo' ? 'Just Chatting' : undefined);
  const premium = card.content_origin === 'investor_demo';
  const showRarity = card.rarity === 'Legendary';
  const openPurchaseUrl = () => {
    if (card.content_origin === 'investor_demo') {
      window.location.href = purchaseUrl;
      return;
    }

    window.open(purchaseUrl, '_blank', 'noreferrer');
  };
  const shouldSkipCardNavigation = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('a,button'));
  const handleCardClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (shouldSkipCardNavigation(event.target)) {
      return;
    }

    openPurchaseUrl();
  };
  const handleCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openPurchaseUrl();
  };
  const updateVideoTimeLabel = (video: HTMLVideoElement) => {
    if (!video.duration || !Number.isFinite(video.duration)) {
      setVideoTimeLabel('--:--');
      return;
    }

    const remaining = Math.max(0, video.duration - video.currentTime);
    setVideoTimeLabel(formatDuration(remaining));
  };
  const stopTimerLoop = () => {
    if (previewFrameRef.current === null) return;
    window.clearInterval(previewFrameRef.current);
    previewFrameRef.current = null;
  };
  const clearPreviewTimeouts = () => {
    if (unmuteTimeoutRef.current !== null) {
      window.clearTimeout(unmuteTimeoutRef.current);
      unmuteTimeoutRef.current = null;
    }
    if (replayTimeoutRef.current !== null) {
      window.clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
  };
  const rememberVideoTime = (video: HTMLVideoElement) => {
    updateVideoTimeLabel(video);
  };
  const stopBoundsWatcher = () => {
    if (!boundsWatcherRef.current) return;
    window.removeEventListener('pointermove', boundsWatcherRef.current);
    window.removeEventListener('mousemove', boundsWatcherRef.current);
    boundsWatcherRef.current = null;
  };
  const startBoundsWatcher = () => {
    stopBoundsWatcher();
    const handleMove = (event: MouseEvent) => {
      const area = previewAreaRef.current;
      if (!area) return;

      const rect = area.getBoundingClientRect();
      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (outside) {
        stopPreview();
      }
    };

    boundsWatcherRef.current = handleMove;
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('mousemove', handleMove);
  };
  const startTimerLoop = () => {
    stopTimerLoop();
    const tick = () => {
      const video = videoRef.current;
      if (!video) return;
      const area = previewAreaRef.current;

      if (isPreviewingRef.current && area && !area.matches(':hover')) {
        stopPreview();
        return;
      }

      rememberVideoTime(video);
    };
    tick();
    previewFrameRef.current = window.setInterval(tick, 120);
  };
  const startPreview = () => {
    const video = videoRef.current;
    if (!video || isPreviewingRef.current) return;
    isPreviewingRef.current = true;
    stopOtherMomentVideos(video);
    if (video.ended || video.currentTime > 0) {
      video.currentTime = 0;
    }
    video.volume = 0.82;
    video.muted = true;
    clearPreviewTimeouts();
    startBoundsWatcher();
    startTimerLoop();
    void video
      .play()
      .then(() => {
        unmuteTimeoutRef.current = window.setTimeout(() => {
          if (videoRef.current === video) {
            video.muted = false;
            void video.play().catch(() => {
              video.muted = true;
              void video.play().catch(() => undefined);
            });
          }
          unmuteTimeoutRef.current = null;
        }, 80);
        replayTimeoutRef.current = window.setTimeout(() => {
          if (videoRef.current === video && video.paused) {
            video.muted = true;
            void video.play().catch(() => undefined);
          }
          replayTimeoutRef.current = null;
        }, 260);
      })
      .catch(() => {
        video.muted = true;
        void video.play().catch(() => undefined);
      });
  };
  const stopPreview = () => {
    const video = videoRef.current;
    if (!isPreviewingRef.current && video?.paused) return;
    isPreviewingRef.current = false;
    clearPreviewTimeouts();
    stopBoundsWatcher();
    stopTimerLoop();
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.muted = true;
    updateVideoTimeLabel(video);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return () => {
        clearPreviewTimeouts();
        stopTimerLoop();
      };
    }

    const handleExternalStop = () => stopPreview();
    video.addEventListener('ggbox:moment-preview-stop', handleExternalStop);

    return () => {
      video.removeEventListener('ggbox:moment-preview-stop', handleExternalStop);
      clearPreviewTimeouts();
      stopBoundsWatcher();
      stopTimerLoop();
    };
  }, []);

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open ${card.title}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group relative min-w-[300px] snap-start cursor-pointer overflow-hidden bg-black/46 p-4 shadow-[inset_0_0_0_1px_rgba(84,185,255,0.20),0_20px_70px_rgba(0,0,0,0.30)] outline-none transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(84,185,255,0.42),0_24px_80px_rgba(0,0,0,0.36)] focus-visible:-translate-y-1 focus-visible:shadow-[inset_0_0_0_1px_rgba(84,185,255,0.48),0_24px_80px_rgba(0,0,0,0.36)] sm:min-w-[390px] xl:min-w-[410px]"
      style={{
        borderRadius: 8,
        background: premium
          ? 'linear-gradient(180deg, rgba(9,18,34,0.96) 0%, rgba(4,5,9,0.98) 58%, rgba(8,4,16,0.98) 100%)'
          : undefined,
        boxShadow: premium
          ? `0 0 0 1px ${accent}22, 0 26px 95px rgba(0,0,0,0.44), 0 0 38px ${accent}14`
          : undefined,
      }}
    >
      {premium ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'linear-gradient(135deg, rgba(84,185,255,0.13), transparent 34%), radial-gradient(circle at 88% 8%, rgba(145,70,255,0.24), transparent 28%)',
          }}
        />
      ) : null}
      <div
        ref={previewAreaRef}
        className="relative mb-4 aspect-video overflow-hidden bg-black transition-[box-shadow] duration-300 group-hover:shadow-[0_0_42px_rgba(84,185,255,0.18)]"
        onMouseEnter={startPreview}
        onPointerEnter={startPreview}
        onMouseLeave={stopPreview}
        onPointerLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
        style={{ borderRadius: 8 }}
      >
        {card.display_type === 'local_video' && videoUrl && !videoFailed ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={card.thumbnail_url}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            playsInline
            muted
            loop={false}
            preload="auto"
            onLoadedMetadata={(event) => {
              updateVideoTimeLabel(event.currentTarget);
            }}
            onTimeUpdate={(event) => rememberVideoTime(event.currentTarget)}
            onError={() => setVideoFailed(true)}
          />
        ) : card.display_type === 'local_video' && videoUrl && videoFailed ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center"
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(84,185,255,0.34), transparent 30%), linear-gradient(135deg, #05070d 0%, #120719 100%)',
            }}
          >
            <div className="text-sm font-black uppercase text-white" style={{ letterSpacing: '0.12em' }}>
              Video preview unavailable
            </div>
            <div className="max-w-full truncate text-xs font-semibold text-white/48">{videoUrl}</div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center border border-[#54b9ff] bg-[#54b9ff]/18 px-4 text-xs font-black uppercase text-white no-underline"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
            >
              Open source clip
            </a>
          </div>
        ) : card.thumbnail_url ? (
          <img src={card.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 24% 24%, rgba(84,185,255,0.72), transparent 26%), radial-gradient(circle at 78% 62%, rgba(140,255,47,0.32), transparent 24%), linear-gradient(135deg, #02050c 0%, #06192a 100%)',
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/8 opacity-70 transition-opacity duration-300 group-hover:opacity-35" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: `inset 0 0 54px ${accent}24` }} />
        {videoTimeLabel ? (
          <div
            data-moment-timer="true"
            className="pointer-events-none absolute bottom-3 right-3 min-w-14 border border-white/18 bg-black/64 px-3 py-1.5 text-center text-[10px] font-black text-white shadow-[0_0_22px_rgba(0,0,0,0.32)] backdrop-blur"
            style={{ borderRadius: 999, letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}
          >
            {videoTimeLabel}
          </div>
        ) : null}
      </div>
      <div className="relative flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 rounded-full border border-white/18 bg-black/40 p-1" style={{ boxShadow: premium ? `0 0 24px ${accent}33` : undefined }}>
          <img
            src={card.creator_avatar_url}
            alt=""
            className="h-full w-full rounded-full object-cover object-top"
            onError={(event) => {
              event.currentTarget.src = fallbackAvatarUrl;
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 truncate text-base font-extrabold text-white">{card.creator_display_name}</h3>
            <span
              className="inline-flex border bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase text-white/80"
              style={{ borderColor: '#9146ff88', borderRadius: 999, letterSpacing: '0.12em' }}
            >
              {platformLabel}
            </span>
          </div>
          {card.creator_url ? (
            <a href={card.creator_url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-[11px] font-semibold text-[#54b9ff] no-underline">
              {creatorLinkLabel}
            </a>
          ) : null}
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {category ? (
            <span className="inline-flex border border-white/14 px-3 py-1 text-[10px] font-semibold uppercase text-white/72" style={{ borderRadius: 999, letterSpacing: '0.12em' }}>
              {category}
            </span>
          ) : null}
          {showRarity ? (
            <span className="inline-flex border px-3 py-1 text-[10px] font-semibold uppercase" style={{ borderColor: `${accent}88`, color: accent, borderRadius: 999, letterSpacing: '0.12em' }}>
              Legendary
            </span>
          ) : null}
          <span className="inline-flex border border-white/14 px-3 py-1 text-[10px] font-semibold uppercase text-white/68" style={{ borderRadius: 999, letterSpacing: '0.12em' }}>
            Score {formatReadyClipScore(card.score)}
          </span>
        </div>
      </div>
      <h4 className="moment-clamp-2 relative mt-3 text-xl font-extrabold leading-tight text-white">{card.title}</h4>
      <a
        href={purchaseUrl}
        target={card.content_origin === 'investor_demo' ? undefined : '_blank'}
        rel={card.content_origin === 'investor_demo' ? undefined : 'noreferrer'}
        className="mt-4 inline-flex h-11 w-full translate-y-2 items-center justify-center text-xs font-black uppercase text-white opacity-0 no-underline transition-[box-shadow,filter,opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-110"
        style={{ backgroundColor: '#315eff', boxShadow: '0 0 34px rgba(49,94,255,0.42)', borderRadius: 8, letterSpacing: '0.14em' }}
      >
        {card.content_origin === 'investor_demo' ? 'BUY MOMENT' : actionLabel}
      </a>
    </article>
  );
}

const premiumVideoUrl = (card: MomentCard, videoUrl?: string) =>
  card.content_origin === 'investor_demo' && videoUrl ? videoUrl : undefined;

function Badge({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <span
      className="inline-flex border bg-black/62 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur"
      style={{ borderColor: `${accent}99`, borderRadius: 999, letterSpacing: '0.12em' }}
    >
      {children}
    </span>
  );
}

function TextField({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label>
      <span className={labelClass} style={{ letterSpacing: '0.14em' }}>{label}</span>
      <input className={fieldClass} style={{ borderRadius: 8 }} value={value} placeholder={placeholder} required={required} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function SelectField({ label, value, values, labels, onChange }: { label: string; value: string; values: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label>
      <span className={labelClass} style={{ letterSpacing: '0.14em' }}>{label}</span>
      <select className={fieldClass} style={{ borderRadius: 8 }} value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {labels?.[item] ?? item}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className={labelClass} style={{ letterSpacing: '0.14em' }}>{label}</span>
      <input
        className={fieldClass}
        style={{ borderRadius: 8 }}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/12 bg-white/5 p-3" style={{ borderRadius: 8 }}>
      <div className="text-[10px] font-semibold uppercase text-white/42" style={{ letterSpacing: '0.14em' }}>{label}</div>
      <div className="mt-1 text-sm font-extrabold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border border-white/12 bg-black/32 p-6 text-sm font-semibold text-white/52" style={{ borderRadius: 8 }}>
      {label}
    </div>
  );
}

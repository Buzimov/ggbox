import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Brush,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Gem,
  Gamepad2,
  LockKeyhole,
  LogOut,
  Mail,
  Maximize2,
  Minus,
  Music2,
  PackageOpen,
  Pause,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Play,
  Plus,
  Radio,
  Search,
  Share2,
  Store,
  Trophy,
  UserCircle,
  Users,
  Video,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { CreatorMomentImporterApp } from './CreatorMomentImporterAdmin';
import { getPublishedMomentCards, type MomentCard as PublishedMomentCardData } from './creatorMomentImporter';
import { trackEvent } from './analytics';
import {
  addActivity,
  addOwnedMoment,
  cancelOwnedMomentListing,
  consumeFlashMessage,
  decrementOwnedPack,
  getActiveUser,
  getActiveUserListingForMoment,
  getInventory,
  getListingForOwnedMoment,
  getStoredUsers,
  loginUser,
  logoutUser,
  listOwnedMomentForSale,
  purchaseListedMoment,
  registerUser,
  saveInventory,
  setFlashMessage,
  signInWithDemoProvider,
  upsertOwnedPack,
  type AccountInventory,
  type FlashMessageData,
  type OwnedMomentData,
  type OwnedPackData,
  type StoredUser,
} from './accountStore';

type CreatorMomentImporterRoute = Parameters<typeof CreatorMomentImporterApp>[0]['route'];

const IMAGES = [
  {
    src: '/assets/characters/mage-red.png',
    bg: '#9E1F2F',
    panel: '#E3554F',
  },
  {
    src: '/assets/characters/cozy-green.png',
    bg: '#7EA76A',
    panel: '#A7C982',
  },
  {
    src: '/assets/characters/tactical-orange.png',
    bg: '#E46E31',
    panel: '#F19542',
  },
  {
    src: '/assets/characters/creator-cream.png',
    bg: '#C7D876',
    panel: '#E3E7A0',
  },
  {
    src: '/assets/characters/live-purple.png',
    bg: '#5D42D6',
    panel: '#7D5BF0',
  },
  {
    src: '/assets/characters/pink-hype.png',
    bg: '#F27FB1',
    panel: '#F7A7C9',
  },
] as const;

const DROP_PACK_IMAGE = '/assets/drop-pack-counter-strike.png';
const DROP_PACK_IRL_IMAGE = '/assets/drop-pack-irl.png';
const DROP_PACK_DOTA_IMAGE = '/assets/drop-pack-dota.png';
const DROP_PACK_MINECRAFT_IMAGE = '/assets/drop-pack-minecraft.png';
const DROP_PACKS = [
  {
    id: 'counter-strike',
    eyebrow: 'Drop Pack 01',
    titlePrefix: '2026',
    titleMain: 'Counter-Strike',
    titleSuffix: 'Pack',
    image: DROP_PACK_IMAGE,
    moment: '3',
    supply: 50,
    remaining: 34,
    price: 5,
    accent: '#54b9ff',
    button: '#315eff',
    panel: '#041328',
    border: '#2b8cff',
    background:
      'radial-gradient(circle at 28% 42%, rgba(0,112,255,0.38), transparent 34%), radial-gradient(circle at 82% 18%, rgba(28,176,255,0.22), transparent 28%), linear-gradient(180deg, #02050c 0%, #061529 54%, #02050c 100%)',
    grid:
      'linear-gradient(rgba(55,155,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(55,155,255,0.18) 1px, transparent 1px)',
    glow: 'rgba(0,91,255,0.45)',
    imageScale: 1,
    imageShiftY: '0%',
  },
  {
    id: 'irl-moments',
    eyebrow: 'Drop Pack 02',
    titlePrefix: '2026',
    titleMain: 'IRL Moments',
    titleSuffix: 'Pack',
    image: DROP_PACK_IRL_IMAGE,
    moment: '3',
    supply: 50,
    remaining: 29,
    price: 5,
    accent: '#8cff2f',
    button: '#54c821',
    panel: '#0a1f11',
    border: '#78e936',
    background:
      'radial-gradient(circle at 24% 46%, rgba(83,255,47,0.28), transparent 32%), radial-gradient(circle at 82% 16%, rgba(186,255,99,0.18), transparent 28%), linear-gradient(180deg, #030805 0%, #0b2112 52%, #020503 100%)',
    grid:
      'linear-gradient(rgba(147,255,87,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(126,255,47,0.18) 1px, transparent 1px)',
    glow: 'rgba(126,255,47,0.42)',
    imageScale: 0.965,
    imageShiftY: '-1.75%',
  },
  {
    id: 'dota-2',
    eyebrow: 'Drop Pack 03',
    titlePrefix: '2026',
    titleMain: 'DOTA 2',
    titleSuffix: 'Pack',
    image: DROP_PACK_DOTA_IMAGE,
    moment: '3',
    supply: 50,
    remaining: 21,
    price: 5,
    accent: '#ff6b1a',
    button: '#f05a1d',
    panel: '#240d04',
    border: '#ff5f1e',
    background:
      'radial-gradient(circle at 28% 46%, rgba(255,92,0,0.34), transparent 34%), radial-gradient(circle at 80% 18%, rgba(255,169,55,0.18), transparent 28%), linear-gradient(180deg, #0b0402 0%, #2a0e03 54%, #060201 100%)',
    grid:
      'linear-gradient(rgba(255,116,42,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,91,18,0.2) 1px, transparent 1px)',
    glow: 'rgba(255,91,18,0.5)',
    imageScale: 0.985,
    imageShiftY: '-0.8%',
  },
  {
    id: 'minecraft',
    eyebrow: 'Drop Pack 04',
    titlePrefix: '2026',
    titleMain: 'Minecraft',
    titleSuffix: 'Pack',
    image: DROP_PACK_MINECRAFT_IMAGE,
    moment: '3',
    supply: 50,
    remaining: 47,
    price: 5,
    accent: '#32dfff',
    button: '#18bce0',
    panel: '#031920',
    border: '#28d4f2',
    background:
      'radial-gradient(circle at 28% 46%, rgba(0,210,255,0.34), transparent 34%), radial-gradient(circle at 82% 18%, rgba(83,255,224,0.16), transparent 28%), linear-gradient(180deg, #010709 0%, #08212a 54%, #020506 100%)',
    grid:
      'linear-gradient(rgba(77,225,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(37,211,255,0.2) 1px, transparent 1px)',
    glow: 'rgba(37,211,255,0.5)',
    imageScale: 1.003,
    imageShiftY: '-0.25%',
  },
] as const;

type DropPack = (typeof DROP_PACKS)[number];
type PackMoment = {
  id: string;
  creator: string;
  handle: string;
  avatar: string;
  twitchUrl: string;
  title: string;
  category: string;
  duration: string;
  score: string;
  rarity: 'Legendary' | 'Standard';
  videoUrl: string;
};

const PACK_MOMENTS_BY_ID: Record<DropPack['id'], PackMoment[]> = {
  'counter-strike': [
    {
      id: 'skywhywalker-counter-entry',
      creator: 'Skywhywalker',
      handle: '@skywhywalker',
      avatar: '/streamer-avatars/skywhywalker.png',
      twitchUrl: 'https://www.twitch.tv/skywhywalker',
      title: 'Counter-Strike clutch survives the final angle',
      category: 'Counter-Strike',
      duration: '0:08',
      score: '47 / 50',
      rarity: 'Legendary',
      videoUrl: '/demo-vods/6.mp4',
    },
    {
      id: 'boggles-counter-bonus',
      creator: 'Boggles',
      handle: '@boggles',
      avatar: '/streamer-avatars/boggles.png',
      twitchUrl: 'https://www.twitch.tv/boggles',
      title: 'Fast reaction turns a round into a GGBOX moment',
      category: 'Counter-Strike',
      duration: '0:13',
      score: '45 / 50',
      rarity: 'Standard',
      videoUrl: '/demo-vods/3.mp4',
    },
    {
      id: 'berticuss-counter-pack',
      creator: 'Berticuss',
      handle: '@berticuss',
      avatar: '/streamer-avatars/berticuss.png',
      twitchUrl: 'https://www.twitch.tv/berticuss',
      title: 'A late-round read lands inside the Counter-Strike pack',
      category: 'Counter-Strike',
      duration: '0:09',
      score: '46 / 50',
      rarity: 'Legendary',
      videoUrl: '/demo-vods/2.mp4',
    },
  ],
  'irl-moments': [
    {
      id: 'faith-irl-chat',
      creator: 'Faith',
      handle: '@faith',
      avatar: '/streamer-avatars/faith.png',
      twitchUrl: 'https://www.twitch.tv/faith',
      title: 'Chat locks into a creator highlight moment',
      category: 'IRL',
      duration: '0:08',
      score: '44 / 50',
      rarity: 'Legendary',
      videoUrl: '/demo-vods/1.mp4',
    },
    {
      id: 'berticuss-irl-room',
      creator: 'Berticuss',
      handle: '@berticuss',
      avatar: '/streamer-avatars/berticuss.png',
      twitchUrl: 'https://www.twitch.tv/berticuss',
      title: 'Cozy stream energy becomes a sealed pack moment',
      category: 'IRL',
      duration: '0:09',
      score: '46 / 50',
      rarity: 'Standard',
      videoUrl: '/demo-vods/2.mp4',
    },
    {
      id: 'xrohat-irl-crossover',
      creator: 'Xrohat',
      handle: '@xrohat',
      avatar: '/streamer-avatars/xrohat.png',
      twitchUrl: 'https://www.twitch.tv/xrohat',
      title: 'Live creator crossover',
      category: 'IRL',
      duration: '0:08',
      score: '43 / 50',
      rarity: 'Legendary',
      videoUrl: '/demo-vods/5.mp4',
    },
  ],
  'dota-2': [
    {
      id: 'gunnar-dota-pickoff',
      creator: 'Gunnar',
      handle: '@gunnar',
      avatar: '/streamer-avatars/gunnar.png',
      twitchUrl: 'https://www.twitch.tv/gunnar',
      title: 'Dota 2 timing window turns into a pack highlight',
      category: 'Dota 2',
      duration: '0:10',
      score: '48 / 50',
      rarity: 'Legendary',
      videoUrl: '/demo-vods/4.mp4',
    },
    {
      id: 'skywhywalker-dota-bonus',
      creator: 'Skywhywalker',
      handle: '@skywhywalker',
      avatar: '/streamer-avatars/skywhywalker.png',
      twitchUrl: 'https://www.twitch.tv/skywhywalker',
      title: 'Aim discipline translated into the Dota drop format',
      category: 'Dota 2',
      duration: '0:08',
      score: '47 / 50',
      rarity: 'Standard',
      videoUrl: '/demo-vods/6.mp4',
    },
    {
      id: 'berticuss-dota-pack',
      creator: 'Berticuss',
      handle: '@berticuss',
      avatar: '/streamer-avatars/berticuss.png',
      twitchUrl: 'https://www.twitch.tv/berticuss',
      title: 'Creator highlight adds a rare contrast to the Dota pack',
      category: 'Dota 2',
      duration: '0:09',
      score: '46 / 50',
      rarity: 'Legendary',
      videoUrl: '/demo-vods/2.mp4',
    },
  ],
  minecraft: [
  {
    id: 'boggles-hardcore-run',
    creator: 'Boggles',
    handle: '@boggles',
    avatar: '/streamer-avatars/boggles.png',
    twitchUrl: 'https://www.twitch.tv/boggles',
    title: 'Hardcore survival run reaches the danger zone',
    category: 'Minecraft',
    duration: '0:13',
    score: '45 / 50',
    rarity: 'Legendary',
    videoUrl: '/demo-vods/3.mp4',
  },
  {
    id: 'faith-chat-reacts',
    creator: 'Faith',
    handle: '@faith',
    avatar: '/streamer-avatars/faith.png',
    twitchUrl: 'https://www.twitch.tv/faith',
    title: 'Chat reacts to a cozy Minecraft creator moment',
    category: 'Minecraft',
    duration: '0:08',
    score: '44 / 50',
    rarity: 'Standard',
    videoUrl: '/demo-vods/1.mp4',
  },
  {
    id: 'berticuss-pack-night',
    creator: 'Berticuss',
    handle: '@berticuss',
    avatar: '/streamer-avatars/berticuss.png',
    twitchUrl: 'https://www.twitch.tv/berticuss',
    title: 'Late-night creator highlight enters the Minecraft pack',
    category: 'Minecraft',
    duration: '0:09',
    score: '46 / 50',
    rarity: 'Legendary',
    videoUrl: '/demo-vods/2.mp4',
  },
  ],
};

const MINECRAFT_PACK = DROP_PACKS.find((pack) => pack.id === 'minecraft') ?? DROP_PACKS[3];

function getPackCreators(packMoments: PackMoment[]) {
  return packMoments.map((moment) => ({
    creator: moment.creator,
    handle: moment.handle,
    avatar: moment.avatar,
    twitchUrl: moment.twitchUrl,
    moments: packMoments.filter((item) => item.creator === moment.creator).length,
  })).filter((creator, index, creators) => creators.findIndex((item) => item.creator === creator.creator) === index);
}

const normalizeMomentText = (value?: string) => value?.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '') ?? '';

function formatPackMomentScore(score: number) {
  const normalizedScore = score > 50 ? Math.round(score / 2) : Math.round(score);
  return String(Math.max(0, Math.min(50, normalizedScore)));
}

function getCardDurationLabel(card: PublishedMomentCardData, fallback: PackMoment) {
  if (card.duration_label && /\d+:\d{2}/.test(card.duration_label)) {
    return card.duration_label;
  }

  return fallback.duration;
}

function getPublishedCardForPackMoment(
  fallback: PackMoment,
  cards: PublishedMomentCardData[],
  usedCardIds: Set<string>,
) {
  const fallbackHandle = normalizeMomentText(fallback.handle);
  const fallbackCreator = normalizeMomentText(fallback.creator);
  const fallbackVideo = fallback.videoUrl;

  return cards.find((card) => {
    if (usedCardIds.has(card.id)) {
      return false;
    }

    const cardHandle = normalizeMomentText(card.creator_handle);
    const cardCreator = normalizeMomentText(card.creator_display_name);
    const cardVideo = card.video_url ?? card.display_asset_url;

    return (
      (fallbackVideo && cardVideo === fallbackVideo) ||
      (fallbackHandle && cardHandle === fallbackHandle) ||
      (fallbackCreator && cardCreator === fallbackCreator)
    );
  });
}

function getResolvedPackMoments(pack: DropPack) {
  const publishedCards = getPublishedMomentCards();
  const usedCardIds = new Set<string>();

  return PACK_MOMENTS_BY_ID[pack.id].map((fallback) => {
    const card = getPublishedCardForPackMoment(fallback, publishedCards, usedCardIds);

    if (!card) {
      return fallback;
    }

    usedCardIds.add(card.id);

    return {
      ...fallback,
      id: card.id,
      creator: card.creator_display_name,
      handle: card.creator_handle ?? fallback.handle,
      avatar: card.creator_avatar_url,
      twitchUrl: card.creator_url ?? fallback.twitchUrl,
      title: card.title,
      category: card.category ?? fallback.category,
      duration: getCardDurationLabel(card, fallback),
      score: `${formatPackMomentScore(card.score)} / 50`,
      rarity: card.rarity === 'Legendary' ? 'Legendary' : 'Standard',
      videoUrl: card.video_url ?? card.display_asset_url ?? fallback.videoUrl,
    } satisfies PackMoment;
  });
}

function getPackIdFromPath(pathname: string): DropPack['id'] | null {
  const match = pathname.match(/^\/pack\/([^/]+)$/);
  const packId = match?.[1];

  if (!packId) {
    return null;
  }

  return DROP_PACKS.some((pack) => pack.id === packId) ? (packId as DropPack['id']) : null;
}

type Direction = 'next' | 'prev';
type Role = 'center' | 'left' | 'right' | 'backLeft' | 'backRight' | 'farBack';
type TextKey = 'brand' | 'ghost' | 'headline' | 'cta';

const EASE = 'cubic-bezier(0.4,0,0.2,1)';
const DURATION_MS = 650;
const TEXT_STORAGE_KEY = 'ggbox.heroText';
const BUY_BUTTON_BACKGROUND = '#315eff';
const BUY_BUTTON_BORDER = '#54b9ff';
const BUY_BUTTON_SHADOW = '0 0 34px rgba(49,94,255,0.42)';
const DEFAULT_TEXT: Record<TextKey, string> = {
  brand: 'GGBOX',
  ghost: 'GGBOX',
  headline: 'DIGITAL MOMENTS',
  cta: 'OPEN PACKS',
};
const CATEGORIES = [
  { label: 'Games', icon: Gamepad2 },
  { label: 'IRL', icon: Camera },
  { label: 'Music & DJ', icon: Music2 },
  { label: 'Creative', icon: Brush },
  { label: 'Esports', icon: Trophy },
] as const;

type Moment = {
  id: string;
  marketMomentId: string;
  creator: string;
  handle: string;
  category: string;
  title: string;
  rarity?: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  serial: string;
  duration: string;
  avatar: string;
  accent: string;
  panel: string;
  scene: string;
  frame: string;
  videoSrc?: string;
};

const MOMENTS: Moment[] = [
  {
    id: 'gta-v-rooftop',
    marketMomentId: 'xrohat-irl-crossover',
    creator: 'Nikita Rush',
    handle: '@rushlive',
    category: 'Games: GTA V',
    title: 'Rooftop escape into a perfect police dodge',
    rarity: 'Legendary',
    serial: '#12',
    duration: '0:08',
    avatar: IMAGES[2].src,
    accent: '#56b7ff',
    panel: '#17072c',
    scene:
      'radial-gradient(circle at 22% 18%, rgba(86,183,255,0.95), transparent 20%), radial-gradient(circle at 70% 36%, rgba(255,69,108,0.75), transparent 24%), linear-gradient(135deg, #030713 0%, #0c1e4c 48%, #301044 100%)',
    frame: 'linear-gradient(135deg, rgba(86,183,255,0.98), rgba(255,70,120,0.72))',
  },
  {
    id: 'cs2-clutch',
    marketMomentId: 'skywhywalker-counter-entry',
    creator: 'Max Kirov',
    handle: '@kirovfps',
    category: 'Games: Counter-Strike 2',
    title: 'One HP retake with a final smoke read',
    serial: '#07',
    duration: '0:09',
    avatar: IMAGES[0].src,
    accent: '#2bdcff',
    panel: '#041625',
    scene:
      'radial-gradient(circle at 62% 24%, rgba(43,220,255,0.88), transparent 22%), radial-gradient(circle at 24% 72%, rgba(31,92,255,0.74), transparent 25%), linear-gradient(135deg, #010913 0%, #06233a 52%, #02060d 100%)',
    frame: 'linear-gradient(135deg, rgba(43,220,255,0.95), rgba(48,95,255,0.8))',
  },
  {
    id: 'irl-night-market',
    marketMomentId: 'faith-irl-chat',
    creator: 'Alina Frame',
    handle: '@alinaframe',
    category: 'IRL: Night Market',
    title: 'Street-camera pass through neon rain',
    serial: '#31',
    duration: '0:06',
    avatar: IMAGES[3].src,
    accent: '#8cff2f',
    panel: '#081b10',
    scene:
      'radial-gradient(circle at 28% 28%, rgba(140,255,47,0.85), transparent 20%), radial-gradient(circle at 76% 60%, rgba(255,225,81,0.68), transparent 24%), linear-gradient(135deg, #031108 0%, #173814 48%, #050904 100%)',
    frame: 'linear-gradient(135deg, rgba(140,255,47,0.95), rgba(255,221,74,0.78))',
  },
  {
    id: 'dota-rampage',
    marketMomentId: 'gunnar-dota-pickoff',
    creator: 'Dani Core',
    handle: '@danicore',
    category: 'Games: DOTA 2',
    title: 'Roshan pit turn into a full rampage',
    rarity: 'Legendary',
    serial: '#18',
    duration: '0:10',
    avatar: IMAGES[1].src,
    accent: '#ff6b1a',
    panel: '#260b03',
    scene:
      'radial-gradient(circle at 50% 36%, rgba(255,107,26,0.92), transparent 24%), radial-gradient(circle at 22% 72%, rgba(255,202,74,0.64), transparent 24%), linear-gradient(135deg, #120401 0%, #3b1002 50%, #090201 100%)',
    frame: 'linear-gradient(135deg, rgba(255,107,26,0.98), rgba(255,198,82,0.72))',
  },
  {
    id: 'minecraft-mega-build',
    marketMomentId: 'boggles-hardcore-run',
    creator: 'Mira Blocks',
    handle: '@mirablocks',
    category: 'Games: Minecraft',
    title: 'Mega build reveal from bedrock to skyline',
    serial: '#44',
    duration: '0:07',
    avatar: IMAGES[4].src,
    accent: '#32dfff',
    panel: '#031920',
    scene:
      'radial-gradient(circle at 30% 34%, rgba(50,223,255,0.86), transparent 22%), radial-gradient(circle at 78% 66%, rgba(79,255,189,0.58), transparent 23%), linear-gradient(135deg, #021013 0%, #073345 50%, #020607 100%)',
    frame: 'linear-gradient(135deg, rgba(50,223,255,0.95), rgba(82,255,190,0.7))',
  },
  {
    id: 'dj-drop',
    marketMomentId: 'berticuss-irl-room',
    creator: 'Vera Pulse',
    handle: '@verapulse',
    category: 'Music & DJ: Live Set',
    title: 'Bass drop synced with the stage blackout',
    serial: '#25',
    duration: '0:08',
    avatar: IMAGES[5].src,
    accent: '#ff7ab8',
    panel: '#26071a',
    scene:
      'radial-gradient(circle at 26% 28%, rgba(255,122,184,0.9), transparent 22%), radial-gradient(circle at 70% 62%, rgba(93,66,214,0.82), transparent 26%), linear-gradient(135deg, #120511 0%, #35103d 48%, #09030c 100%)',
    frame: 'linear-gradient(135deg, rgba(255,122,184,0.95), rgba(118,83,255,0.75))',
  },
];

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Drops', href: '#drop-pack' },
      { label: 'Market', href: '/market' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Discord', href: '#discord' },
      { label: 'Telegram', href: '#telegram' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '/support' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of use', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
] as const;
const grainSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E\")";

function AppAmbientBackdrop({ accent = '#54b9ff' }: { accent?: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            `linear-gradient(128deg, ${accent}24 0%, transparent 34%), linear-gradient(58deg, transparent 0%, rgba(140,255,47,0.10) 42%, transparent 74%), linear-gradient(180deg, #03070b 0%, #081018 46%, #020304 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: grainSvg,
          backgroundSize: '200px 200px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[58vh] opacity-55"
        style={{
          background:
            'linear-gradient(105deg, rgba(255,255,255,0.075), transparent 28%, rgba(255,255,255,0.035) 52%, transparent 78%)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />
    </>
  );
}

function ToonhubHero() {
  const activeUser = getActiveUser();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingKey, setEditingKey] = useState<TextKey | null>(null);
  const [texts, setTexts] = useState(DEFAULT_TEXT);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < 640,
  );
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    IMAGES.forEach(({ src }) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TEXT_STORAGE_KEY);
      if (saved) {
        setTexts({ ...DEFAULT_TEXT, ...JSON.parse(saved) });
      }
    } catch {
      setTexts(DEFAULT_TEXT);
    }
  }, []);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 640);

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const roles = useMemo(
    () => ({
      center: activeIndex,
      left: (activeIndex + IMAGES.length - 1) % IMAGES.length,
      right: (activeIndex + 1) % IMAGES.length,
      backLeft: (activeIndex + IMAGES.length - 2) % IMAGES.length,
      backRight: (activeIndex + 2) % IMAGES.length,
      farBack: (activeIndex + 3) % IMAGES.length,
    }),
    [activeIndex],
  );

  const navigate = useCallback(
    (direction: Direction) => {
      if (isAnimating) {
        return;
      }

      setIsAnimating(true);
      setActiveIndex((previous) =>
        direction === 'next'
          ? (previous + 1) % IMAGES.length
          : (previous + IMAGES.length - 1) % IMAGES.length,
      );

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
        timeoutRef.current = null;
      }, DURATION_MS);
    },
    [isAnimating],
  );

  const getRole = (index: number): Role => {
    if (index === roles.center) return 'center';
    if (index === roles.left) return 'left';
    if (index === roles.right) return 'right';
    if (index === roles.backLeft) return 'backLeft';
    if (index === roles.backRight) return 'backRight';
    return 'farBack';
  };

  const getItemStyle = (role: Role): CSSProperties => {
    const shared: CSSProperties = {
      position: 'absolute',
      aspectRatio: '0.6 / 1',
      transformOrigin: 'bottom center',
      transition: `transform ${DURATION_MS}ms ${EASE}, filter ${DURATION_MS}ms ${EASE}, opacity ${DURATION_MS}ms ${EASE}, left ${DURATION_MS}ms ${EASE}`,
      willChange: 'transform, filter, opacity',
    };

    if (role === 'center') {
      return {
        ...shared,
        transform: `translateX(-50%) scale(${isMobile ? 1.18 : 1.42})`,
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? '54svh' : '72svh',
        maxWidth: isMobile ? '84vw' : '50vw',
        bottom: isMobile ? '23%' : '4%',
      };
    }

    if (role === 'left') {
      return {
        ...shared,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '20%' : '30%',
        height: isMobile ? '17svh' : '28svh',
        maxWidth: isMobile ? '28vw' : '22vw',
        bottom: isMobile ? '34%' : '13%',
      };
    }

    if (role === 'right') {
      return {
        ...shared,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '80%' : '70%',
        height: isMobile ? '17svh' : '28svh',
        maxWidth: isMobile ? '28vw' : '22vw',
        bottom: isMobile ? '34%' : '13%',
      };
    }

    if (role === 'backLeft') {
      return {
        ...shared,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 0.72,
        zIndex: 5,
        left: isMobile ? '40%' : '43%',
        height: isMobile ? '13svh' : '21svh',
        maxWidth: isMobile ? '24vw' : '18vw',
        bottom: isMobile ? '36%' : '15%',
      };
    }

    if (role === 'backRight') {
      return {
        ...shared,
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 0.72,
        zIndex: 5,
        left: isMobile ? '60%' : '57%',
        height: isMobile ? '13svh' : '21svh',
        maxWidth: isMobile ? '24vw' : '18vw',
        bottom: isMobile ? '36%' : '15%',
      };
    }

    return {
      ...shared,
      transform: 'translateX(-50%) scale(1)',
      filter: 'blur(5px)',
      opacity: 0.5,
      zIndex: 4,
      left: '50%',
      height: isMobile ? '11svh' : '18svh',
      maxWidth: isMobile ? '20vw' : '15vw',
      bottom: isMobile ? '38%' : '17%',
    };
  };

  const updateText = (key: TextKey, value: string) => {
    const next = { ...texts, [key]: value };
    setTexts(next);
    window.localStorage.setItem(TEXT_STORAGE_KEY, JSON.stringify(next));
  };

  const resetText = () => {
    setTexts(DEFAULT_TEXT);
    setEditingKey(null);
    window.localStorage.removeItem(TEXT_STORAGE_KEY);
  };

  const editableStyle = (extra?: CSSProperties): CSSProperties => ({
    ...extra,
    outline: editMode ? '1px dashed rgba(255,255,255,0.68)' : 'none',
    outlineOffset: editMode ? '6px' : 0,
    cursor: editMode ? 'text' : 'inherit',
  });

  const editableInputStyle = (extra?: CSSProperties): CSSProperties => ({
    ...extra,
    width: '100%',
    maxWidth: 'min(86vw, 760px)',
    border: '1px solid rgba(255,255,255,0.72)',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.32)',
    color: 'white',
    padding: '4px 8px',
    outline: 'none',
  });

  const renderEditableText = (key: TextKey, className: string, style: CSSProperties) => {
    if (editingKey === key) {
      return (
        <input
          autoFocus
          className={className}
          value={texts[key]}
          onChange={(event) => updateText(key, event.currentTarget.value)}
          onBlur={() => setEditingKey(null)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.currentTarget.blur();
            }
          }}
          style={editableInputStyle(style)}
        />
      );
    }

    return (
      <span
        className={className}
        onClick={(event) => {
          if (!editMode) return;
          event.preventDefault();
          event.stopPropagation();
          setEditingKey(key);
        }}
        style={editableStyle(style)}
      >
        {texts[key]}
      </span>
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: `background-color ${DURATION_MS}ms ${EASE}`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="relative w-full overflow-hidden" style={{ height: '100svh' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            backgroundImage: grainSvg,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
            opacity: 0.4,
          }}
        />

        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{
            zIndex: 2,
            top: isMobile ? '18%' : '12%',
            fontFamily: "'Anton', sans-serif",
            fontSize: isMobile ? 'clamp(68px, 20vw, 84px)' : 'clamp(112px, 22vw, 300px)',
            fontWeight: 900,
            color: 'white',
            opacity: 0.92,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '0',
            whiteSpace: 'nowrap',
            pointerEvents: editMode ? 'auto' : 'none',
          }}
        >
          {renderEditableText('ghost', '', {
            fontFamily: "'Anton', sans-serif",
            fontSize: isMobile ? 'clamp(68px, 20vw, 84px)' : 'clamp(112px, 22vw, 300px)',
            fontWeight: 900,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '0',
            whiteSpace: 'nowrap',
          })}
        </div>

        <header className="absolute left-4 right-4 top-5 flex h-11 items-center justify-between sm:left-8 sm:right-8" style={{ zIndex: 60 }}>
          <a
            href="/"
            className="flex h-11 items-center text-xs font-semibold uppercase text-white"
            style={{ opacity: 0.9, letterSpacing: '0.18em', textDecoration: 'none' }}
            onClick={(event) => {
              if (!editMode) {
                return;
              }

              event.preventDefault();
            }}
          >
            {renderEditableText('brand', '', { letterSpacing: '0.18em' })}
          </a>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 top-0 flex h-11 -translate-x-1/2 items-center gap-8 text-xs font-semibold uppercase text-white sm:gap-11"
            style={{ letterSpacing: '0.18em' }}
          >
            <a
              href="#drop-pack"
              className="relative leading-none text-white no-underline drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)] transition-opacity after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:opacity-80 hover:after:w-full"
            >
              Drops
            </a>
            <a
              href="/market"
              className="relative leading-none text-white/72 no-underline drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)] transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:text-white hover:after:w-full"
            >
              Market
            </a>
          </nav>

          <a
            href={activeUser ? '/account' : '/login'}
            className="flex h-11 items-center gap-2 px-1 text-[10px] font-black uppercase text-white no-underline drop-shadow-[0_2px_12px_rgba(0,0,0,0.26)] transition-opacity hover:opacity-78"
            style={{ letterSpacing: '0.12em' }}
          >
            {activeUser ? <img src={activeUser.avatar} alt="Account" className="h-8 w-8 rounded-full object-cover" /> : <UserCircle size={17} />}
            {!activeUser ? <span className="hidden sm:inline">Sign In</span> : null}
          </a>
        </header>

        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {IMAGES.map((image, index) => {
            const role = getRole(index);

            return (
              <div key={image.src} style={getItemStyle(role)}>
                <img
                  src={image.src}
                  alt=""
                  className="h-full w-full"
                  draggable={false}
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'bottom center',
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          className="absolute bottom-6 left-4 w-[calc(100vw-2rem)] max-w-[390px] text-left sm:bottom-20 sm:left-24 sm:w-[460px] sm:max-w-[460px]"
          style={{ zIndex: 70 }}
        >
          <p
            className="mb-5 text-[28px] font-black uppercase text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.22)] sm:mb-6 sm:text-[44px]"
            style={{ opacity: 0.96, letterSpacing: '0', lineHeight: 1.04 }}
          >
            {renderEditableText('headline', '', { letterSpacing: '0', lineHeight: 1.04 })}
          </p>
          <div className="mb-5 flex max-w-[360px] flex-wrap gap-2 sm:mb-6 sm:max-w-[420px]">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;

              return (
                <div
                  key={category.label}
                  className="flex h-8 items-center gap-2 rounded-full border border-white/30 bg-black/18 px-3 text-[11px] font-bold uppercase text-white backdrop-blur-sm sm:h-9 sm:text-xs"
                  style={{ letterSpacing: '0.08em' }}
                >
                  <Icon size={14} strokeWidth={2.4} />
                  <span>{category.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Previous drop"
              onClick={() => navigate('prev')}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-[transform,background-color] duration-150 hover:scale-[1.08] hover:bg-[rgba(255,255,255,0.12)] sm:h-16 sm:w-16"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Next drop"
              onClick={() => navigate('next')}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-[transform,background-color] duration-150 hover:scale-[1.08] hover:bg-[rgba(255,255,255,0.12)] sm:h-16 sm:w-16"
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <a
          href="#drop-pack"
          className="absolute bottom-6 right-4 hidden items-center gap-2 uppercase text-white opacity-[0.95] no-underline transition-opacity duration-200 hover:opacity-100 sm:bottom-20 sm:right-10 sm:flex sm:gap-3"
          style={{
            zIndex: 60,
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(20px, 3.8vw, 54px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            alignItems: 'center',
          }}
        >
          {renderEditableText('cta', '', {
            fontFamily: "'Anton', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
          })}
          <ArrowRight className="h-5 w-5 sm:h-8 sm:w-8" strokeWidth={2.25} />
        </a>
      </div>
    </div>
  );
}

function PackDetailPage({ packId }: { packId: DropPack['id'] }) {
  const [quantity, setQuantity] = useState(1);
  const pack = DROP_PACKS.find((item) => item.id === packId) ?? MINECRAFT_PACK;
  const packMoments = getResolvedPackMoments(pack);
  const packCreators = getPackCreators(packMoments);
  const packDisplayTitle = getPackDisplayTitle(pack);
  const packDescriptionLines = getPackDescriptionLines(pack);
  const packPrice = quantity * pack.price;
  const availability = Math.round((pack.remaining / pack.supply) * 100);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#02070a] px-4 py-6 text-white sm:px-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: pack.background,
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(77,225,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(77,225,255,0.15) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(to bottom, black, black 84%, transparent)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.16) 18px 19px, transparent 19px 44px)',
        }}
      />

      <header className="relative z-10 mx-auto h-6 max-w-[1680px]">
        <a
          href="/"
          className="absolute left-0 top-0 text-xs font-semibold uppercase text-white no-underline transition-opacity hover:opacity-80"
          style={{ letterSpacing: '0.18em' }}
        >
          GGBOX
        </a>
        <nav
          aria-label="Primary"
          className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-8 text-xs font-semibold uppercase text-white sm:gap-11"
          style={{ letterSpacing: '0.18em' }}
        >
          <a href="/#drop-pack" className="relative leading-none text-white no-underline transition-opacity after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:opacity-80 hover:after:w-full">
            Drops
          </a>
          <a
            href="/market"
            className="relative leading-none text-white/72 no-underline transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:text-white hover:after:w-full"
          >
            Market
          </a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1680px] gap-10 pb-16 pt-12 lg:grid-cols-[minmax(300px,0.68fr)_minmax(0,1.32fr)] lg:gap-16 lg:pt-16">
        <div className="relative min-h-[500px] lg:min-h-[700px]">
          <div className="sticky top-8 flex min-h-[500px] items-center justify-center overflow-visible p-2 lg:min-h-[700px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-55"
              style={{
                background:
                  'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.08), transparent 36%)',
              }}
            />
            <div
              className="absolute bottom-12 h-[28%] w-[72%] rounded-[50%] blur-3xl"
              style={{ backgroundColor: pack.glow }}
            />
            <img
              src={pack.image}
              alt={`GGBOX ${pack.titleMain} ${pack.titleSuffix}`}
              className="relative z-10 max-h-[640px] w-auto max-w-full object-contain drop-shadow-[0_52px_120px_rgba(37,211,255,0.35)]"
              draggable={false}
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-7 inline-flex items-center gap-2 border px-4 py-2 text-xs font-black uppercase" style={{ borderColor: `${pack.border}8c`, backgroundColor: `${pack.panel}b8`, color: pack.accent, borderRadius: 999, letterSpacing: '0.16em' }}>
            <Gem size={15} /> 2026 Season Drop
          </div>
          <h1
            className="max-w-[940px] text-[62px] uppercase leading-[0.9] text-white sm:text-[108px] lg:text-[136px]"
            style={{
              fontFamily: "'Anton', sans-serif",
              letterSpacing: '0',
              textShadow: `0 0 44px ${pack.glow}`,
            }}
          >
            {packDisplayTitle}
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-white/62">
            {packDescriptionLines[0]}<br />
            {packDescriptionLines[1]}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Moments inside', value: '3', icon: Video },
              { label: 'Creators', value: String(packCreators.length), icon: Users },
              { label: 'Supply', value: `${pack.supply}`, icon: Box },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="border bg-black/38 p-5" style={{ borderColor: `${pack.border}66`, borderRadius: 8 }}>
                  <div className="flex items-center gap-2" style={{ color: pack.accent }}>
                    <Icon size={18} />
                    <span className="text-[11px] font-black uppercase" style={{ letterSpacing: '0.14em' }}>
                      {stat.label}
                    </span>
                  </div>
                  <div className="mt-4 text-4xl font-black text-white">{stat.value}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-5">
            <section className="border border-white/12 bg-black/34 p-5" style={{ borderRadius: 8 }}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 text-2xl font-black text-white">Pack Contents</h2>
              </div>
              <div className="mt-5 grid gap-4">
                {packMoments.map((moment, index) => (
                  <article key={moment.id} className="grid gap-4 border bg-[#031016]/78 p-4 md:grid-cols-[240px_minmax(0,1fr)]" style={{ borderColor: `${pack.border}3d`, borderRadius: 8 }}>
                    <PackMomentPreview moment={moment} index={index} accent={pack.accent} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-white/18 px-3 py-1 text-[10px] font-black uppercase text-white/70" style={{ borderRadius: 999, letterSpacing: '0.12em' }}>
                          {moment.category}
                        </span>
                      </div>
                      <h3 className="moment-clamp-2 mt-3 min-h-[3.15rem] max-w-2xl text-xl font-black leading-tight text-white sm:text-2xl">{moment.title}</h3>
                      <div className="mt-4 flex items-center gap-3">
                        <img src={moment.avatar} alt="" className="h-12 w-12 rounded-full border border-white/22 object-cover object-top" />
                        <div className="min-w-0">
                          <div className="font-black text-white">{moment.creator}</div>
                          <div className="text-sm font-semibold text-white/50">{moment.handle}</div>
                        </div>
                        <span className="ml-auto text-sm font-black text-white/54">{moment.duration}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside id="checkout" className="border bg-[#031016]/86 p-5 shadow-[0_0_70px_rgba(37,211,255,0.16)]" style={{ borderColor: `${pack.border}73`, borderRadius: 8 }}>
              <div className="flex items-center gap-2" style={{ color: pack.accent }}>
                <ShoppingBag size={19} />
                <span className="text-xs font-black uppercase" style={{ letterSpacing: '0.16em' }}>
                  Buy Pack
                </span>
              </div>
              <div className="mt-5 text-5xl font-black text-white">${pack.price}</div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px]">
                <p className="m-0 text-sm font-semibold leading-6 text-white/54">
                  1 sealed GGBOX {pack.titleMain} pack. Includes {pack.moment} creator moments from the 2026 Season drop.
                </p>
                <div
                  className="relative flex min-h-12 items-center gap-2 overflow-hidden border px-3 py-2"
                  style={{ borderColor: `${pack.border}52`, backgroundColor: `${pack.panel}a8`, borderRadius: 8 }}
                >
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-16 opacity-40" style={{ background: `radial-gradient(circle, ${pack.accent}, transparent 62%)` }} />
                  <div className="relative flex items-center gap-2" style={{ color: pack.accent }}>
                    <Gem size={15} />
                    <span className="text-[10px] font-black uppercase" style={{ letterSpacing: '0.12em' }}>
                      Legendary moments included
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-black uppercase text-white/54" style={{ letterSpacing: '0.12em' }}>
                  <span>Availability</span>
                  <span>{availability}%</span>
                </div>
                <div className="h-3 overflow-hidden border border-[#28d4f2]/38 bg-black/55" style={{ borderRadius: 999 }}>
                  <div className="h-full shadow-[0_0_22px_rgba(50,223,255,0.7)]" style={{ width: `${availability}%`, backgroundColor: pack.accent }} />
                </div>
                <div className="mt-2 text-xs font-semibold text-white/44">
                  {pack.remaining} of {pack.supply} packs remaining
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 border border-[#28d4f2]/38 bg-black/40" style={{ borderRadius: 8 }}>
                <button
                  type="button"
                  className="flex h-14 items-center justify-center text-white/38 hover:text-white disabled:text-white/10"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus size={27} strokeWidth={3} />
                </button>
                <div className="flex h-14 items-center justify-center text-2xl font-black text-white">{quantity}</div>
                <button
                  type="button"
                  className="flex h-14 items-center justify-center text-white/48 hover:text-white"
                  onClick={() => setQuantity((value) => Math.min(9, value + 1))}
                >
                  <Plus size={30} strokeWidth={2.4} />
                </button>
              </div>

              <a
                href={`/market/pack/${pack.id}`}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 border text-sm font-black uppercase text-white no-underline shadow-[0_0_34px_rgba(37,211,255,0.32)] transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: pack.button, borderColor: pack.border, borderRadius: 8, letterSpacing: '0.16em' }}
              >
                <ShoppingBag size={18} /> Buy Pack ${packPrice}
              </a>

            </aside>
          </div>

          <section className="mt-8 border border-white/12 bg-black/28 p-5" style={{ borderRadius: 8 }}>
            <h2 className="m-0 text-2xl font-black text-white">Creators In This Pack</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {packCreators.map((creator) => (
                <a
                  key={creator.handle}
                  href={creator.twitchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 border bg-[#031016]/78 p-4 text-white no-underline transition-colors"
                  style={{ borderColor: `${pack.border}3d`, borderRadius: 8 }}
                >
                  <img src={creator.avatar} alt="" className="h-14 w-14 rounded-full border border-white/22 object-cover object-top" />
                  <div className="min-w-0">
                    <div className="font-black text-white">{creator.creator}</div>
                    <div className="truncate text-sm font-semibold text-[#54b9ff]">{creator.handle}</div>
                    <div className="mt-1 text-xs font-black uppercase text-white/42" style={{ letterSpacing: '0.1em' }}>
                      {creator.moments} moment
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function parseDurationLabel(label: string) {
  const [minutes = '0', seconds = '0'] = label.split(':');
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);

  if (!Number.isFinite(parsedMinutes) || !Number.isFinite(parsedSeconds)) {
    return 0;
  }

  return parsedMinutes * 60 + parsedSeconds;
}

function formatDurationLabel(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function PackMomentPreview({
  moment,
  index,
  accent,
}: {
  moment: PackMoment;
  index: number;
  accent: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackDurationSeconds = parseDurationLabel(moment.duration);
  const [durationSeconds, setDurationSeconds] = useState(fallbackDurationSeconds);
  const [timeLabel, setTimeLabel] = useState<string>(moment.duration);

  const updateRemainingTime = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const baseDuration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : durationSeconds;
    const remaining = Math.max(0, Math.ceil(baseDuration - video.currentTime));
    setTimeLabel(formatDurationLabel(remaining));
  };

  const startPreview = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  };

  const resetPreview = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
    video.muted = true;
    setTimeLabel(formatDurationLabel(durationSeconds));
  };

  return (
    <div
      className="group/packvideo relative aspect-video overflow-hidden border bg-black"
      style={{ borderColor: `${accent}59`, borderRadius: 8 }}
      onMouseEnter={startPreview}
      onMouseLeave={resetPreview}
      onFocus={startPreview}
      onBlur={resetPreview}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={moment.videoUrl}
        className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-300 group-hover/packvideo:scale-[1.035] group-hover/packvideo:saturate-[1.12]"
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          const loadedDuration = event.currentTarget.duration;

          if (Number.isFinite(loadedDuration) && loadedDuration > 0) {
            const roundedDuration = Math.ceil(loadedDuration);
            setDurationSeconds(roundedDuration);
            setTimeLabel(formatDurationLabel(roundedDuration));
          }
        }}
        onTimeUpdate={updateRemainingTime}
        onEnded={resetPreview}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-black/18 opacity-80" />
      <div className="pointer-events-none absolute left-2 top-2 border border-white/20 bg-black/58 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur" style={{ borderRadius: 999 }}>
        #{String(index + 1).padStart(2, '0')}
      </div>
      <div className="pointer-events-none absolute right-2 bottom-2 border border-white/24 bg-black/48 px-3 py-1 text-xs font-black text-white backdrop-blur" style={{ borderRadius: 999 }}>
        {timeLabel}
      </div>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 group-hover/packvideo:opacity-0 group-focus/packvideo:opacity-0"
      >
        <div
          className="flex h-12 w-12 items-center justify-center border bg-black/40 text-white backdrop-blur"
          style={{ borderColor: accent, borderRadius: 999, boxShadow: `0 0 34px ${accent}6b` }}
        >
          <Play size={19} fill="currentColor" strokeWidth={0} />
        </div>
      </div>
    </div>
  );
}

type MarketMomentItem = {
  id: string;
  title: string;
  creator: string;
  handle: string;
  avatar: string;
  category: string;
  duration: string;
  rarity: 'Legendary' | 'Standard';
  videoUrl?: string;
  thumbnailUrl?: string;
  accent: string;
  packId: DropPack['id'];
  packTitle: string;
  price: number;
  serial: string;
};

type MarketListing = {
  seller: string;
  serial: string;
  price: number;
  userListingId?: string;
  ownerUserId?: string;
};

function getRedirectTarget(fallback = '/account') {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');

  if (!redirect || redirect.startsWith('/login') || redirect.startsWith('/register') || redirect.startsWith('/forgot-password')) {
    return fallback;
  }

  return redirect.startsWith('/') ? redirect : fallback;
}

function redirectToAuth(mode: 'login' | 'register' = 'login') {
  if (typeof window === 'undefined') {
    return;
  }

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.href = `/${mode}?redirect=${encodeURIComponent(current)}`;
}

function goToAccount(tab: 'overview' | 'collection' = 'collection') {
  if (typeof window !== 'undefined') {
    window.location.href = `/account?tab=${tab}`;
  }
}

function getReturnPath(fallback: string) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const returnPath = new URLSearchParams(window.location.search).get('return');
  return returnPath?.startsWith('/') ? returnPath : fallback;
}

function getCurrentPathWithSearch() {
  if (typeof window === 'undefined') {
    return '/account';
  }

  return `${window.location.pathname}${window.location.search}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

function getCollectionValue(inventory: AccountInventory) {
  const momentValue = inventory.moments.reduce((total, moment) => {
    const listing = getListingForOwnedMoment(moment.id);

    if (listing) {
      return total + listing.price;
    }

    const marketMoment = getMarketMomentByIdOrNull(moment.sourceId);
    return total + (marketMoment ? getTopMarketAskPrice(marketMoment) : moment.price);
  }, 0);
  const packValue = inventory.packs.reduce((total, pack) => total + pack.price * pack.quantity, 0);
  return momentValue + packValue;
}

function getBalance(inventory: AccountInventory) {
  return Number.isFinite(inventory.balance) ? inventory.balance : 500;
}

function FlashToast({ message, onDismiss }: { message: FlashMessageData; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-5 right-5 z-[120] w-[min(360px,calc(100vw-2rem))] border border-[#54b9ff]/42 bg-[#06101a]/94 p-4 text-white shadow-[0_0_54px_rgba(84,185,255,0.24)] backdrop-blur" style={{ borderRadius: 8 }}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#54b9ff]/52 bg-[#54b9ff]/12 text-[#54b9ff]" style={{ borderRadius: 999 }}>
          {message.type === 'success' ? <Check size={18} /> : <Sparkles size={17} />}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black uppercase" style={{ letterSpacing: '0.08em' }}>{message.title}</div>
          <div className="mt-1 text-sm font-semibold leading-5 text-white/58">{message.detail}</div>
        </div>
      </div>
    </div>
  );
}

function MarketHeader({ active = 'market' }: { active?: 'drops' | 'market' | 'account' }) {
  const activeUser = getActiveUser();

  return (
    <header className="relative z-10 mx-auto h-11 max-w-[1680px]">
      <a
        href="/"
        className="absolute left-0 top-0 flex h-11 items-center text-xs font-semibold uppercase text-white no-underline transition-opacity hover:opacity-80"
        style={{ letterSpacing: '0.18em' }}
      >
        GGBOX
      </a>
      <nav
        aria-label="Primary"
        className="absolute left-1/2 top-0 flex h-11 -translate-x-1/2 items-center gap-8 text-xs font-semibold uppercase text-white sm:gap-11"
        style={{ letterSpacing: '0.18em' }}
      >
        <a
          href="/#drop-pack"
          className={`relative leading-none no-underline transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:text-white hover:after:w-full ${
            active === 'drops' ? 'text-white' : 'text-white/72'
          }`}
        >
          Drops
        </a>
        <a
          href="/market"
          className={`relative leading-none no-underline transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:text-white hover:after:w-full ${
            active === 'market' ? 'text-white' : 'text-white/72'
          }`}
        >
          Market
        </a>
        <a
          href="/account"
          className={`absolute left-full top-1/2 ml-8 -translate-y-1/2 leading-none no-underline transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-[width] hover:text-white hover:after:w-full sm:ml-11 ${
            active === 'account' ? 'text-white' : 'text-white/72'
          }`}
        >
          Account
        </a>
      </nav>
      <a
        href={activeUser ? '/account' : '/login'}
        className="absolute right-0 top-0 hidden h-11 items-center gap-2 px-1 text-[10px] font-black uppercase text-white no-underline transition-opacity hover:opacity-78 sm:flex"
        style={{ letterSpacing: '0.12em' }}
      >
        {activeUser ? <img src={activeUser.avatar} alt="Account" className="h-8 w-8 rounded-full object-cover" /> : <UserCircle size={16} />}
        {!activeUser ? 'Sign In' : null}
      </a>
    </header>
  );
}

function getPackDisplayTitle(pack: DropPack) {
  return pack.id === 'counter-strike' ? 'CS2, CS:GO Pack' : `${pack.titleMain} ${pack.titleSuffix}`;
}

function getPackDescriptionLines(pack: DropPack) {
  return [
    `1 sealed GGBOX ${pack.titleMain} pack.`,
    `Includes ${pack.moment} creator moments from the 2026 Season drop.`,
  ];
}

function getPackMarketCategory(pack: DropPack) {
  if (pack.id === 'counter-strike') return 'CS2 / CS:GO';
  if (pack.id === 'irl-moments') return 'IRL';
  if (pack.id === 'dota-2') return 'DOTA 2';
  return 'Minecraft';
}

function getFallbackMarketMoments(): MarketMomentItem[] {
  return DROP_PACKS.flatMap((pack) =>
    getResolvedPackMoments(pack).map((moment, index) => ({
      id: moment.id,
      title: moment.title,
      creator: moment.creator,
      handle: moment.handle,
      avatar: moment.avatar,
      category: moment.category,
      duration: moment.duration,
      rarity: moment.rarity,
      videoUrl: moment.videoUrl,
      accent: pack.accent,
      packId: pack.id,
      packTitle: getPackDisplayTitle(pack),
      price: 8 + index * 2 + (moment.rarity === 'Legendary' ? 6 : 0),
      serial: `#${String(index + 1).padStart(2, '0')}/50`,
    })),
  );
}

function getPublishedMarketMoments(cards: PublishedMomentCardData[]): MarketMomentItem[] {
  return cards
    .filter((card) => card.content_origin === 'investor_demo')
    .map((card, index) => ({
      id: card.id,
      title: card.title,
      creator: card.creator_display_name,
      handle: card.creator_handle ?? `@${card.creator_display_name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'creator'}`,
      avatar: card.creator_avatar_url,
      category: card.category ?? 'Creator Moment',
      duration: card.duration_label && /\d+:\d{2}/.test(card.duration_label) ? card.duration_label : '0:08',
      rarity: card.rarity === 'Legendary' ? 'Legendary' : 'Standard',
      videoUrl: card.video_url ?? card.display_asset_url,
      thumbnailUrl: card.thumbnail_url,
      accent: '#54b9ff',
      packId: 'minecraft',
      packTitle: 'Creator Moment',
      price: 9 + index * 2,
      serial: `#${String(index + 1).padStart(2, '0')}/50`,
    }));
}

function getMarketMomentItems() {
  const publishedMoments = getPublishedMarketMoments(getPublishedMomentCards());
  const fallbackMoments = getFallbackMarketMoments();
  const publishedIds = new Set(publishedMoments.map((moment) => moment.id));
  const uniqueMoments: MarketMomentItem[] = [];
  const seenMomentKeys = new Set<string>();

  [...publishedMoments, ...fallbackMoments.filter((moment) => !publishedIds.has(moment.id))].forEach((moment) => {
    const momentKey = moment.videoUrl ?? moment.thumbnailUrl ?? moment.title.toLowerCase();

    if (seenMomentKeys.has(momentKey)) {
      return;
    }

    seenMomentKeys.add(momentKey);
    uniqueMoments.push(moment);
  });

  return uniqueMoments;
}

function getMarketMomentById(momentId: string) {
  return getMarketMomentItems().find((moment) => moment.id === momentId) ?? getMarketMomentItems()[0];
}

function getMarketMomentByIdOrNull(momentId: string) {
  return getMarketMomentItems().find((moment) => moment.id === momentId) ?? null;
}

function getMarketPackById(packId: string) {
  return DROP_PACKS.find((pack) => pack.id === packId) ?? MINECRAFT_PACK;
}

function getPackPriceByTitle(packTitle: string) {
  return DROP_PACKS.find((pack) => getPackDisplayTitle(pack) === packTitle)?.price ?? 5;
}

function getOwnedMomentCostLabel(moment: OwnedMomentData) {
  if (moment.acquisition === 'pack') {
    return {
      label: 'Pack',
      value: `$${getPackPriceByTitle(moment.packTitle).toFixed(0)} drop`,
    };
  }

  return {
    label: 'Paid',
    value: `$${moment.price.toFixed(2)}`,
  };
}

function getMarketPackIdFromPath(pathname: string): DropPack['id'] | null {
  const match = pathname.match(/^\/market\/pack\/([^/]+)$/);
  const packId = match?.[1];

  if (!packId) {
    return null;
  }

  return DROP_PACKS.some((pack) => pack.id === packId) ? (packId as DropPack['id']) : null;
}

function getMarketMomentIdFromPath(pathname: string) {
  const match = pathname.match(/^\/market\/moment\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getOpenPackIdFromPath(pathname: string): DropPack['id'] | null {
  const match = pathname.match(/^\/account\/open\/([^/]+)$/);
  const packId = match?.[1];

  if (!packId) {
    return null;
  }

  return DROP_PACKS.some((pack) => pack.id === packId) ? (packId as DropPack['id']) : null;
}

function getOwnedMomentIdFromPath(pathname: string) {
  const match = pathname.match(/^\/account\/moment\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getPublicHandleFromPath(pathname: string) {
  const match = pathname.match(/^\/u\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getCreatorHandleFromPath(pathname: string) {
  const match = pathname.match(/^\/creator\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function startHoverVideoPreview(video: HTMLVideoElement | null) {
  if (!video) {
    return;
  }

  if (video.ended || video.currentTime > 0) {
    video.currentTime = 0;
  }

  video.volume = 0.82;
  video.muted = true;
  void video
    .play()
    .then(() => {
      window.setTimeout(() => {
        video.muted = false;
        void video.play().catch(() => {
          video.muted = true;
          void video.play().catch(() => undefined);
        });
      }, 80);
    })
    .catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
}

function resetHoverVideoPreview(video: HTMLVideoElement | null) {
  if (!video) {
    return;
  }

  video.pause();
  video.currentTime = 0;
  video.muted = true;
}

function HoverVideoFrame({
  videoUrl,
  thumbnailUrl,
  children,
}: {
  videoUrl?: string;
  thumbnailUrl?: string;
  children?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const startPreview = () => {
    startHoverVideoPreview(videoRef.current);
  };

  const resetPreview = () => {
    resetHoverVideoPreview(videoRef.current);
  };

  return (
    <div
      className="relative aspect-video overflow-hidden bg-black"
      style={{ borderRadius: 8 }}
      onMouseEnter={startPreview}
      onMouseLeave={resetPreview}
      onFocus={startPreview}
      onBlur={resetPreview}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          muted
          playsInline
          preload="metadata"
        />
      ) : null}
      {children}
    </div>
  );
}

function ControlledMomentVideo({ moment }: { moment: OwnedMomentData }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayback = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play().catch(() => undefined);
      setIsPaused(false);
      return;
    }

    video.pause();
    setIsPaused(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const openFullscreen = () => {
    const container = videoRef.current?.parentElement;
    void container?.requestFullscreen?.().catch(() => undefined);
  };

  const seekVideo = (value: string) => {
    const video = videoRef.current;
    const nextTime = Number(value);

    if (!video || !Number.isFinite(nextTime)) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const durationLabel = duration > 0 ? formatDurationLabel(duration) : '--:--';
  const currentTimeLabel = formatDurationLabel(currentTime);

  return (
    <div className="relative aspect-video bg-black">
      {moment.videoUrl ? (
        <video
          ref={videoRef}
          src={moment.videoUrl}
          poster={moment.thumbnailUrl}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onClick={togglePlayback}
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
          onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
          onLoadedMetadata={(event) => {
            const loadedDuration = event.currentTarget.duration;

            if (Number.isFinite(loadedDuration) && loadedDuration > 0) {
              setDuration(loadedDuration);
            }
          }}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        />
      ) : null}
      <div className="absolute bottom-4 left-4 right-4 grid gap-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="text-[11px] font-black tabular-nums text-white/72">{currentTimeLabel}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step="0.1"
            value={Math.min(currentTime, Math.max(duration, 1))}
            onChange={(event) => seekVideo(event.currentTarget.value)}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/24 accent-[#54b9ff]"
            aria-label="Video timeline"
          />
          <span className="text-[11px] font-black tabular-nums text-white/72">{durationLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-10 w-10 items-center justify-center border border-white/20 bg-black/48 text-white backdrop-blur transition-colors hover:bg-white/12"
              style={{ borderRadius: 999 }}
              aria-label={isPaused ? 'Play video' : 'Pause video'}
            >
              {isPaused ? <Play size={16} fill="currentColor" strokeWidth={0} /> : <Pause size={16} />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center border border-white/20 bg-black/48 text-white backdrop-blur transition-colors hover:bg-white/12"
              style={{ borderRadius: 999 }}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </div>
          <button
            type="button"
            onClick={openFullscreen}
            className="flex h-10 w-10 items-center justify-center border border-white/20 bg-black/48 text-white backdrop-blur transition-colors hover:bg-white/12"
            style={{ borderRadius: 999 }}
            aria-label="Open fullscreen"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function createMarketListings(seed: string, basePrice: number): MarketListing[] {
  const sellers = ['@ggbox_vault', '@faithdrop', '@clipmaker', '@packhunter', '@pixelbid', '@rushdesk', '@mintline', '@collector_07'];
  const seedOffset = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  const serials = [3, 8, 14, 21, 29, 36, 43, 49].map((serial) => Math.min(50, serial + seedOffset));
  const serialPremiums = [18, 14, 11, 8, 5, 3, 1, 0];

  return sellers.map((seller, index) => ({
    seller,
    serial: `#${String(serials[index]).padStart(2, '0')}/50`,
    price: basePrice + serialPremiums[index],
  }));
}

function getSerialNumber(serial: string) {
  const match = serial.match(/#(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function createVisibleMarketListings(moment: MarketMomentItem): MarketListing[] {
  const userListings = getActiveUserListingForMoment(moment.id).map((listing) => ({
    seller: listing.sellerHandle,
    serial: listing.serial,
    price: listing.price,
    userListingId: listing.id,
    ownerUserId: listing.userId,
  }));

  return [...userListings, ...createMarketListings(moment.id, moment.price)].sort(
    (left, right) => getSerialNumber(left.serial) - getSerialNumber(right.serial) || right.price - left.price,
  );
}

function getTopMarketAskPrice(moment: MarketMomentItem) {
  return createVisibleMarketListings(moment)[0]?.price ?? moment.price;
}

function createSerial(seed: string, limit = 50) {
  const base = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `#${String((base % limit) + 1).padStart(2, '0')}/${limit}`;
}

function createOwnedMomentFromMarket(
  moment: MarketMomentItem,
  listing: MarketListing,
  acquisition: OwnedMomentData['acquisition'] = 'market',
): Omit<OwnedMomentData, 'id' | 'purchasedAt'> {
  return {
    sourceId: moment.id,
    title: moment.title,
    creator: moment.creator,
    handle: moment.handle,
    avatar: moment.avatar,
    rarity: moment.rarity,
    category: moment.category,
    serial: listing.serial,
    price: listing.price,
    videoUrl: moment.videoUrl,
    thumbnailUrl: moment.thumbnailUrl,
    accent: moment.accent,
    packTitle: moment.packTitle,
    acquisition,
  };
}

function createOwnedMomentFromPack(
  moment: PackMoment,
  pack: DropPack,
  index: number,
): Omit<OwnedMomentData, 'id' | 'purchasedAt'> {
  return {
    sourceId: moment.id,
    title: moment.title,
    creator: moment.creator,
    handle: moment.handle,
    avatar: moment.avatar,
    rarity: moment.rarity,
    category: moment.category,
    serial: createSerial(`${pack.id}-${moment.id}-${Date.now()}-${index}`, pack.supply),
    price: pack.price / Number(pack.moment),
    videoUrl: moment.videoUrl,
    accent: pack.accent,
    packTitle: getPackDisplayTitle(pack),
    acquisition: 'pack',
  };
}

function purchaseMarketMoment(moment: MarketMomentItem, listing: MarketListing) {
  const user = getActiveUser();

  if (!user) {
    redirectToAuth('login');
    return;
  }

  if (listing.ownerUserId === user.id) {
    setFlashMessage({
      type: 'info',
      title: 'Your listing',
      detail: 'You cannot buy a moment from your own locker.',
    });
    return;
  }

  const inventory = getInventory(user.id);

  if (getBalance(inventory) < listing.price) {
    setFlashMessage({
      type: 'info',
      title: 'Balance too low',
      detail: `Add funds before buying this moment for $${listing.price.toFixed(2)}.`,
    });
    return;
  }

  if (listing.userListingId) {
    const purchasedListing = purchaseListedMoment(user, listing.userListingId);

    if (!purchasedListing) {
      setFlashMessage({
        type: 'info',
        title: 'Listing unavailable',
        detail: 'This moment is no longer available or belongs to your own locker.',
      });
      goToAccount('collection');
      return;
    }

    setFlashMessage({
      type: 'success',
      title: 'Moment transferred',
      detail: `${purchasedListing.moment.title} is now in your locker.`,
    });
    trackEvent('market_listing_purchased', {
      moment_id: moment.id,
      seller: listing.seller,
      price: listing.price,
      rarity: moment.rarity,
    });
    goToAccount('collection');
    return;
  }

  const ownedMoment = addOwnedMoment(inventory, createOwnedMomentFromMarket(moment, listing));
  inventory.balance = Math.max(0, Math.round((getBalance(inventory) - listing.price) * 100) / 100);
  addActivity(inventory, {
    type: 'purchase_moment',
    label: 'Moment purchased',
    detail: `${ownedMoment.title} from ${listing.seller}`,
    amount: listing.price,
    accent: moment.accent,
  });
  saveInventory(inventory);
  setFlashMessage({
    type: 'success',
    title: 'Moment added',
    detail: `${ownedMoment.title} is now in your locker.`,
  });
  trackEvent('market_moment_purchased', {
    moment_id: moment.id,
    seller: listing.seller,
    price: listing.price,
    rarity: moment.rarity,
  });
  goToAccount('collection');
}

function purchasePack(pack: DropPack, quantity: number) {
  const user = getActiveUser();

  if (!user) {
    redirectToAuth('login');
    return;
  }

  const inventory = getInventory(user.id);
  const total = pack.price * quantity;

  if (getBalance(inventory) < total) {
    setFlashMessage({
      type: 'info',
      title: 'Balance too low',
      detail: `Add funds before buying this pack for $${total.toFixed(2)}.`,
    });
    goToAccount('collection');
    return;
  }

  inventory.balance = Math.max(0, Math.round((getBalance(inventory) - total) * 100) / 100);
  upsertOwnedPack(inventory, {
    packId: pack.id,
    title: getPackDisplayTitle(pack),
    image: pack.image,
    accent: pack.accent,
    quantity,
    price: pack.price,
  });
  addActivity(inventory, {
    type: 'purchase_pack',
    label: quantity > 1 ? `${quantity} packs purchased` : 'Pack purchased',
    detail: getPackDisplayTitle(pack),
    amount: total,
    accent: pack.accent,
  });
  saveInventory(inventory);
  setFlashMessage({
    type: 'success',
    title: 'Pack secured',
    detail: `${getPackDisplayTitle(pack)} is sealed in your locker.`,
  });
  trackEvent('pack_purchased', {
    pack_id: pack.id,
    quantity,
    price: pack.price,
    total,
  });
  goToAccount('collection');
}

function openOwnedPack(user: StoredUser, packId: string) {
  const pack = getMarketPackById(packId);
  const inventory = getInventory(user.id);

  if (!decrementOwnedPack(inventory, pack.id)) {
    return inventory;
  }

  getResolvedPackMoments(pack).forEach((moment, index) => {
    addOwnedMoment(inventory, createOwnedMomentFromPack(moment, pack, index));
  });
  addActivity(inventory, {
    type: 'open_pack',
    label: 'Pack opened',
    detail: `${getPackDisplayTitle(pack)} revealed ${pack.moment} moments`,
    accent: pack.accent,
  });
  saveInventory(inventory);
  setFlashMessage({
    type: 'success',
    title: 'Pack opened',
    detail: `${getPackDisplayTitle(pack)} revealed ${pack.moment} creator moments.`,
  });
  trackEvent('pack_opened', {
    pack_id: pack.id,
    moments_revealed: Number(pack.moment),
  });
  return inventory;
}

function ensureAccountInventoryFilled(user: StoredUser) {
  const inventory = getInventory(user.id);

  if (inventory.moments.length > 0 || inventory.packs.length > 0) {
    return inventory;
  }

  const starterPackIds: DropPack['id'][] = ['irl-moments', 'minecraft'];
  starterPackIds.forEach((packId) => {
    const pack = getMarketPackById(packId);
    upsertOwnedPack(inventory, {
      packId: pack.id,
      title: getPackDisplayTitle(pack),
      image: pack.image,
      accent: pack.accent,
      quantity: 1,
      price: pack.price,
    });
  });

  const starterMoments = [
    { pack: getMarketPackById('counter-strike'), index: 0 },
    { pack: getMarketPackById('irl-moments'), index: 0 },
    { pack: getMarketPackById('dota-2'), index: 1 },
    { pack: getMarketPackById('minecraft'), index: 1 },
  ];

  starterMoments.forEach(({ pack, index }) => {
    const moment = getResolvedPackMoments(pack)[index] ?? getResolvedPackMoments(pack)[0];
    if (moment) {
      addOwnedMoment(inventory, createOwnedMomentFromPack(moment, pack, index));
    }
  });

  addActivity(inventory, {
    type: 'purchase_pack',
    label: 'Starter kit added',
    detail: '2 sealed packs and 4 creator moments loaded into the locker',
    amount: 0,
    accent: '#54b9ff',
  });
  addActivity(inventory, {
    type: 'purchase_moment',
    label: 'Genesis collection ready',
    detail: 'Launch-ready collector profile populated',
    accent: '#8cff2f',
  });
  saveInventory(inventory);
  return inventory;
}

type MarketFilter = 'packs' | 'moments' | 'legendary';

const MARKET_FILTERS: Array<{ id: MarketFilter; label: string }> = [
  { id: 'packs', label: 'Packs' },
  { id: 'moments', label: 'Moments' },
  { id: 'legendary', label: 'Legendary' },
];

function MarketplacePage() {
  const marketMoments = getMarketMomentItems();
  const legendaryMoments = marketMoments.filter((moment) => moment.rarity === 'Legendary');
  const [activeFilter, setActiveFilter] = useState<MarketFilter>('packs');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const momentSource = activeFilter === 'legendary' ? legendaryMoments : marketMoments;
  const packCategories = ['All', ...DROP_PACKS.map(getPackMarketCategory)];
  const momentCategories = ['All', ...Array.from(new Set(momentSource.map((moment) => moment.category)))];
  const activeCategories = activeFilter === 'packs' ? packCategories : momentCategories;
  const visiblePacks =
    activeCategory === 'All'
      ? DROP_PACKS
      : DROP_PACKS.filter((pack) => getPackMarketCategory(pack) === activeCategory);
  const visibleMoments =
    activeCategory === 'All'
      ? momentSource
      : momentSource.filter((moment) => moment.category === activeCategory);

  const setMarketFilter = (filter: MarketFilter) => {
    setActiveFilter(filter);
    setActiveCategory('All');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070b] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 14% 18%, rgba(84,185,255,0.22), transparent 28%), radial-gradient(circle at 88% 8%, rgba(145,70,255,0.16), transparent 24%), linear-gradient(135deg, #04070b 0%, #07121b 50%, #030406 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <MarketHeader active="market" />

      <section className="relative z-10 mx-auto max-w-[1680px] pb-20 pt-14">
        <h1 className="text-[68px] uppercase leading-none text-white sm:text-[116px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>
          Market
        </h1>

        <div className="mt-9 flex flex-wrap gap-3">
          {MARKET_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setMarketFilter(filter.id)}
                className="flex h-12 min-w-[150px] items-center justify-center border px-5 text-xs font-black uppercase transition-colors"
                style={{
                  borderColor: isActive ? '#54b9ff' : 'rgba(255,255,255,0.14)',
                  backgroundColor: isActive ? 'rgba(84,185,255,0.16)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.66)',
                  borderRadius: 8,
                  letterSpacing: '0.14em',
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="launch-panel h-fit border border-white/10 bg-black/24 p-4" style={{ borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              className="flex h-10 w-full items-center justify-between text-left text-[10px] font-black uppercase text-white/72 transition-colors hover:text-white"
              style={{ letterSpacing: '0.16em' }}
              aria-expanded={categoriesOpen}
            >
              Categories
              <ChevronDown
                size={16}
                className="transition-transform"
                style={{ transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            {categoriesOpen ? (
            <div className="mt-3 grid gap-2">
              {activeCategories.map((category) => {
                const isActive = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className="flex min-h-11 items-center justify-between border px-3 text-left text-xs font-black uppercase transition-colors"
                    style={{
                      borderColor: isActive ? '#54b9ff' : 'rgba(255,255,255,0.1)',
                      backgroundColor: isActive ? 'rgba(84,185,255,0.14)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.62)',
                      borderRadius: 8,
                      letterSpacing: '0.1em',
                    }}
                  >
                    <span>{category}</span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isActive ? '#54b9ff' : 'rgba(255,255,255,0.24)' }} />
                  </button>
                );
              })}
            </div>
            ) : null}
          </aside>

          <div className="min-w-0">
            {activeFilter === 'packs' ? (
              <>
                <h2 className="text-2xl font-black text-white">Packs</h2>
                <div className="mt-4 grid gap-x-7 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
              {visiblePacks.map((pack) => (
                <a
                  key={pack.id}
                  href={`/market/pack/${pack.id}`}
                  className="group min-w-0 text-white no-underline transition-transform hover:-translate-y-1"
                  style={{ '--pack-accent': pack.accent } as CSSProperties}
                >
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-visible">
                    <div className="pointer-events-none absolute bottom-[8%] h-[28%] w-[78%] rounded-[50%] opacity-55 blur-3xl" style={{ backgroundColor: pack.glow }} />
                    <img src={pack.image} alt="" className="relative z-10 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]" />
                  </div>
                  <div className="mt-4 text-xl font-black">{getPackDisplayTitle(pack)}</div>
                  <div className="mt-2 text-sm font-semibold text-white/52">{pack.moment} moments inside</div>
                  <div
                    className="mt-4 flex h-11 translate-y-2 items-center justify-center text-xs font-black uppercase text-white opacity-0 transition-[box-shadow,filter,opacity,transform] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:-translate-y-0.5 group-hover:brightness-110"
                    style={{
                      backgroundColor: BUY_BUTTON_BACKGROUND,
                      borderRadius: 8,
                      boxShadow: BUY_BUTTON_SHADOW,
                      letterSpacing: '0.12em',
                    }}
                  >
                    Buy ${pack.price}
                  </div>
                </a>
              ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-white">{activeFilter === 'legendary' ? 'Legendary' : 'Moments'}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleMoments.map((moment) => (
                <MarketMomentCard key={moment.id} moment={moment} />
              ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function MarketMomentCard({ moment }: { moment: MarketMomentItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const topAsk = getTopMarketAskPrice(moment);

  const startPreview = () => {
    startHoverVideoPreview(videoRef.current);
  };

  const resetPreview = () => {
    resetHoverVideoPreview(videoRef.current);
  };

  return (
    <a
      href={`/market/moment/${encodeURIComponent(moment.id)}`}
      className="group overflow-hidden bg-black/34 p-4 text-white no-underline shadow-[inset_0_0_0_1px_rgba(84,185,255,0.22),0_26px_80px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-1"
      style={{ borderRadius: 8 }}
      onMouseEnter={startPreview}
      onMouseLeave={resetPreview}
      onFocus={startPreview}
      onBlur={resetPreview}
    >
      <div className="relative aspect-video overflow-hidden bg-black" style={{ borderRadius: 8 }}>
        {moment.videoUrl ? (
          <video
            ref={videoRef}
            src={moment.videoUrl}
            poster={moment.thumbnailUrl}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            muted
            playsInline
            preload="metadata"
          />
        ) : null}
        <div className="absolute right-3 bottom-3 bg-black/58 px-3 py-1 text-xs font-black" style={{ borderRadius: 6 }}>{moment.duration}</div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <img src={moment.avatar} alt="" className="h-11 w-11 rounded-full object-cover object-top" />
        <div className="min-w-0">
          <div className="truncate font-black">{moment.creator}</div>
          <div className="truncate text-sm font-semibold text-[#54b9ff]">{moment.handle}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] font-black uppercase text-white/42" style={{ letterSpacing: '0.1em' }}>Top Ask</div>
          <div className="mt-1 text-lg font-black">${topAsk.toFixed(2)}</div>
        </div>
      </div>
      <h3 className="moment-clamp-2 mt-4 min-h-[3rem] text-xl font-black leading-tight">{moment.title}</h3>
      <div
        className="mt-4 flex h-11 translate-y-2 items-center justify-center text-xs font-black uppercase text-white opacity-0 transition-[box-shadow,filter,opacity,transform] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:-translate-y-0.5 group-hover:brightness-110"
        style={{
          backgroundColor: BUY_BUTTON_BACKGROUND,
          borderRadius: 8,
          boxShadow: BUY_BUTTON_SHADOW,
          letterSpacing: '0.12em',
        }}
      >
        Buy Moment
      </div>
    </a>
  );
}

function MarketMomentPurchasePage({ momentId }: { momentId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const moment = getMarketMomentById(momentId);
  const listings = createVisibleMarketListings(moment);
  const activeUser = getActiveUser();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedListing = listings[selectedIndex];
  const selectedIsOwn = Boolean(activeUser && selectedListing.ownerUserId === activeUser.id);
  const total = selectedListing.price;
  const showMomentPackTitle = moment.packTitle !== 'Creator Moment';
  const returnPath = getReturnPath('/market');
  const startPreview = () => {
    startHoverVideoPreview(videoRef.current);
  };
  const resetPreview = () => {
    resetHoverVideoPreview(videoRef.current);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 75% 12%, ${moment.accent}24, transparent 28%), linear-gradient(135deg, #020406 0%, #070b12 100%)` }} />
      <MarketHeader active="market" />
      <section className="relative z-10 mx-auto max-w-[1680px] pb-20 pt-14">
        <a href={returnPath} className="inline-flex items-center gap-2 text-xs font-black uppercase text-white/72 no-underline" style={{ letterSpacing: '0.14em' }}>
          <ArrowLeft size={17} /> Back
        </a>
        <h1 className="mt-8 text-[44px] uppercase leading-none text-white sm:text-[74px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>
          Purchase a Moment
        </h1>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="launch-panel overflow-hidden border border-white/10 bg-[#111216]" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-lg font-black">{listings.length} available</div>
              <div className="text-xs font-black uppercase text-white/50" style={{ letterSpacing: '0.12em' }}>Best serial first</div>
            </div>
            <div className="grid grid-cols-[64px_1fr_1fr_1.4fr] border-b border-white/10 px-5 py-4 text-xs font-black uppercase text-white/42" style={{ letterSpacing: '0.12em' }}>
              <span />
              <span>Price</span>
              <span>Serial</span>
              <span>Seller</span>
            </div>
            {listings.map((listing, index) => {
              const isOwnListing = Boolean(activeUser && listing.ownerUserId === activeUser.id);

              return (
                <button
                  key={`${listing.userListingId ?? 'vault'}-${listing.serial}-${listing.seller}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className="grid w-full grid-cols-[64px_1fr_1fr_1.4fr] items-center border-b px-5 py-4 text-left text-white transition-[background-color,box-shadow,border-color] hover:bg-white/[0.04]"
                  style={{
                    backgroundColor: index === selectedIndex ? `${moment.accent}1f` : 'rgba(0,0,0,0.2)',
                    borderColor: index === selectedIndex ? `${moment.accent}aa` : 'rgba(255,255,255,0.06)',
                    boxShadow: index === selectedIndex ? `inset 0 0 0 1px ${moment.accent}66, 0 0 34px ${moment.accent}20` : 'none',
                    opacity: isOwnListing ? 0.72 : 1,
                  }}
                >
                  <span className="h-8 w-8 rounded-full border" style={{ borderColor: index === selectedIndex ? moment.accent : 'rgba(255,255,255,0.26)', backgroundColor: index === selectedIndex ? `${moment.accent}33` : 'rgba(255,255,255,0.08)' }} />
                  <span className="font-black">${listing.price.toFixed(2)}</span>
                  <span className="font-semibold text-white/68">{listing.serial}</span>
                  <span className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-white/72">
                    <span className="truncate">{listing.seller}</span>
                    {listing.userListingId ? (
                      <span
                        className="border px-2 py-0.5 text-[9px] font-black uppercase"
                        style={{
                          borderColor: isOwnListing ? 'rgba(255,255,255,0.28)' : 'rgba(140,255,47,0.36)',
                          backgroundColor: isOwnListing ? 'rgba(255,255,255,0.08)' : 'rgba(140,255,47,0.10)',
                          color: isOwnListing ? 'rgba(255,255,255,0.68)' : '#8cff2f',
                          borderRadius: 999,
                          letterSpacing: '0.08em',
                        }}
                      >
                        {isOwnListing ? 'Your listing' : 'Collector'}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </section>

          <aside className="grid gap-4">
            <section className="launch-panel border border-white/16 bg-black/66 p-5" style={{ borderRadius: 8 }}>
              <div className="text-xs font-black uppercase" style={{ color: moment.accent, letterSpacing: '0.14em' }}>Creator Moment</div>
              <div className="mt-4 grid gap-5 sm:grid-cols-[150px_1fr] xl:grid-cols-1">
                <div
                  className="relative aspect-video overflow-hidden border bg-black"
                  style={{ borderColor: `${moment.accent}66`, borderRadius: 8 }}
                  onMouseEnter={startPreview}
                  onMouseLeave={resetPreview}
                  onFocus={startPreview}
                  onBlur={resetPreview}
                >
                  {moment.videoUrl ? (
                    <video
                      ref={videoRef}
                      src={moment.videoUrl}
                      poster={moment.thumbnailUrl}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : null}
                </div>
                <div>
                  {showMomentPackTitle ? (
                    <div className="text-xs font-black uppercase" style={{ color: moment.accent, letterSpacing: '0.14em' }}>{moment.packTitle}</div>
                  ) : null}
                  <h2 className="moment-clamp-2 mt-2 text-2xl font-black leading-tight">{moment.title}</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <img src={moment.avatar} alt="" className="h-12 w-12 rounded-full border border-white/20 object-cover object-top" />
                    <div>
                      <div className="font-black">{moment.creator}</div>
                      <div className="text-sm font-semibold text-[#54b9ff]">{moment.handle}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="launch-panel border border-white/16 bg-black/66 p-5 shadow-[0_0_48px_rgba(49,94,255,0.12)]" style={{ borderRadius: 8 }}>
              <div className="text-xs font-black uppercase text-white/52" style={{ letterSpacing: '0.14em' }}>Checkout</div>
              <div className="mt-5 border-t border-white/12 pt-5">
              <div className="flex justify-between text-xl font-black"><span>Total</span><span>${total.toFixed(2)} USD</span></div>
              </div>
              <button
                type="button"
                onClick={() => purchaseMarketMoment(moment, selectedListing)}
                disabled={selectedIsOwn}
                className="mt-5 flex h-14 w-full items-center justify-center border text-sm font-black uppercase text-white transition-[box-shadow,filter,transform] hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:brightness-100"
                style={{
                  backgroundColor: BUY_BUTTON_BACKGROUND,
                  borderColor: BUY_BUTTON_BORDER,
                  borderRadius: 8,
                  boxShadow: BUY_BUTTON_SHADOW,
                  letterSpacing: '0.16em',
                }}
              >
                {selectedIsOwn ? 'Your Listing' : 'Buy Now'}
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MarketPackPurchasePage({ packId }: { packId: DropPack['id'] }) {
  const pack = getMarketPackById(packId);
  const packMoments = getResolvedPackMoments(pack);
  const packCreators = getPackCreators(packMoments);
  const packDescriptionLines = getPackDescriptionLines(pack);
  const [quantity, setQuantity] = useState(1);
  const total = pack.price * quantity;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02050c] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: pack.background }} />
      <MarketHeader active="market" />
      <section className="relative z-10 mx-auto max-w-[1680px] pb-20 pt-14">
        <a href="/market" className="inline-flex items-center gap-2 text-xs font-black uppercase text-white/72 no-underline" style={{ letterSpacing: '0.14em' }}>
          <ArrowLeft size={17} /> Back to Market
        </a>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(300px,0.66fr)_minmax(0,1.34fr)] xl:gap-14">
          <div className="relative flex min-h-[calc(100svh-9rem)] items-center justify-center overflow-visible p-2 lg:sticky lg:top-20">
            <div
              className="pointer-events-none absolute bottom-[16%] h-[26%] w-[76%] rounded-[50%] opacity-80 blur-3xl"
              style={{ backgroundColor: pack.glow }}
            />
            <img src={pack.image} alt="" className="relative z-10 max-h-[72svh] w-auto max-w-full object-contain drop-shadow-[0_42px_90px_rgba(0,0,0,0.44)]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black uppercase" style={{ color: pack.accent, letterSpacing: '0.18em' }}>{pack.eyebrow}</div>
            <h1 className="mt-4 text-[58px] uppercase leading-none text-white sm:text-[100px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>{getPackDisplayTitle(pack)}</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/58">
              {packDescriptionLines[0]}<br />
              {packDescriptionLines[1]}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Moments', pack.moment],
                ['Creators', String(packCreators.length)],
                ['Remaining', `${pack.remaining}/${pack.supply}`],
              ].map(([label, value]) => (
                <div key={label} className="border bg-black/34 p-5 shadow-[0_0_34px_rgba(0,0,0,0.18)]" style={{ borderColor: `${pack.border}66`, borderRadius: 8 }}>
                  <div className="text-xs font-black uppercase" style={{ color: pack.accent, letterSpacing: '0.14em' }}>{label}</div>
                  <div className="mt-3 text-4xl font-black">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="launch-panel border bg-black/28 p-5" style={{ borderColor: `${pack.border}52`, borderRadius: 8 }}>
                <h2 className="text-xl font-black">Included moments</h2>
                <div className="mt-3 flex w-fit items-center gap-2 border px-3 py-2 text-[10px] font-black uppercase" style={{ borderColor: `${pack.border}52`, backgroundColor: `${pack.panel}a8`, color: pack.accent, borderRadius: 8, letterSpacing: '0.12em' }}>
                  <Gem size={15} /> Legendary moments included
                </div>
                <div className="mt-4 grid gap-3">
                  {packMoments.map((moment, index) => (
                    <div key={moment.id} className="launch-tile grid gap-3 border bg-black/26 p-3 md:grid-cols-[176px_1fr]" style={{ borderColor: `${pack.border}38`, borderRadius: 8 }}>
                      <PackMomentPreview moment={moment} index={index} accent={pack.accent} />
                      <div>
                        <div className="text-xs font-black uppercase" style={{ color: pack.accent, letterSpacing: '0.1em' }}>{moment.category}</div>
                        <div className="moment-clamp-2 mt-1 text-[15px] font-black leading-tight text-white sm:text-base">{moment.title}</div>
                        <div className="mt-2 text-sm font-semibold text-white/50">{moment.creator}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <aside className="launch-panel border bg-black/52 p-5 shadow-[0_0_52px_rgba(0,0,0,0.22)]" style={{ borderColor: `${pack.border}66`, borderRadius: 8 }}>
                <div className="text-xs font-black uppercase" style={{ color: pack.accent, letterSpacing: '0.16em' }}>Buy Pack</div>
                <div className="mt-4 text-5xl font-black">${pack.price}</div>
                <div className="launch-tile mt-5 grid grid-cols-3 border bg-black/42" style={{ borderColor: `${pack.border}42`, borderRadius: 8 }}>
                  <button type="button" className="h-14 text-2xl text-white/42" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
                  <div className="flex h-14 items-center justify-center text-2xl font-black">{quantity}</div>
                  <button type="button" className="h-14 text-2xl text-white/72" onClick={() => setQuantity((value) => Math.min(9, value + 1))}>+</button>
                </div>
                <div className="mt-5 border-t border-white/12 pt-5">
                  <div className="flex justify-between text-xl font-black"><span>Total</span><span>${total.toFixed(2)} USD</span></div>
                </div>
              <button
                  type="button"
                  onClick={() => purchasePack(pack, quantity)}
                  className="mt-5 flex h-14 w-full items-center justify-center border text-sm font-black uppercase text-white transition-[box-shadow,transform,filter] hover:-translate-y-0.5 hover:brightness-110"
                  style={{
                    backgroundColor: BUY_BUTTON_BACKGROUND,
                    borderColor: BUY_BUTTON_BORDER,
                    borderRadius: 8,
                    boxShadow: BUY_BUTTON_SHADOW,
                    letterSpacing: '0.16em',
                  }}
                >
                  Buy Now
                </button>
              </aside>
            </div>

            <section className="launch-panel mt-5 border bg-black/24 p-5" style={{ borderColor: `${pack.border}42`, borderRadius: 8 }}>
              <h2 className="m-0 text-xl font-black text-white">Creators In This Pack</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {packCreators.map((creator) => (
                  <a
                    key={creator.handle}
                    href={creator.twitchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 border bg-black/24 p-3 text-white no-underline transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/[0.06]"
                    style={{ borderColor: `${pack.border}3d`, borderRadius: 8 }}
                  >
                    <img src={creator.avatar} alt="" className="h-12 w-12 rounded-full border border-white/22 object-cover object-top" />
                    <div className="min-w-0">
                      <div className="truncate font-black text-white">{creator.creator}</div>
                      <div className="truncate text-sm font-semibold text-[#54b9ff]">{creator.handle}</div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function DropPackSection() {
  const [activePackIndex, setActivePackIndex] = useState(0);
  const activePack = DROP_PACKS[activePackIndex];
  const availability = Math.round((activePack.remaining / activePack.supply) * 100);
  const stats = [
    { label: 'Moment', value: activePack.moment },
    { label: 'Supply', value: `${activePack.supply} packs` },
    { label: 'Remaining', value: `${activePack.remaining} packs` },
  ];

  const navigatePack = (direction: Direction) => {
    setActivePackIndex((current) =>
      direction === 'next'
        ? (current + 1) % DROP_PACKS.length
        : (current + DROP_PACKS.length - 1) % DROP_PACKS.length,
    );
  };

  return (
    <section
      id="drop-pack"
      className="relative min-h-[100svh] overflow-hidden bg-[#02050c] px-4 py-16 text-white sm:px-8 sm:py-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: activePack.background,
          transition: `background ${DURATION_MS}ms ${EASE}`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050506] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050506] to-transparent" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: activePack.grid,
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.16) 18px 19px, transparent 19px 44px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            `linear-gradient(90deg, transparent, ${activePack.accent}, rgba(255,255,255,0.75), transparent)`,
        }}
      />

      <div className="relative mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
        <div className="relative order-1 flex h-[440px] min-w-0 w-full items-end justify-center sm:h-[560px] lg:h-[720px]">
          <div
            className="absolute bottom-8 h-[38%] w-[72%] rounded-[50%] blur-3xl"
            style={{ backgroundColor: activePack.glow }}
          />
          <div
            className="absolute bottom-10 h-[46%] w-[86%]"
            style={{
              background:
                `linear-gradient(90deg, transparent 0 8%, ${activePack.border} 8.2% 8.8%, transparent 9%), linear-gradient(${activePack.border} 1px, transparent 1px)`,
              backgroundSize: '54px 54px',
              transform: 'perspective(760px) rotateX(64deg)',
              transformOrigin: 'bottom center',
              opacity: 0.52,
            }}
          />
          <button
            type="button"
            aria-label="Previous pack"
            onClick={() => navigatePack('prev')}
            className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center border bg-black/30 text-white backdrop-blur transition-transform hover:scale-105 sm:left-4 sm:h-14 sm:w-14"
            style={{ borderColor: activePack.border, borderRadius: 8 }}
          >
            <ArrowLeft size={26} strokeWidth={2.35} />
          </button>
          <a
            href={`/pack/${activePack.id}`}
            aria-label={`Open ${activePack.titleMain} pack`}
            className="group relative z-10 flex h-full max-w-[88vw] cursor-pointer items-end justify-center outline-none transition-transform duration-200 hover:scale-[1.025] focus-visible:scale-[1.025] lg:max-w-full"
          >
            <div
              className="relative flex h-full items-end justify-center"
              style={{
                transform: `translateY(${activePack.imageShiftY}) scale(${activePack.imageScale})`,
                transformOrigin: 'center center',
                transition: `filter ${DURATION_MS}ms ${EASE}, transform ${DURATION_MS}ms ${EASE}`,
              }}
            >
              <span
                className="pointer-events-none absolute inset-x-10 bottom-8 h-[72%] rounded-[48%] opacity-0 blur-3xl transition-opacity duration-200 group-hover:opacity-70 group-focus-visible:opacity-70"
                style={{ backgroundColor: activePack.glow }}
              />
              <img
                src={activePack.image}
                alt={`${activePack.titlePrefix} ${activePack.titleMain} ${activePack.titleSuffix}`}
                className="relative z-10 h-full w-auto object-contain drop-shadow-[0_42px_80px_rgba(0,91,255,0.45)] transition-[filter] duration-200 group-hover:brightness-110 group-focus-visible:brightness-110"
                style={{
                  filter: `drop-shadow(0 42px 80px ${activePack.glow})`,
                }}
                draggable={false}
              />
            </div>
          </a>
          <button
            type="button"
            aria-label="Next pack"
            onClick={() => navigatePack('next')}
            className="absolute right-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center border bg-black/30 text-white backdrop-blur transition-transform hover:scale-105 sm:right-4 sm:h-14 sm:w-14"
            style={{ borderColor: activePack.border, borderRadius: 8 }}
          >
            <ArrowRight size={26} strokeWidth={2.35} />
          </button>
        </div>

        <div className="order-2 min-w-0 pt-0 lg:pt-0">
          <p
            className="mb-5 text-xs font-bold uppercase sm:text-sm"
            style={{ color: activePack.accent, letterSpacing: '0.22em' }}
          >
            {activePack.eyebrow}
          </p>
          <h2
            className="flex min-h-[142px] max-w-[920px] flex-col justify-start text-[50px] uppercase leading-[0.9] text-white sm:min-h-[232px] sm:text-[86px] lg:min-h-[298px] lg:text-[110px]"
            style={{
              fontFamily: "'Anton', sans-serif",
              letterSpacing: '0',
              textShadow: `0 0 34px ${activePack.glow}`,
            }}
          >
            {activePack.titlePrefix} <span className="whitespace-nowrap">{activePack.titleMain}</span>{' '}
            {activePack.titleSuffix}
          </h2>
          <div className="mt-5 flex min-h-5 flex-wrap items-center gap-2">
            {DROP_PACKS.map((pack, index) => (
              <button
                key={pack.id}
                type="button"
                aria-label={`Show ${pack.titleMain}`}
                onClick={() => {
                  setActivePackIndex(index);
                }}
                className="h-2.5 w-12 border transition-opacity hover:opacity-100"
                style={{
                  borderColor: pack.border,
                  backgroundColor: index === activePackIndex ? pack.accent : 'rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  opacity: index === activePackIndex ? 1 : 0.58,
                }}
              />
            ))}
          </div>

          <div className="mt-8 grid max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border px-5 py-4 shadow-[0_0_38px_rgba(0,92,255,0.14)] backdrop-blur"
                style={{
                  backgroundColor: `${activePack.panel}cc`,
                  borderColor: `${activePack.border}73`,
                  borderRadius: 8,
                }}
              >
                <div
                  className="text-[11px] font-bold uppercase"
                  style={{ color: activePack.accent, letterSpacing: '0.14em' }}
                >
                  {stat.label}
                </div>
                <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 max-w-[720px]">
            <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-white/70">
              <span style={{ letterSpacing: '0.12em' }}>Pack availability</span>
              <span>{availability}%</span>
            </div>
            <div
              className="h-3 overflow-hidden border bg-black/45"
              style={{ borderColor: `${activePack.border}73`, borderRadius: 8 }}
            >
              <div
                className="h-full"
                style={{
                  width: `${availability}%`,
                  backgroundColor: activePack.accent,
                  boxShadow: `0 0 24px ${activePack.glow}`,
                }}
              />
            </div>
          </div>

          <div className="mt-8 max-w-[720px]">
            <a
              href={`/market/pack/${activePack.id}`}
              className="flex h-16 items-center justify-center border px-7 text-base font-black uppercase text-white no-underline transition-[box-shadow,filter,transform] duration-150 hover:scale-[1.02] hover:brightness-110"
              style={{
                backgroundColor: activePack.button,
                borderColor: activePack.border,
                borderRadius: 10,
                boxShadow: `0 0 34px ${activePack.glow}`,
                letterSpacing: '0.22em',
              }}
            >
              BUY ${activePack.price}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function MomentPreview({ moment }: { moment: Moment }) {
  return (
    <div className="relative h-full overflow-hidden bg-black">
      <div
        className="moment-reel absolute inset-[-18%]"
        style={{
          background: moment.scene,
          filter: 'saturate(1.24) contrast(1.08)',
        }}
      />
      <div
        className="moment-scan absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-70"
        style={{
          background:
            'linear-gradient(90deg, transparent 0 42%, rgba(255,255,255,0.68) 48%, transparent 56%), repeating-linear-gradient(0deg, transparent 0 12px, rgba(255,255,255,0.12) 12px 13px)',
        }}
      />
      <div
        className="absolute inset-5 border opacity-55 transition-opacity duration-300 group-hover:opacity-100"
        style={{ borderColor: moment.accent, borderRadius: 8, boxShadow: `0 0 36px ${moment.accent}55` }}
      />
      <div
        className="absolute left-8 top-8 h-24 w-24 border opacity-80 transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-2"
        style={{ borderColor: moment.accent, borderRadius: 999 }}
      />
      <div
        className="absolute bottom-7 right-7 h-32 w-32 border opacity-60 transition-transform duration-500 group-hover:-translate-x-5 group-hover:-translate-y-3"
        style={{ borderColor: moment.accent, borderRadius: 12 }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/18 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase text-white backdrop-blur">
        <Radio size={13} strokeWidth={2.4} style={{ color: moment.accent }} />
        <span style={{ letterSpacing: '0.12em' }}>{moment.duration}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex h-16 w-16 items-center justify-center border bg-black/36 text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
          style={{ borderColor: `${moment.accent}cc`, borderRadius: 999, boxShadow: `0 0 42px ${moment.accent}66` }}
        >
          <Play size={25} fill="currentColor" strokeWidth={0} />
        </div>
      </div>
      {moment.videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          src={moment.videoSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
      ) : null}
    </div>
  );
}

function MomentsCarouselSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeMomentPageRef = useRef(0);
  const [activeMomentIndex, setActiveMomentIndex] = useState(0);

  const getMomentPages = () => {
    const track = trackRef.current ?? (document.querySelector('#moments .moments-scroll') as HTMLDivElement | null);

    if (!track) {
      return null;
    }

    const children = Array.from(track.children) as HTMLElement[];

    if (children.length === 0) {
      return null;
    }

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const pages = children
      .map((child, index) => ({
        index,
        left: Math.max(0, child.offsetLeft - track.offsetLeft),
      }))
      .filter((page) => page.left <= maxScrollLeft - 2);

    const lastPage = pages[pages.length - 1];

    if (maxScrollLeft > 0 && (!lastPage || Math.abs(lastPage.left - maxScrollLeft) > 2)) {
      const closestIndex = children.reduce((closest, child, index) => {
        const left = Math.max(0, child.offsetLeft - track.offsetLeft);
        const closestLeft = Math.max(0, children[closest].offsetLeft - track.offsetLeft);

        return Math.abs(left - maxScrollLeft) < Math.abs(closestLeft - maxScrollLeft) ? index : closest;
      }, 0);

      pages.push({ index: closestIndex, left: maxScrollLeft });
    }

    return { track, pages, scrollLeft: track.scrollLeft };
  };

  const scrollMoments = (direction: Direction) => {
    const state = getMomentPages();

    if (!state || state.pages.length === 0) {
      return;
    }

    const currentPage = state.pages.reduce((closestIndex, page, index) => {
      const closest = state.pages[closestIndex];
      return Math.abs(page.left - state.scrollLeft) < Math.abs(closest.left - state.scrollLeft) ? index : closestIndex;
    }, 0);
    const nextPage =
      direction === 'next'
        ? (currentPage + 1) % state.pages.length
        : (currentPage + state.pages.length - 1) % state.pages.length;
    const nextMomentIndex = state.pages[nextPage].index;

    activeMomentPageRef.current = nextPage;
    setActiveMomentIndex(nextMomentIndex);
    state.track.scrollTo({ left: state.pages[nextPage].left, behavior: 'smooth' });
  };

  return (
    <section
      id="moments"
      className="relative overflow-hidden bg-[#050506] px-4 py-16 text-white sm:px-8 sm:py-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 14% 18%, rgba(42,95,255,0.28), transparent 26%), radial-gradient(circle at 88% 22%, rgba(255,90,162,0.18), transparent 24%), linear-gradient(135deg, #050506 0%, #070817 48%, #030304 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 88%, transparent)',
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <h2
              className="text-[44px] uppercase leading-none text-white sm:text-[76px]"
              style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}
            >
              Moments
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Previous moments"
              onClick={() => scrollMoments('prev')}
              className="flex h-11 w-11 items-center justify-center border border-white/20 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/12 sm:h-12 sm:w-12"
              style={{ borderRadius: 8 }}
            >
              <ArrowLeft size={23} strokeWidth={2.35} />
            </button>
            <button
              type="button"
              aria-label="Next moments"
              onClick={() => scrollMoments('next')}
              className="flex h-11 w-11 items-center justify-center border border-white/20 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/12 sm:h-12 sm:w-12"
              style={{ borderRadius: 8 }}
            >
              <ArrowRight size={23} strokeWidth={2.35} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="moments-scroll -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-5 sm:-mx-8 sm:gap-6 sm:px-8"
        >
          {MOMENTS.map((moment) => (
            <a
              key={moment.id}
              href={`/market/moment/${encodeURIComponent(moment.marketMomentId)}`}
              className="group relative h-[560px] min-w-[300px] snap-start overflow-hidden border bg-black text-white no-underline shadow-[0_28px_90px_rgba(0,0,0,0.4)] transition-[border-color,transform] hover:-translate-y-1 sm:h-[620px] sm:min-w-[390px]"
              aria-current={MOMENTS[activeMomentIndex].id === moment.id ? 'true' : undefined}
              style={{
                borderColor: `${moment.accent}66`,
                borderRadius: 8,
                background: `linear-gradient(180deg, #050505 0%, ${moment.panel} 100%)`,
              }}
            >
              <div className="relative h-[54%] border-b border-white/10">
                <MomentPreview moment={moment} />
              </div>

              <div className="relative flex h-[46%] flex-col px-5 py-5">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${moment.accent}, transparent)`,
                  }}
                />
                <div className="mb-4 flex min-h-9 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {moment.rarity === 'Legendary' ? (
                      <span
                        className="inline-flex h-8 items-center border bg-black/35 px-3 text-[11px] font-semibold uppercase"
                        style={{
                          borderColor: `${moment.accent}66`,
                          color: moment.accent,
                          borderRadius: 999,
                          letterSpacing: '0.14em',
                        }}
                      >
                        Legendary
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="inline-flex h-8 items-center border bg-black/25 px-3 text-[11px] font-semibold uppercase"
                      style={{
                        borderColor: `${moment.accent}45`,
                        color: moment.accent,
                        borderRadius: 999,
                        letterSpacing: '0.14em',
                      }}
                    >
                      {moment.serial}
                    </span>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                  <div
                    className="flex h-14 min-w-0 flex-1 items-center gap-3 border bg-black/32 px-3"
                    style={{
                      borderColor: `${moment.accent}55`,
                      borderRadius: 6,
                      boxShadow: `inset 0 0 24px ${moment.accent}12`,
                    }}
                  >
                    <img
                      src={moment.avatar}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                      draggable={false}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold uppercase text-white">{moment.creator}</div>
                      <div className="truncate text-[11px] font-semibold text-white/45">{moment.handle}</div>
                    </div>
                  </div>
                </div>

                <div
                  className="mb-3 inline-flex border px-3 py-1.5 text-[11px] font-semibold uppercase"
                  style={{ borderColor: `${moment.accent}66`, color: moment.accent, borderRadius: 999, letterSpacing: '0.14em' }}
                >
                  {moment.category}
                </div>
                <h3 className="moment-clamp-2 max-w-[94%] text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {moment.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

type AuthMode = 'login' | 'register' | 'forgot';

type AuthErrors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-1.99 3.02v2.47h3.22c1.88-1.73 2.99-4.29 2.99-7.48Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.22-2.47c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.11H3.09v2.55A9.98 9.98 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.95A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.95V7.5H3.09A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.09 4.5l3.32-2.55Z" />
      <path fill="#EA4335" d="M12 5.94c1.46 0 2.77.5 3.8 1.48l2.86-2.86C16.95 2.97 14.69 2 12 2a9.98 9.98 0 0 0-8.91 5.5l3.32 2.55C7.2 7.69 9.4 5.94 12 5.94Z" />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#5865F2" d="M19.54 5.34A16.4 16.4 0 0 0 15.45 4c-.18.32-.38.76-.52 1.1a15.24 15.24 0 0 0-4.54 0A8.13 8.13 0 0 0 9.86 4c-1.43.25-2.8.7-4.09 1.34-2.59 3.86-3.29 7.62-2.94 11.32a16.5 16.5 0 0 0 5.01 2.54c.4-.55.76-1.13 1.07-1.75-.59-.22-1.15-.49-1.68-.8.14-.1.28-.21.41-.32a11.72 11.72 0 0 0 10.02 0c.14.11.27.22.41.32-.53.31-1.09.58-1.68.8.31.62.67 1.2 1.07 1.75a16.45 16.45 0 0 0 5.01-2.54c.42-4.29-.72-8.01-2.93-11.32ZM8.73 14.38c-.98 0-1.78-.9-1.78-2s.79-2 1.78-2c1 0 1.8.9 1.78 2 0 1.1-.79 2-1.78 2Zm6.58 0c-.98 0-1.78-.9-1.78-2s.79-2 1.78-2c1 0 1.8.9 1.78 2 0 1.1-.78 2-1.78 2Z" />
    </svg>
  );
}

function AuthPage({ mode }: { mode: AuthMode }) {
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [notice, setNotice] = useState('');

  const validate = () => {
    const nextErrors: AuthErrors = {};

    if (isRegister && name.trim().length < 2) {
      nextErrors.name = 'Enter your collector name.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email.';
    }

    if (!isForgot && password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const completeAuth = () => {
    window.location.href = getRedirectTarget('/account');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      try {
        if (isForgot) {
          const requestedEmail = email.trim().toLowerCase();
          const userExists = getStoredUsers().some((user) => user.email === requestedEmail);

          setNotice(
            userExists
              ? 'Reset instructions are ready for this demo account. In production this will be sent by email.'
              : 'If this email is connected to a GGBOX account, reset instructions will be sent there.',
          );
          trackEvent('password_reset_requested', { method: 'email' });
          setIsSubmitting(false);
          return;
        }

        if (isRegister) {
          registerUser(name, email, password);
          trackEvent('signup_completed', { method: 'email' });
        } else {
          loginUser(email, password);
          trackEvent('login_completed', { method: 'email' });
        }

        completeAuth();
      } catch (error) {
        setErrors({
          form:
            isRegister && error instanceof Error && error.message === 'User already exists'
              ? 'This email is already registered. Sign in instead.'
              : isRegister
                ? 'Account could not be created. Check the fields and try again.'
                : 'Email or password is incorrect.',
        });
        setIsSubmitting(false);
      }
    }, 360);
  };

  const handleProvider = (provider: 'google' | 'discord') => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      signInWithDemoProvider(provider);
      trackEvent('login_completed', { method: provider });
      completeAuth();
    }, 260);
  };

  const pageTitle = isForgot ? 'Reset Access' : isRegister ? 'Create Account' : 'Sign In';
  const formTitle = isForgot ? 'Reset password' : isRegister ? 'Create account' : 'Sign in';
  const intro =
    isForgot
      ? 'Enter the email connected to your GGBOX vault. We will prepare reset instructions for your collector account.'
      : isRegister
        ? 'Create a collector vault for buying drops, opening packs, and keeping your GGBOX moments in one place.'
        : 'Access your GGBOX vault to manage balance, sealed packs, owned moments, and active market listings.';
  const authHighlights = [
    ['Wallet', '$500 demo balance'],
    ['Drops', 'Buy packs and open moments'],
    ['Market', 'List or collect moments'],
  ] as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03060a] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 16% 14%, rgba(84,185,255,0.24), transparent 28%), radial-gradient(circle at 86% 20%, rgba(140,255,47,0.14), transparent 24%), linear-gradient(135deg, #03060a 0%, #07111b 54%, #030406 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <MarketHeader active="account" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-6xl items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.94fr)_430px]">
        <div className="min-w-0">
          <h1 className="max-w-full text-[44px] uppercase leading-none text-white sm:text-[104px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>
            {pageTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/62 sm:text-lg sm:leading-8">
            {intro}
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {authHighlights.map(([label, value]) => (
              <div key={label} className="border border-white/10 bg-black/28 p-4" style={{ borderRadius: 8 }}>
                <div className="text-[10px] font-black uppercase text-white/42" style={{ letterSpacing: '0.12em' }}>{label}</div>
                <div className="mt-2 text-sm font-black text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full min-w-0 border border-white/14 bg-black/58 p-5 shadow-[0_0_70px_rgba(84,185,255,0.14)] backdrop-blur"
          style={{ borderRadius: 8, maxWidth: 'calc(100vw - 2rem)' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">{formTitle}</h2>
            </div>
            <UserCircle size={34} className="text-white/72" />
          </div>

          <div className="mt-6 grid gap-4">
            {isRegister ? (
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase text-white/68" style={{ letterSpacing: '0.12em' }}>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                  className="h-12 border border-white/14 bg-white/[0.06] px-4 text-white outline-none transition-colors focus:border-[#54b9ff]"
                  style={{ borderRadius: 8 }}
                  autoComplete="name"
                />
                {errors.name ? <span className="text-sm font-semibold text-[#ff5a6f]">{errors.name}</span> : null}
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-white/68" style={{ letterSpacing: '0.12em' }}>Email</span>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/38" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  className="h-12 w-full border border-white/14 bg-white/[0.06] pl-11 pr-4 text-white outline-none transition-colors focus:border-[#54b9ff]"
                  style={{ borderRadius: 8 }}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              {errors.email ? <span className="text-sm font-semibold text-[#ff5a6f]">{errors.email}</span> : null}
            </label>

            {!isForgot ? (
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase text-white/68" style={{ letterSpacing: '0.12em' }}>Password</span>
                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/38" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    className="h-12 w-full border border-white/14 bg-white/[0.06] pl-11 pr-12 text-white outline-none transition-colors focus:border-[#54b9ff]"
                    style={{ borderRadius: 8 }}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white/54 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password ? <span className="text-sm font-semibold text-[#ff5a6f]">{errors.password}</span> : null}
              </label>
            ) : null}
          </div>

          {!isRegister && !isForgot ? (
            <a href="/forgot-password" className="mt-3 inline-flex text-sm font-bold text-[#54b9ff] no-underline hover:text-white">
              Forgot password?
            </a>
          ) : null}

          {errors.form ? <div className="mt-4 border border-[#ff5a6f]/36 bg-[#ff5a6f]/10 px-3 py-2 text-sm font-semibold text-[#ff8a9a]" style={{ borderRadius: 8 }}>{errors.form}</div> : null}
          {notice ? <div className="mt-4 border border-[#54b9ff]/34 bg-[#54b9ff]/10 px-3 py-2 text-sm font-semibold text-[#8fd2ff]" style={{ borderRadius: 8 }}>{notice}</div> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 border border-[#54b9ff] bg-[#315eff] text-sm font-black uppercase text-white transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            style={{ borderRadius: 8, letterSpacing: '0.14em', boxShadow: BUY_BUTTON_SHADOW }}
          >
            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 size={18} />}
            {isForgot ? 'Send Reset Link' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          {!isForgot ? (
            <>
              <div className="my-5 h-px bg-white/10" />

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => handleProvider('google')}
                  className="flex h-12 items-center justify-center gap-3 border border-white/14 bg-white/[0.06] text-sm font-black text-white transition-colors hover:bg-white/[0.10]"
                  style={{ borderRadius: 8 }}
                >
                  <GoogleMark /> Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => handleProvider('discord')}
                  className="flex h-12 items-center justify-center gap-3 border border-white/14 bg-white/[0.06] text-sm font-black text-white transition-colors hover:bg-white/[0.10]"
                  style={{ borderRadius: 8 }}
                >
                  <DiscordMark /> Continue with Discord
                </button>
              </div>
            </>
          ) : null}

          <div className="mt-5 text-center text-sm font-semibold text-white/58">
            {isForgot ? 'Remembered your password?' : isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a href={isForgot || isRegister ? '/login' : '/register'} className="font-black text-[#54b9ff] no-underline hover:text-white">
              {isForgot || isRegister ? 'Sign in' : 'Register'}
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}

type AccountTab = 'overview' | 'collection' | 'activity';

function getInitialAccountTab(): AccountTab {
  if (typeof window === 'undefined') {
    return 'overview';
  }

  const tab = new URLSearchParams(window.location.search).get('tab');
  return tab === 'collection' || tab === 'activity' ? tab : 'overview';
}

function OwnedMomentCard({ moment }: { moment: OwnedMomentData }) {
  const listing = getListingForOwnedMoment(moment.id);
  const costLabel = getOwnedMomentCostLabel(moment);

  return (
    <a href={`/account/moment/${encodeURIComponent(moment.id)}`} className="launch-panel group block overflow-hidden bg-black/38 p-4 text-white no-underline shadow-[inset_0_0_0_1px_rgba(84,185,255,0.18),0_22px_70px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-1" style={{ borderRadius: 8 }}>
      <HoverVideoFrame videoUrl={moment.videoUrl} thumbnailUrl={moment.thumbnailUrl}>
        <div className="launch-chip absolute left-3 top-3 border border-white/18 bg-black/54 px-3 py-1 text-[10px] font-black uppercase text-white backdrop-blur" style={{ borderRadius: 999, letterSpacing: '0.1em' }}>
          {moment.rarity}
        </div>
        <div className="absolute right-3 bottom-3 bg-black/58 px-3 py-1 text-xs font-black text-white" style={{ borderRadius: 999 }}>{moment.serial}</div>
        {listing ? (
          <div className="launch-chip absolute right-3 top-3 border border-[#8cff2f]/48 bg-[#8cff2f]/14 px-3 py-1 text-[10px] font-black uppercase text-[#8cff2f]" style={{ borderRadius: 999, letterSpacing: '0.1em' }}>
            Listed ${listing.price.toFixed(2)}
          </div>
        ) : null}
      </HoverVideoFrame>
      <h3 className="moment-clamp-2 mt-4 min-h-[3rem] text-lg font-black leading-tight">{moment.title}</h3>
      <div className="mt-4 flex items-center gap-3">
        <img src={moment.avatar} alt="" className="h-10 w-10 rounded-full object-cover object-top" />
        <div className="min-w-0">
          <div className="truncate text-sm font-black">{moment.creator}</div>
          <div className="truncate text-xs font-semibold text-white/48">{moment.packTitle}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>{costLabel.label}</div>
          <div className="text-sm font-black">{costLabel.value}</div>
        </div>
      </div>
    </a>
  );
}

function PublicListedMomentCard({
  moment,
  price,
  returnPath,
}: {
  moment: OwnedMomentData;
  price: number;
  returnPath: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const startPreview = () => {
    startHoverVideoPreview(videoRef.current);
  };

  const resetPreview = () => {
    resetHoverVideoPreview(videoRef.current);
  };

  return (
    <article
      className="group overflow-hidden bg-black/34 p-4 text-white shadow-[inset_0_0_0_1px_rgba(84,185,255,0.18),0_22px_70px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-1"
      style={{ borderRadius: 8 }}
      onMouseEnter={startPreview}
      onMouseLeave={resetPreview}
      onFocus={startPreview}
      onBlur={resetPreview}
      tabIndex={0}
    >
      <div className="relative aspect-video overflow-hidden bg-black" style={{ borderRadius: 8 }}>
        {moment.videoUrl ? (
          <video
            ref={videoRef}
            src={moment.videoUrl}
            poster={moment.thumbnailUrl}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            muted
            playsInline
            preload="metadata"
          />
        ) : null}
        <div className="launch-chip absolute left-3 top-3 border border-white/18 bg-black/54 px-3 py-1 text-[10px] font-black uppercase text-white backdrop-blur" style={{ borderRadius: 999, letterSpacing: '0.1em' }}>
          {moment.rarity}
        </div>
        <div className="absolute right-3 top-3 border border-[#8cff2f]/48 bg-[#8cff2f]/14 px-3 py-1 text-[10px] font-black uppercase text-[#8cff2f]" style={{ borderRadius: 999, letterSpacing: '0.1em' }}>
          ${price.toFixed(2)}
        </div>
      </div>
      <h3 className="moment-clamp-2 mt-4 min-h-[3rem] text-lg font-black leading-tight">{moment.title}</h3>
      <div className="mt-4 flex items-center gap-3">
        <img src={moment.avatar} alt="" className="h-10 w-10 rounded-full object-cover object-top" />
        <div className="min-w-0">
          <div className="truncate text-sm font-black">{moment.creator}</div>
          <div className="truncate text-xs font-semibold text-white/48">{moment.packTitle}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>For sale</div>
          <div className="text-sm font-black">${price.toFixed(2)}</div>
        </div>
      </div>
      <a
        href={`/market/moment/${encodeURIComponent(moment.sourceId)}?return=${encodeURIComponent(returnPath)}`}
        className="mt-4 flex h-11 items-center justify-center border border-[#54b9ff] bg-[#315eff] text-xs font-black uppercase text-white no-underline transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
        style={{ borderRadius: 8, letterSpacing: '0.12em', boxShadow: BUY_BUTTON_SHADOW }}
      >
        Buy Moment
      </a>
    </article>
  );
}

function OwnedPackCard({ pack }: { pack: OwnedPackData }) {
  return (
    <article className="launch-panel grid gap-4 border bg-black/36 p-4 sm:grid-cols-[130px_minmax(0,1fr)]" style={{ borderColor: `${pack.accent}42`, borderRadius: 8 }}>
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-visible">
        <div className="absolute bottom-2 h-1/2 w-4/5 rounded-[50%] blur-2xl" style={{ backgroundColor: pack.accent, opacity: 0.32 }} />
        <img src={pack.image} alt="" className="relative z-10 h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-black uppercase" style={{ color: pack.accent, letterSpacing: '0.14em' }}>Sealed Pack</div>
        <h3 className="mt-2 text-2xl font-black text-white">{pack.title}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
            <div className="text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>Owned</div>
            <div className="mt-1 text-xl font-black">{pack.quantity}</div>
          </div>
          <div className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
            <div className="text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>Cost</div>
            <div className="mt-1 text-xl font-black">${pack.price}</div>
          </div>
        </div>
        <a
          href={`/account/open/${pack.packId}`}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 border text-sm font-black uppercase text-white no-underline transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
          style={{ backgroundColor: pack.accent, borderColor: pack.accent, borderRadius: 8, letterSpacing: '0.14em' }}
        >
          <PackageOpen size={18} /> Open Pack
        </a>
      </div>
    </article>
  );
}

function getProviderLabel(provider: StoredUser['provider']) {
  if (provider === 'google') return 'Google';
  if (provider === 'discord') return 'Discord';
  return 'Email';
}

function AccountAvatarArtwork({
  user,
  collectorScore,
  compact = false,
}: {
  user: StoredUser;
  collectorScore: number;
  compact?: boolean;
}) {
  const collectorLevel = Math.max(1, Math.floor(collectorScore / 240) + 1);

  return (
    <div className={compact ? 'relative h-20 w-20 shrink-0' : 'relative mx-auto h-[172px] w-full max-w-[260px]'}>
      <div
        className="launch-panel absolute inset-0 border border-white/12 bg-black/36"
        style={{
          borderRadius: compact ? 8 : 10,
          background:
            'linear-gradient(135deg, rgba(84,185,255,0.14), rgba(255,255,255,0.03) 38%, rgba(49,94,255,0.16))',
          boxShadow: 'inset 0 0 0 1px rgba(84,185,255,0.12), 0 28px 70px rgba(0,0,0,0.28)',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          borderRadius: compact ? 8 : 10,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: compact ? '18px 18px' : '24px 24px',
          maskImage: 'linear-gradient(135deg, black, transparent 78%)',
        }}
      />
      <div
        className={compact ? 'absolute left-1 top-1 h-[72px] w-[72px]' : 'absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2'}
        style={{
          borderRadius: 999,
          background:
            'conic-gradient(from 210deg, rgba(84,185,255,0.95), rgba(140,255,47,0.92), rgba(255,90,162,0.86), rgba(84,185,255,0.95))',
          padding: compact ? 3 : 4,
          boxShadow: '0 0 44px rgba(84,185,255,0.28)',
        }}
      >
        <div className="h-full w-full rounded-full bg-[#06090f] p-1.5">
          <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
        </div>
      </div>
      <div
        className={compact ? 'absolute bottom-1 right-1 h-5 w-5' : 'absolute left-[calc(50%+34px)] top-[96px] h-8 w-8'}
        style={{
          borderRadius: 999,
          backgroundColor: '#8cff2f',
          border: compact ? '3px solid #06090f' : '4px solid #06090f',
          boxShadow: '0 0 22px rgba(140,255,47,0.62)',
        }}
        aria-hidden="true"
      />
      {!compact ? (
        <>
          <div
            className="absolute left-4 top-4 inline-flex h-8 items-center gap-2 border border-[#54b9ff]/36 bg-[#54b9ff]/12 px-3 text-[10px] font-black uppercase text-[#54b9ff]"
            style={{ borderRadius: 999, letterSpacing: '0.12em' }}
          >
            <ShieldCheck size={13} /> Verified
          </div>
          <div
            className="launch-panel-quiet absolute bottom-4 left-4 right-4 grid grid-cols-[1fr_auto] items-center gap-3 border border-white/10 bg-black/44 px-3 py-2 backdrop-blur"
            style={{ borderRadius: 8 }}
          >
            <div className="min-w-0">
              <div className="truncate text-xs font-black uppercase text-white">{user.handle}</div>
              <div className="mt-1 text-[10px] font-bold uppercase text-white/42" style={{ letterSpacing: '0.1em' }}>
                {getProviderLabel(user.provider)} access
              </div>
            </div>
            <div className="launch-chip border border-white/14 bg-white/[0.06] px-2.5 py-1 text-[10px] font-black text-white" style={{ borderRadius: 999 }}>
              LVL {collectorLevel}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AccountIdentityBlock({ user, joined = true }: { user: StoredUser; joined?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <img src={user.avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
      <div className="min-w-0">
        <div className="truncate text-2xl font-black text-white">{user.name}</div>
        <div className="truncate text-sm font-semibold text-[#54b9ff]">{user.handle}</div>
        {joined ? <div className="mt-1 text-xs font-semibold text-white/42">Joined {formatDate(user.joinedAt)}</div> : null}
      </div>
    </div>
  );
}

function AccountDashboardPage() {
  const user = getActiveUser();
  const [activeTab, setActiveTab] = useState<AccountTab>(getInitialAccountTab);
  const [inventory, setInventory] = useState<AccountInventory | null>(() => (user ? ensureAccountInventoryFilled(user) : null));
  const [flashMessage, setLocalFlashMessage] = useState<FlashMessageData | null>(() => consumeFlashMessage());
  const [momentQuery, setMomentQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [packFilter, setPackFilter] = useState('All');

  if (!user) {
    return <AuthPage mode="login" />;
  }

  const safeInventory = inventory ?? ensureAccountInventoryFilled(user);
  const balance = getBalance(safeInventory);
  const sealedPackCount = safeInventory.packs.reduce((total, pack) => total + pack.quantity, 0);
  const legendaryCount = safeInventory.moments.filter((moment) => moment.rarity === 'Legendary').length;
  const standardCount = safeInventory.moments.length - legendaryCount;
  const rarityOptions = ['All', ...Array.from(new Set(safeInventory.moments.map((moment) => moment.rarity)))];
  const packOptions = ['All', ...Array.from(new Set(safeInventory.moments.map((moment) => moment.packTitle)))];
  const normalizedQuery = momentQuery.trim().toLowerCase();
  const filteredMoments = safeInventory.moments.filter((moment) => {
    const matchesQuery =
      !normalizedQuery ||
      `${moment.title} ${moment.creator} ${moment.category} ${moment.packTitle}`.toLowerCase().includes(normalizedQuery);
    const matchesRarity = rarityFilter === 'All' || moment.rarity === rarityFilter;
    const matchesPack = packFilter === 'All' || moment.packTitle === packFilter;
    return matchesQuery && matchesRarity && matchesPack;
  });
  const collectionBadges = [
    {
      label: 'Standard Moments',
      value: String(standardCount),
      detail: 'ordinary moments',
      active: standardCount > 0,
      accent: '#54b9ff',
    },
    {
      label: 'Legendary Moments',
      value: String(legendaryCount),
      detail: 'legendary moments',
      active: legendaryCount > 0,
      accent: '#ff5aa2',
    },
    {
      label: 'Sealed Packs',
      value: String(sealedPackCount),
      detail: 'packs ready',
      active: sealedPackCount > 0,
      accent: '#8cff2f',
    },
  ];

  const openPack = (packId: string) => {
    setInventory(openOwnedPack(user, packId));
    setActiveTab('collection');
  };

  const signOut = () => {
    logoutUser();
    window.location.href = '/';
  };

  const tabs: Array<{ id: AccountTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'collection', label: 'Collection' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070b] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AppAmbientBackdrop />
      <MarketHeader active="account" />

      <section className="relative z-10 mx-auto max-w-[1680px] pb-20 pt-14">
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="h-fit p-1">
            <AccountIdentityBlock user={user} />

            <div className="mt-6 grid gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex h-12 items-center justify-between border px-4 text-left text-xs font-black uppercase transition-colors"
                  style={{
                    borderColor: activeTab === tab.id ? '#54b9ff' : 'rgba(255,255,255,0.10)',
                    backgroundColor: activeTab === tab.id ? 'rgba(84,185,255,0.14)' : 'rgba(255,255,255,0.035)',
                    borderRadius: 8,
                    letterSpacing: '0.12em',
                  }}
                >
                  {tab.label}
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeTab === tab.id ? '#54b9ff' : 'rgba(255,255,255,0.22)' }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={signOut}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 border border-white/12 bg-white/[0.04] text-xs font-black uppercase text-white/72 transition-colors hover:bg-white/[0.08] hover:text-white"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
            <a
              href={`/u/${encodeURIComponent(user.handle.replace('@', ''))}`}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 border border-[#54b9ff]/32 bg-[#54b9ff]/10 text-xs font-black uppercase text-[#54b9ff] no-underline transition-colors hover:bg-[#54b9ff]/16"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
            >
              <ExternalLink size={15} /> Public Profile
            </a>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="flex min-w-0 items-end gap-4">
                <div className="min-w-0">
                  <h1 className="mt-3 text-[54px] uppercase leading-none sm:text-[100px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>Account</h1>
                </div>
              </div>
              <a
                href="/market"
                className="flex h-12 items-center justify-center gap-2 border border-[#54b9ff] bg-[#315eff] px-5 text-xs font-black uppercase text-white no-underline transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
                style={{ borderRadius: 8, letterSpacing: '0.14em', boxShadow: BUY_BUTTON_SHADOW }}
              >
                <ShoppingBag size={17} /> Go to Market
              </a>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Balance', value: `$${balance.toFixed(2)}`, icon: Wallet },
                { label: 'Moments', value: String(safeInventory.moments.length), icon: Video },
                { label: 'Sealed Packs', value: String(sealedPackCount), icon: PackageOpen },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="launch-tile border border-white/10 bg-black/30 p-4" style={{ borderRadius: 8 }}>
                    <div className="flex items-center gap-2 text-[#54b9ff]">
                      <Icon size={17} />
                      <span className="text-[10px] font-black uppercase text-white/42" style={{ letterSpacing: '0.1em' }}>{stat.label}</span>
                    </div>
                    <div className="mt-3 text-3xl font-black">{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {activeTab === 'overview' ? (
              <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="launch-panel border border-white/10 bg-black/26 p-5" style={{ borderRadius: 8 }}>
                  <h2 className="text-2xl font-black">Recent Collection</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {safeInventory.moments.slice(0, 4).map((moment) => (
                      <OwnedMomentCard key={moment.id} moment={moment} />
                    ))}
                    {safeInventory.moments.length === 0 ? (
                      <div className="border border-dashed border-white/16 bg-white/[0.03] p-6 text-sm font-semibold text-white/54" style={{ borderRadius: 8 }}>
                        No moments yet. Buy a moment or open a sealed pack to start the collection.
                      </div>
                    ) : null}
                  </div>
                </section>
                <div className="grid gap-5">
                  <section className="launch-panel border border-white/10 bg-black/26 p-5" style={{ borderRadius: 8 }}>
                    <h2 className="text-2xl font-black">Collection Bag</h2>
                    <div className="mt-4 grid gap-3">
                      {collectionBadges.map((badge) => (
                        <div
                          key={badge.label}
                          className="launch-tile flex items-center gap-3 border bg-white/[0.04] p-3"
                          style={{
                            borderColor: badge.active ? `${badge.accent}66` : 'rgba(255,255,255,0.10)',
                            borderRadius: 8,
                            opacity: badge.active ? 1 : 0.58,
                          }}
                        >
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center border text-lg font-black"
                            style={{
                              borderColor: badge.active ? badge.accent : 'rgba(255,255,255,0.16)',
                              color: badge.active ? badge.accent : 'rgba(255,255,255,0.34)',
                              borderRadius: 999,
                              boxShadow: badge.active ? `0 0 24px ${badge.accent}30` : 'none',
                            }}
                          >
                            {badge.value}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-white">{badge.label}</div>
                            <div className="mt-1 truncate text-xs font-semibold text-white/44">{badge.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : null}

            {activeTab === 'collection' ? (
              <div className="mt-7 grid gap-6">
                <section>
                  <h2 className="text-2xl font-black">Sealed Packs</h2>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {safeInventory.packs.map((pack) => (
                      <OwnedPackCard key={pack.id} pack={pack} />
                    ))}
                    {safeInventory.packs.length === 0 ? (
                      <div className="overflow-x-auto whitespace-nowrap border border-dashed border-white/16 bg-white/[0.03] p-6 text-sm font-semibold text-white/54" style={{ borderRadius: 8 }}>
                        No sealed packs. Purchase a drop pack and it will appear here.
                      </div>
                    ) : null}
                  </div>
                </section>
                <section>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <h2 className="text-2xl font-black">Moments</h2>
                    <div className="grid w-full gap-2 md:w-auto md:grid-cols-[220px_150px_190px]">
                      <label className="relative block">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/38" />
                        <input
                          value={momentQuery}
                          onChange={(event) => setMomentQuery(event.currentTarget.value)}
                          className="launch-field h-11 w-full border border-white/12 bg-black/34 pl-9 pr-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#54b9ff]"
                          style={{ borderRadius: 8 }}
                          aria-label="Search collection"
                        />
                      </label>
                      <select
                        value={rarityFilter}
                        onChange={(event) => setRarityFilter(event.currentTarget.value)}
                        className="launch-field h-11 border border-white/12 bg-black/34 px-3 text-sm font-black text-white outline-none transition-colors focus:border-[#54b9ff]"
                        style={{ borderRadius: 8 }}
                        aria-label="Filter by rarity"
                      >
                        {rarityOptions.map((rarity) => (
                          <option key={rarity} value={rarity}>{rarity}</option>
                        ))}
                      </select>
                      <select
                        value={packFilter}
                        onChange={(event) => setPackFilter(event.currentTarget.value)}
                        className="launch-field h-11 border border-white/12 bg-black/34 px-3 text-sm font-black text-white outline-none transition-colors focus:border-[#54b9ff]"
                        style={{ borderRadius: 8 }}
                        aria-label="Filter by pack"
                      >
                        {packOptions.map((packTitle) => (
                          <option key={packTitle} value={packTitle}>{packTitle}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredMoments.map((moment) => (
                      <OwnedMomentCard key={moment.id} moment={moment} />
                    ))}
                    {filteredMoments.length === 0 ? (
                      <div className="border border-dashed border-white/16 bg-white/[0.03] p-6 text-sm font-semibold text-white/54" style={{ borderRadius: 8 }}>
                        No moments match this collection view.
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === 'activity' ? (
              <section className="launch-panel mt-7 border border-white/10 bg-black/26 p-5" style={{ borderRadius: 8 }}>
                <h2 className="text-2xl font-black">Activity</h2>
                <div className="mt-4 grid gap-3">
                  {safeInventory.activities.map((activity) => (
                    <div key={activity.id} className="launch-tile grid gap-3 border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[1fr_160px]" style={{ borderRadius: 8 }}>
                      <div>
                        <div className="font-black">{activity.label}</div>
                        <div className="mt-1 text-sm font-semibold text-white/50">{activity.detail}</div>
                      </div>
                      <div className="text-left sm:text-right">
                        {activity.amount ? <div className="font-black">${activity.amount.toFixed(2)}</div> : null}
                        <div className="text-xs font-semibold text-white/40">{formatActivityDate(activity.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>
      {flashMessage ? <FlashToast message={flashMessage} onDismiss={() => setLocalFlashMessage(null)} /> : null}
    </main>
  );
}

function AccountPackOpeningPage({ packId }: { packId: DropPack['id'] }) {
  const user = getActiveUser();
  const [revealedMoments, setRevealedMoments] = useState<OwnedMomentData[]>(() => {
    if (!user || typeof window === 'undefined') {
      return [];
    }

    const revealedIds = new URLSearchParams(window.location.search).get('revealed')?.split(',').filter(Boolean) ?? [];
    const inventory = getInventory(user.id);
    return revealedIds
      .map((momentId) => inventory.moments.find((moment) => moment.id === momentId))
      .filter((moment): moment is OwnedMomentData => Boolean(moment));
  });
  const [revealed, setRevealed] = useState(() => revealedMoments.length > 0);

  if (!user) {
    return <AuthPage mode="login" />;
  }

  const pack = getMarketPackById(packId);
  const inventory = getInventory(user.id);
  const ownedPack = inventory.packs.find((item) => item.packId === pack.id);

  const revealPack = () => {
    const beforeInventory = getInventory(user.id);
    const beforeIds = new Set(beforeInventory.moments.map((moment) => moment.id));
    const nextInventory = openOwnedPack(user, pack.id);
    const pulledMoments = nextInventory.moments.filter((moment) => !beforeIds.has(moment.id));

    setRevealedMoments(pulledMoments);
    setRevealed(true);

    if (typeof window !== 'undefined') {
      const revealedParam = pulledMoments.map((moment) => encodeURIComponent(moment.id)).join(',');
      window.history.replaceState(null, '', `/account/open/${pack.id}?revealed=${revealedParam}`);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02050c] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: pack.background }} />
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: grainSvg, backgroundSize: '200px 200px' }} />
      <MarketHeader active="account" />
      <section className="relative z-10 mx-auto max-w-[1440px] pb-20 pt-14">
        <a href="/account?tab=collection" className="inline-flex items-center gap-2 text-xs font-black uppercase text-white/70 no-underline" style={{ letterSpacing: '0.14em' }}>
          <ArrowLeft size={17} /> Back to Locker
        </a>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="relative min-h-[520px]">
            <div className="absolute inset-x-6 bottom-10 h-44 rounded-[50%] opacity-70 blur-3xl" style={{ backgroundColor: pack.glow }} />
            <img src={pack.image} alt="" className={`relative z-10 mx-auto max-h-[620px] w-auto max-w-full object-contain transition-[filter,transform] duration-700 ${revealed ? 'scale-90 opacity-70 saturate-[0.7]' : 'scale-100'}`} />
            {!revealed ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-28 w-28 animate-pulse rounded-full border" style={{ borderColor: pack.accent, boxShadow: `0 0 80px ${pack.glow}` }} />
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-black uppercase" style={{ color: pack.accent, letterSpacing: '0.18em' }}>Pack Opening</div>
            <h1 className="mt-4 text-[52px] uppercase leading-none sm:text-[96px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>
              {revealed ? 'Reveal Complete' : getPackDisplayTitle(pack)}
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/60">
              {revealed ? 'Your creator moments have been added to the locker.' : `Open one sealed ${getPackDisplayTitle(pack)} and reveal ${pack.moment} creator moments.`}
            </p>

            {!ownedPack && !revealed ? (
              <div className="mt-7 border border-white/12 bg-black/36 p-5 text-sm font-semibold text-white/58" style={{ borderRadius: 8 }}>
                You do not have this sealed pack in your locker.
              </div>
            ) : null}

            {!revealed ? (
              <button
                type="button"
                disabled={!ownedPack}
                onClick={revealPack}
                className="mt-7 flex h-14 w-full max-w-md items-center justify-center gap-2 border text-sm font-black uppercase text-white transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ backgroundColor: pack.button, borderColor: pack.border, borderRadius: 8, letterSpacing: '0.16em', boxShadow: `0 0 42px ${pack.glow}` }}
              >
                <PackageOpen size={19} /> Open Pack
              </button>
            ) : (
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {revealedMoments.map((moment, index) => (
                  <RevealedPackMomentCard
                    key={moment.id}
                    moment={moment}
                    index={index}
                    returnPath={getCurrentPathWithSearch()}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function RevealedPackMomentCard({
  moment,
  index,
  returnPath,
}: {
  moment: OwnedMomentData;
  index: number;
  returnPath: string;
}) {
  return (
    <article
      className="group border bg-black/42 p-3 text-white transition-transform hover:-translate-y-1"
      style={{
        borderColor: `${moment.accent}66`,
        borderRadius: 8,
        animation: `moment-reveal 560ms ease ${index * 140}ms both`,
      }}
    >
      <HoverVideoFrame videoUrl={moment.videoUrl} thumbnailUrl={moment.thumbnailUrl}>
        <div className="absolute left-3 top-3 border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-black uppercase" style={{ borderRadius: 999 }}>
          {moment.rarity}
        </div>
      </HoverVideoFrame>
      <h2 className="moment-clamp-2 mt-3 min-h-[2.65rem] text-base font-black leading-tight">{moment.title}</h2>
      <div className="mt-3 text-xs font-black uppercase" style={{ color: moment.accent, letterSpacing: '0.1em' }}>{moment.serial}</div>
      <a
        href={`/account/moment/${encodeURIComponent(moment.id)}?return=${encodeURIComponent(returnPath)}`}
        className="mt-3 flex h-10 items-center justify-center border border-white/14 bg-white/[0.05] text-[10px] font-black uppercase text-white/72 no-underline transition-colors hover:bg-white/[0.09] hover:text-white"
        style={{ borderRadius: 8, letterSpacing: '0.12em' }}
      >
        View Moment
      </a>
    </article>
  );
}

function AccountMomentDetailPage({ ownedMomentId }: { ownedMomentId: string }) {
  const user = getActiveUser();
  const [price, setPrice] = useState('18');
  const [flashMessage, setLocalFlashMessage] = useState<FlashMessageData | null>(() => consumeFlashMessage());

  if (!user) {
    return <AuthPage mode="login" />;
  }

  const inventory = ensureAccountInventoryFilled(user);
  const moment = inventory.moments.find((item) => item.id === ownedMomentId);

  if (!moment) {
    return <AccountDashboardPage />;
  }

  const listing = getListingForOwnedMoment(moment.id);
  const costLabel = getOwnedMomentCostLabel(moment);
  const marketMoment = getMarketMomentById(moment.sourceId);
  const marketListings = createVisibleMarketListings(marketMoment);
  const returnPath = getReturnPath('/account?tab=collection');
  const detailPath = getCurrentPathWithSearch();

  const listMoment = () => {
    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setLocalFlashMessage({ type: 'info', title: 'Price needed', detail: 'Enter a valid list price first.' });
      return;
    }

    const newListing = listOwnedMomentForSale(user, moment, parsedPrice);
    addActivity(inventory, {
      type: 'list_moment',
      label: 'Moment listed',
      detail: `${moment.title} listed for $${newListing.price.toFixed(2)}`,
      amount: newListing.price,
      accent: moment.accent,
    });
    saveInventory(inventory);
    trackEvent('moment_listed', {
      moment_id: moment.sourceId,
      price: newListing.price,
      rarity: moment.rarity,
    });
    setLocalFlashMessage({ type: 'success', title: 'Listed for sale', detail: `${moment.serial} is visible in the marketplace.` });
  };

  const cancelListing = () => {
    cancelOwnedMomentListing(moment.id);
    addActivity(inventory, {
      type: 'list_moment',
      label: 'Listing cancelled',
      detail: `${moment.title} returned to private locker`,
      accent: moment.accent,
    });
    saveInventory(inventory);
    trackEvent('moment_listing_cancelled', {
      moment_id: moment.sourceId,
      rarity: moment.rarity,
    });
    setLocalFlashMessage({ type: 'success', title: 'Listing cancelled', detail: `${moment.serial} is back in your private locker.` });
  };

  const copyMomentShare = () => {
    const marketUrl =
      typeof window === 'undefined'
        ? `/market/moment/${encodeURIComponent(moment.sourceId)}`
        : `${window.location.origin}/market/moment/${encodeURIComponent(moment.sourceId)}`;
    const shareText = `I pulled ${moment.rarity} ${moment.serial}: ${moment.title} by ${moment.creator} on GGBOX. ${marketUrl}`;

    void navigator.clipboard?.writeText(shareText).catch(() => undefined);
    trackEvent('moment_share_copied', {
      moment_id: moment.sourceId,
      rarity: moment.rarity,
    });
    setLocalFlashMessage({ type: 'success', title: 'Share text copied', detail: `${moment.serial} is ready to post.` });
  };

  const momentHistory = [
    {
      label: moment.acquisition === 'pack' ? 'Pulled from pack' : 'Bought on market',
      detail: moment.packTitle,
      date: moment.purchasedAt,
      amountLabel: moment.acquisition === 'pack' ? `$${getPackPriceByTitle(moment.packTitle).toFixed(0)} pack` : `$${moment.price.toFixed(2)}`,
    },
    ...(listing
      ? [
          {
            label: 'Listed for sale',
            detail: `${listing.serial} visible on Market`,
            date: listing.listedAt,
            amountLabel: `$${listing.price.toFixed(2)}`,
          },
        ]
      : []),
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AppAmbientBackdrop accent={moment.accent} />
      <MarketHeader active="account" />
      <section className="relative z-10 mx-auto max-w-[1560px] pb-20 pt-14">
        <a href={returnPath} className="inline-flex items-center gap-2 text-xs font-black uppercase text-white/70 no-underline" style={{ letterSpacing: '0.14em' }}>
          <ArrowLeft size={17} /> Back
        </a>
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="launch-panel overflow-hidden border border-white/12 bg-black/42" style={{ borderRadius: 8 }}>
            <ControlledMomentVideo moment={moment} />
            <div className="p-5">
              <div className="text-xs font-black uppercase" style={{ color: moment.accent, letterSpacing: '0.14em' }}>{moment.packTitle}</div>
              <h1 className="mt-3 text-[40px] font-black leading-none sm:text-[64px]">{moment.title}</h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {[moment.rarity, moment.serial, moment.category, moment.acquisition === 'pack' ? 'Pulled from pack' : 'Market buy'].map((label) => (
                  <span key={label} className="launch-chip border border-white/14 bg-white/[0.05] px-3 py-1.5 text-xs font-black uppercase text-white/72" style={{ borderRadius: 999, letterSpacing: '0.1em' }}>{label}</span>
                ))}
              </div>
            </div>
          </section>

          <aside className="grid h-fit gap-4">
            <section className="launch-panel border border-white/12 bg-black/42 p-5" style={{ borderRadius: 8 }}>
              <h2 className="text-2xl font-black">Ownership</h2>
              <div className="mt-4 flex items-center gap-3">
                <img src={moment.avatar} alt="" className="h-12 w-12 rounded-full object-cover object-top" />
                <div className="min-w-0">
                  <a href={`/creator/${encodeURIComponent(moment.handle.replace('@', ''))}`} className="font-black text-white no-underline hover:text-[#54b9ff]">{moment.creator}</a>
                  <div className="text-sm font-semibold text-white/44">{moment.handle}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
                  <div className="text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>{costLabel.label}</div>
                  <div className="mt-1 text-xl font-black">{costLabel.value}</div>
                </div>
                <div className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
                  <div className="text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>Status</div>
                  <div className="mt-1 text-xl font-black">{listing ? 'Listed' : 'Owned'}</div>
                </div>
              </div>
            </section>

            <section className="launch-panel border border-white/12 bg-black/42 p-5" style={{ borderRadius: 8 }}>
              <h2 className="text-2xl font-black">Sell Moment</h2>
              <label className="mt-4 grid gap-2">
                <span className="text-xs font-black uppercase text-white/52" style={{ letterSpacing: '0.12em' }}>List price USD</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.currentTarget.value)}
                  className="launch-field h-12 border border-white/14 bg-white/[0.06] px-4 text-white outline-none transition-colors focus:border-[#54b9ff]"
                  style={{ borderRadius: 8 }}
                  inputMode="decimal"
                />
              </label>
              <button type="button" onClick={listMoment} className="mt-4 flex h-12 w-full items-center justify-center gap-2 border border-[#54b9ff] bg-[#315eff] text-sm font-black uppercase transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110" style={{ borderRadius: 8, letterSpacing: '0.14em' }}>
                <Store size={17} /> {listing ? 'Update Listing' : 'List For Sale'}
              </button>
              <a
                href={`/market/moment/${encodeURIComponent(moment.sourceId)}?return=${encodeURIComponent(detailPath)}`}
                className="launch-field mt-3 flex h-11 w-full items-center justify-center gap-2 border border-white/14 bg-white/[0.04] text-xs font-black uppercase text-white/70 no-underline transition-colors hover:bg-white/[0.08] hover:text-white"
                style={{ borderRadius: 8, letterSpacing: '0.12em' }}
              >
                <ExternalLink size={15} /> View Market Listings
              </a>
              {listing ? (
                <button type="button" onClick={cancelListing} className="launch-field mt-3 flex h-11 w-full items-center justify-center border border-white/14 bg-white/[0.04] text-xs font-black uppercase text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white" style={{ borderRadius: 8, letterSpacing: '0.12em' }}>
                  Cancel Listing
                </button>
              ) : null}
              <div className="mt-4 grid gap-2">
                {marketListings.slice(0, 4).map((item) => (
                  <div key={`${item.seller}-${item.serial}-${item.price}`} className="flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-sm">
                    <span className="min-w-0 truncate font-semibold text-white/54">{item.seller} · {item.serial}</span>
                    <span className="shrink-0 font-black">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="launch-panel border border-white/12 bg-black/42 p-5" style={{ borderRadius: 8 }}>
              <h2 className="text-2xl font-black">Share Card</h2>
              <div
                className="mt-4 overflow-hidden border p-4"
                style={{
                  borderColor: `${moment.accent}66`,
                  borderRadius: 8,
                  background: `radial-gradient(circle at 78% 0%, ${moment.accent}33, transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                }}
              >
                <div className="text-[10px] font-black uppercase text-white/48" style={{ letterSpacing: '0.16em' }}>GGBOX Pull</div>
                <div className="mt-4 text-3xl font-black leading-tight">{moment.rarity}</div>
                <div className="mt-2 text-sm font-semibold text-white/62">{moment.serial} · {moment.creator}</div>
                <div className="moment-clamp-2 mt-4 min-h-[2.6rem] text-lg font-black leading-tight">{moment.title}</div>
              </div>
              <button type="button" onClick={copyMomentShare} className="launch-field mt-4 flex h-11 w-full items-center justify-center gap-2 border border-white/14 bg-white/[0.05] text-xs font-black uppercase text-white transition-colors hover:bg-white/[0.09]" style={{ borderRadius: 8, letterSpacing: '0.12em' }}>
                <Share2 size={16} /> Copy Share Text
              </button>
            </section>

            <section className="launch-panel border border-white/12 bg-black/42 p-5" style={{ borderRadius: 8 }}>
              <h2 className="text-2xl font-black">Trading History</h2>
              <div className="mt-4 grid gap-3">
                {momentHistory.map((event) => (
                  <div key={`${event.label}-${event.date}`} className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black">{event.label}</div>
                        <div className="mt-1 text-sm font-semibold text-white/46">{event.detail}</div>
                      </div>
                      <div className="shrink-0 text-sm font-black">{event.amountLabel}</div>
                    </div>
                    <div className="mt-2 text-[11px] font-black uppercase text-white/34" style={{ letterSpacing: '0.1em' }}>{formatActivityDate(event.date)}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
      {flashMessage ? <FlashToast message={flashMessage} onDismiss={() => setLocalFlashMessage(null)} /> : null}
    </main>
  );
}

function PublicProfilePage({ handle }: { handle: string }) {
  const [flashMessage, setLocalFlashMessage] = useState<FlashMessageData | null>(null);
  const normalizedHandle = handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
  const user = getStoredUsers().find((candidate) => candidate.handle.toLowerCase() === normalizedHandle) ?? getActiveUser();

  if (!user) {
    return <AuthPage mode="login" />;
  }

  const inventory = ensureAccountInventoryFilled(user);
  const profilePath = getCurrentPathWithSearch();
  const listedMoments = inventory.moments
    .map((moment) => ({ moment, listing: getListingForOwnedMoment(moment.id) }))
    .filter((item): item is { moment: OwnedMomentData; listing: NonNullable<ReturnType<typeof getListingForOwnedMoment>> } => Boolean(item.listing));
  const copyProfile = () => {
    const profileUrl = typeof window === 'undefined' ? `/u/${handle}` : window.location.href;
    void navigator.clipboard?.writeText(profileUrl).catch(() => undefined);
    trackEvent('profile_share_copied', { handle: user.handle });
    setLocalFlashMessage({ type: 'success', title: 'Profile link copied', detail: `${user.handle} is ready to share.` });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070b] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AppAmbientBackdrop />
      <MarketHeader active="account" />
      <section className="relative z-10 mx-auto max-w-[1500px] pb-20 pt-14">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit p-1">
            <AccountIdentityBlock user={user} joined={false} />
            <div className="mt-5">
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ['Moments', String(inventory.moments.length)],
                  ['Packs', String(inventory.packs.reduce((total, pack) => total + pack.quantity, 0))],
                ].map(([label, value]) => (
                  <div key={label} className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
                    <div className="text-lg font-black">{value}</div>
                    <div className="mt-1 text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase text-[#54b9ff]" style={{ letterSpacing: '0.16em' }}>Public Profile</div>
                <h2 className="mt-3 text-[54px] uppercase leading-none sm:text-[100px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>For Sale</h2>
              </div>
              <button type="button" onClick={copyProfile} className="launch-field flex h-12 items-center justify-center gap-2 border border-white/14 bg-white/[0.05] px-5 text-xs font-black uppercase text-white transition-colors hover:bg-white/[0.09]" style={{ borderRadius: 8, letterSpacing: '0.14em' }}>
                <Share2 size={17} /> Share Profile
              </button>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {listedMoments.map(({ moment, listing }) => (
                <PublicListedMomentCard key={moment.id} moment={moment} price={listing.price} returnPath={profilePath} />
              ))}
              {listedMoments.length === 0 ? (
                <div className="border border-dashed border-white/16 bg-white/[0.03] p-6 text-sm font-semibold text-white/54" style={{ borderRadius: 8 }}>
                  No moments listed for sale yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      {flashMessage ? <FlashToast message={flashMessage} onDismiss={() => setLocalFlashMessage(null)} /> : null}
    </main>
  );
}

function CreatorProfilePage({ handle }: { handle: string }) {
  const normalizedHandle = handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
  const moments = getMarketMomentItems().filter((moment) => moment.handle.toLowerCase() === normalizedHandle);
  const creator = moments[0];

  if (!creator) {
    return <MarketplacePage />;
  }

  const totalAsk = moments.reduce((total, moment) => total + getTopMarketAskPrice(moment), 0);
  const estimatedRoyalties = totalAsk * 0.1;
  const collectorReach = 900 + moments.length * 175;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03060a] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 18% 16%, ${creator.accent}24, transparent 28%), linear-gradient(135deg, #03060a 0%, #07111b 52%, #030406 100%)` }} />
      <div className="absolute inset-0 opacity-18" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
      <MarketHeader active="market" />
      <section className="relative z-10 mx-auto max-w-[1500px] pb-20 pt-14">
        <a href="/market" className="inline-flex items-center gap-2 text-xs font-black uppercase text-white/70 no-underline" style={{ letterSpacing: '0.14em' }}>
          <ArrowLeft size={17} /> Back to Market
        </a>
        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="launch-panel h-fit border border-white/12 bg-black/42 p-5" style={{ borderRadius: 8 }}>
            <img src={creator.avatar} alt="" className="h-28 w-28 rounded-full border border-white/18 object-cover object-top" />
            <h1 className="mt-5 text-4xl font-black">{creator.creator}</h1>
            <div className="mt-1 text-sm font-semibold" style={{ color: creator.accent }}>{creator.handle}</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
                <div className="text-2xl font-black">{moments.length}</div>
                <div className="mt-1 text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>Moments</div>
              </div>
              <div className="launch-tile border border-white/10 bg-white/[0.04] p-3" style={{ borderRadius: 8 }}>
                <div className="text-2xl font-black">${totalAsk.toFixed(0)}</div>
                <div className="mt-1 text-[10px] font-black uppercase text-white/38" style={{ letterSpacing: '0.1em' }}>Floor Sum</div>
              </div>
            </div>
            <div className="launch-panel-quiet mt-4 grid gap-3 border border-white/10 bg-white/[0.035] p-4" style={{ borderRadius: 8 }}>
              <div className="flex items-center gap-2" style={{ color: creator.accent }}>
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase text-white/48" style={{ letterSpacing: '0.12em' }}>Creator Economy</span>
              </div>
              {[
                ['Estimated Royalties', `$${estimatedRoyalties.toFixed(0)}`],
                ['Collector Reach', collectorReach.toLocaleString('en')],
                ['Active Listings', String(moments.reduce((total, moment) => total + createVisibleMarketListings(moment).length, 0))],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <span className="text-xs font-black uppercase text-white/42" style={{ letterSpacing: '0.1em' }}>{label}</span>
                  <span className="font-black">{value}</span>
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0">
            <div className="text-xs font-black uppercase" style={{ color: creator.accent, letterSpacing: '0.16em' }}>Creator Page</div>
            <h2 className="mt-3 text-[54px] uppercase leading-none sm:text-[96px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>Moments</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {moments.map((moment) => (
                <MarketMomentCard key={moment.id} moment={moment} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type LegalPageKey = 'terms' | 'privacy' | 'creator-rights' | 'support' | 'faq';

const LEGAL_PAGES: Record<LegalPageKey, { eyebrow: string; title: string; summary: string; sections: Array<{ title: string; body: string }> }> = {
  terms: {
    eyebrow: 'Legal',
    title: 'Terms Of Use',
    summary: 'The current GGBOX build is a launch-ready product demo for creator moments, pack opening, collection management, and marketplace flows.',
    sections: [
      {
        title: 'Collector accounts',
        body: 'Collectors can create an account, maintain a local locker, buy demo packs, open packs, list owned moments, and view public profiles. Production accounts require server-side identity, verification, and secure sessions before handling real money or personal data.',
      },
      {
        title: 'Marketplace activity',
        body: 'Marketplace prices, pack availability, collector listings, and creator economy numbers are product simulation data unless a production payment processor, database, and settlement system are connected.',
      },
      {
        title: 'Acceptable use',
        body: 'Users may not upload, import, publish, or sell creator content without the rights required by the creator, platform, and applicable law.',
      },
    ],
  },
  privacy: {
    eyebrow: 'Policy',
    title: 'Privacy Policy',
    summary: 'GGBOX minimizes data in this build. Local demo accounts are stored in the browser, and analytics events avoid passwords and raw email addresses.',
    sections: [
      {
        title: 'Local demo storage',
        body: 'The current static build stores demo users, inventory, listings, flash messages, and analytics events in browser localStorage. Clearing browser storage removes this data.',
      },
      {
        title: 'Analytics',
        body: 'Product analytics track events such as signup, login, purchases, pack opens, listings, and share actions. Events are stored locally and can optionally be sent to a configured analytics endpoint.',
      },
      {
        title: 'Production requirement',
        body: 'Before public launch with real users, GGBOX needs production privacy controls: server-side data storage, deletion requests, consent handling, secure auth, and documented subprocessors.',
      },
    ],
  },
  'creator-rights': {
    eyebrow: 'Creators',
    title: 'Creator Rights',
    summary: 'GGBOX should protect creator ownership and avoid turning public clips into marketplace assets without clear rights.',
    sections: [
      {
        title: 'Rights-first importing',
        body: 'Twitch and YouTube sources are treated as metadata or embeds unless the creator has authorized use. Local video processing is reserved for owner uploads and approved demo assets.',
      },
      {
        title: 'Credit and provenance',
        body: 'Every creator moment should include creator name, handle, source credit, rights status, pack origin, serial, and trading history.',
      },
      {
        title: 'Production controls',
        body: 'A real launch should include creator onboarding, rights review, takedown requests, royalty accounting, and an admin approval workflow protected outside the client bundle.',
      },
    ],
  },
  support: {
    eyebrow: 'Help',
    title: 'Support',
    summary: 'Use this page as the first support surface for collectors, creators, and launch QA.',
    sections: [
      {
        title: 'Collectors',
        body: 'If a pack, moment, listing, or profile looks wrong in this demo, refresh the page and check the Account activity feed. Demo data is stored locally in the browser.',
      },
      {
        title: 'Creators',
        body: 'Creators can request rights review, avatar updates, source corrections, and removal of any content that should not appear in GGBOX.',
      },
      {
        title: 'Launch QA',
        body: 'Before production, test signup, login, pack purchase, pack opening, moment purchase, listing, cancellation, public profile, creator profile, admin import, and mobile layout.',
      },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'FAQ',
    summary: 'Core answers for the current GGBOX demo: packs, moments, balance, listings, public profiles, and video previews.',
    sections: [
      {
        title: 'What is GGBOX?',
        body: 'GGBOX is a collector marketplace demo for creator moments. Users can buy sealed packs, open them, collect video moments, list moments for sale, and view public collector profiles.',
      },
      {
        title: 'How does Balance work?',
        body: 'Every demo account starts with a $500 balance. Buying a pack or moment subtracts the purchase price from the balance. When another collector buys your listed moment, the sale price is added back to your balance.',
      },
      {
        title: 'What is inside a pack?',
        body: 'Each drop pack reveals three creator moments. After opening a pack, the revealed moments stay available on the pack-opening screen so you can inspect one moment and return to the other pulls.',
      },
      {
        title: 'How are market listing prices ordered?',
        body: 'Lower serial numbers are treated as more valuable, so smaller serials receive higher prices. Listing views prioritize the best serials first, while your own listing is marked and cannot be purchased by you.',
      },
      {
        title: 'What does a public profile show?',
        body: 'A public collector profile shows the collector identity, collection counts, and moments currently listed for sale. Visitors can preview videos on hover and buy listed moments through the market flow.',
      },
      {
        title: 'Is this using real payments or NFTs?',
        body: 'No. This build is a local product demo using browser storage and simulated balances/listings. A production launch would need server-side accounts, payment processing, custody rules, and rights verification.',
      },
    ],
  },
};

function LegalPage({ page }: { page: LegalPageKey }) {
  const content = LEGAL_PAGES[page];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04070b] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 16%, rgba(84,185,255,0.20), transparent 26%), radial-gradient(circle at 88% 10%, rgba(140,255,47,0.12), transparent 24%), linear-gradient(135deg, #04070b 0%, #07121b 52%, #030406 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-18"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <MarketHeader active="account" />
      <section className="relative z-10 mx-auto max-w-5xl pb-20 pt-14">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase text-white/70 no-underline" style={{ letterSpacing: '0.14em' }}>
          <ArrowLeft size={17} /> Back to GGBOX
        </a>
        <div className="mt-10">
          <div className="text-xs font-black uppercase text-[#54b9ff]" style={{ letterSpacing: '0.18em' }}>{content.eyebrow}</div>
          <h1 className="mt-4 text-[54px] uppercase leading-none sm:text-[104px]" style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0' }}>{content.title}</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/60">{content.summary}</p>
        </div>
        <div className="mt-8 grid gap-4">
          {content.sections.map((section) => (
            <section key={section.title} className="launch-panel border border-white/12 bg-black/36 p-5" style={{ borderRadius: 8 }}>
              <h2 className="m-0 text-2xl font-black text-white">{section.title}</h2>
              <p className="m-0 mt-3 text-base font-semibold leading-7 text-white/56">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function AdminGate({ route }: { route: CreatorMomentImporterRoute }) {
  const configuredKey = (import.meta.env.VITE_GGBOX_ADMIN_KEY as string | undefined) || 'GGBOX2026';
  const [enteredKey, setEnteredKey] = useState('');
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('ggbox.admin.unlocked') === configuredKey;
  });
  const [error, setError] = useState('');

  const submitAdminKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (enteredKey.trim() !== configuredKey) {
      setError('Wrong admin key.');
      trackEvent('admin_gate_failed', { route });
      return;
    }

    window.localStorage.setItem('ggbox.admin.unlocked', configuredKey);
    trackEvent('admin_gate_unlocked', { route });
    setUnlocked(true);
  };

  if (unlocked) {
    return <CreatorMomentImporterApp route={route} />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03060a] px-4 py-6 text-white sm:px-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 18% 16%, rgba(84,185,255,0.22), transparent 28%), linear-gradient(135deg, #03060a 0%, #07111b 54%, #030406 100%)' }} />
      <form onSubmit={submitAdminKey} className="launch-panel relative z-10 w-full max-w-md border border-white/14 bg-black/58 p-5 shadow-[0_0_70px_rgba(84,185,255,0.14)]" style={{ borderRadius: 8 }}>
        <div className="inline-flex items-center gap-2 border border-[#54b9ff]/38 bg-[#54b9ff]/10 px-4 py-2 text-xs font-black uppercase text-[#54b9ff]" style={{ borderRadius: 999, letterSpacing: '0.14em' }}>
          <ShieldCheck size={16} /> Admin
        </div>
        <h1 className="mt-5 text-3xl font-black">Creator Import Access</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/54">
          Enter the admin launch key to use importer and review tools.
        </p>
        <label className="mt-5 grid gap-2">
          <span className="text-xs font-black uppercase text-white/68" style={{ letterSpacing: '0.12em' }}>Admin key</span>
          <input
            value={enteredKey}
            onChange={(event) => setEnteredKey(event.currentTarget.value)}
            className="launch-field h-12 border border-white/14 bg-white/[0.06] px-4 text-white outline-none transition-colors focus:border-[#54b9ff]"
            style={{ borderRadius: 8 }}
            type="password"
          />
        </label>
        {error ? <div className="mt-3 text-sm font-semibold text-[#ff8a9a]">{error}</div> : null}
        <button type="submit" className="mt-5 flex h-12 w-full items-center justify-center border border-[#54b9ff] bg-[#315eff] text-sm font-black uppercase text-white" style={{ borderRadius: 8, letterSpacing: '0.14em', boxShadow: BUY_BUTTON_SHADOW }}>
          Unlock Admin
        </button>
      </form>
    </main>
  );
}

function SiteFooter() {
  return (
    <footer
      id="contacts"
      className="relative overflow-hidden border-t border-white/10 bg-[#070b10] px-4 py-10 text-white sm:px-8 sm:py-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 12% 16%, rgba(84,185,255,0.12), transparent 28%), radial-gradient(circle at 88% 0%, rgba(145,70,255,0.11), transparent 24%), linear-gradient(180deg, #0a0f16 0%, #06090e 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: grainSvg,
          backgroundSize: '200px 200px',
          maskImage: 'linear-gradient(to bottom, black, transparent 92%)',
        }}
      />
      <div className="relative mx-auto max-w-[1760px]">
        <div className="grid items-start gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-[minmax(270px,1.15fr)_repeat(4,minmax(120px,0.58fr))]">
          <div className="min-w-0 lg:pr-8">
            <div
              className="text-[31px] font-black uppercase leading-none text-white sm:text-[34px]"
              style={{
                fontFamily: "'Anton', sans-serif",
                letterSpacing: '0',
                textShadow: '0 0 28px rgba(84,185,255,0.20)',
              }}
            >
              GGBOX
            </div>
            <p className="mt-4 whitespace-nowrap text-[12px] font-semibold normal-case text-white/58">
              © 2026 GGBOX all rights reserved.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="min-w-0">
              <h3
                className="mb-4 text-[10px] font-black uppercase text-white/88"
                style={{ letterSpacing: '0.14em' }}
              >
                {column.title}
              </h3>
              <div className="grid gap-3">
                {column.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="inline-flex w-fit items-center text-sm font-semibold leading-none text-white/64 no-underline transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const currentPath = typeof window === 'undefined' ? '/' : window.location.pathname;
  const currentPackId = getPackIdFromPath(currentPath);
  const currentMarketPackId = getMarketPackIdFromPath(currentPath);
  const currentMarketMomentId = getMarketMomentIdFromPath(currentPath);
  const currentOpenPackId = getOpenPackIdFromPath(currentPath);
  const currentOwnedMomentId = getOwnedMomentIdFromPath(currentPath);
  const currentPublicHandle = getPublicHandleFromPath(currentPath);
  const currentCreatorHandle = getCreatorHandleFromPath(currentPath);
  const legalPage = currentPath.slice(1) as LegalPageKey;

  useEffect(() => {
    trackEvent('page_viewed', { path: currentPath });
  }, [currentPath]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;

    const targetId = window.location.hash.slice(1);
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    }, 80);
  }, [currentPath]);

  if (
    currentPath === '/admin/import-ready-clips' ||
    currentPath === '/admin/investor-demo' ||
    currentPath === '/admin/auto-populate' ||
    currentPath === '/admin/creators/import' ||
    currentPath === '/admin/creators' ||
    currentPath === '/admin/moments/import' ||
    currentPath === '/admin/moments/review'
  ) {
    return <AdminGate route={currentPath as CreatorMomentImporterRoute} />;
  }

  if (legalPage in LEGAL_PAGES) {
    return <LegalPage page={legalPage} />;
  }

  if (currentPath === '/login') {
    return <AuthPage mode="login" />;
  }

  if (currentPath === '/register') {
    return <AuthPage mode="register" />;
  }

  if (currentPath === '/forgot-password') {
    return <AuthPage mode="forgot" />;
  }

  if (currentPath === '/account') {
    return <AccountDashboardPage />;
  }

  if (currentOpenPackId) {
    return <AccountPackOpeningPage packId={currentOpenPackId} />;
  }

  if (currentOwnedMomentId) {
    return <AccountMomentDetailPage ownedMomentId={currentOwnedMomentId} />;
  }

  if (currentPublicHandle) {
    return <PublicProfilePage handle={currentPublicHandle} />;
  }

  if (currentCreatorHandle) {
    return <CreatorProfilePage handle={currentCreatorHandle} />;
  }

  if (currentPackId) {
    return <MarketPackPurchasePage packId={currentPackId} />;
  }

  if (currentPath === '/market') {
    return <MarketplacePage />;
  }

  if (currentMarketPackId) {
    return <MarketPackPurchasePage packId={currentMarketPackId} />;
  }

  if (currentMarketMomentId) {
    return <MarketMomentPurchasePage momentId={currentMarketMomentId} />;
  }

  return (
    <>
      <ToonhubHero />
      <DropPackSection />
      <MomentsCarouselSection />
      <SiteFooter />
    </>
  );
}

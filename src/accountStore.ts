export type AuthProvider = 'email' | 'google' | 'discord';

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  provider: AuthProvider;
  joinedAt: string;
  demoPassword?: string;
};

export type OwnedMomentData = {
  id: string;
  sourceId: string;
  title: string;
  creator: string;
  handle: string;
  avatar: string;
  rarity: string;
  category: string;
  serial: string;
  price: number;
  purchasedAt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  accent: string;
  packTitle: string;
  acquisition: 'market' | 'pack';
};

export type OwnedPackData = {
  id: string;
  packId: string;
  title: string;
  image: string;
  accent: string;
  quantity: number;
  price: number;
  purchasedAt: string;
  lastUpdatedAt: string;
};

export type ActivityData = {
  id: string;
  type: 'registration' | 'purchase_moment' | 'purchase_pack' | 'open_pack' | 'list_moment' | 'sell_moment';
  label: string;
  detail: string;
  amount?: number;
  createdAt: string;
  accent?: string;
};

export type UserMomentListingData = {
  id: string;
  userId: string;
  ownedMomentId: string;
  sourceId: string;
  title: string;
  sellerHandle: string;
  sellerAvatar: string;
  serial: string;
  price: number;
  accent: string;
  listedAt: string;
  status: 'active' | 'cancelled' | 'sold';
  soldAt?: string;
  buyerId?: string;
};

export type FlashMessageData = {
  type: 'success' | 'info';
  title: string;
  detail: string;
};

export type AccountInventory = {
  userId: string;
  balance: number;
  moments: OwnedMomentData[];
  packs: OwnedPackData[];
  activities: ActivityData[];
};

const USERS_KEY = 'ggbox.auth.users';
const SESSION_KEY = 'ggbox.auth.session';
const LISTINGS_KEY = 'ggbox.market.userListings';
const FLASH_KEY = 'ggbox.flash';
const INVENTORY_KEY_PREFIX = 'ggbox.account.inventory.';
const STARTING_BALANCE = 500;

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getStoredUsers() {
  return readJson<StoredUser[]>(USERS_KEY, []);
}

function saveStoredUsers(users: StoredUser[]) {
  writeJson(USERS_KEY, users);
}

export function getActiveUser() {
  const userId = readJson<string | null>(SESSION_KEY, null);
  if (!userId) {
    return null;
  }

  return getStoredUsers().find((user) => user.id === userId) ?? null;
}

export function setActiveUser(user: StoredUser) {
  writeJson(SESSION_KEY, user.id);
}

export function logoutUser() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

function createUserAvatar(name: string, provider: AuthProvider) {
  const displayName = name.trim() || 'GGBOX Collector';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const [start, end] =
    provider === 'google'
      ? ['#54b9ff', '#8cff2f']
      : provider === 'discord'
        ? ['#9146ff', '#54b9ff']
        : ['#315eff', '#ff5aa2'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><text x="48" y="57" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="white">${initials || 'GG'}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createHandle(name: string, email: string) {
  const source = name.trim() || email.split('@')[0] || 'collector';
  return `@${source.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'collector'}`;
}

export function registerUser(name: string, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = getStoredUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('User already exists');
  }

  const user: StoredUser = {
    id: createId('user'),
    name: name.trim(),
    email: normalizedEmail,
    handle: createHandle(name, normalizedEmail),
    avatar: createUserAvatar(name, 'email'),
    provider: 'email',
    joinedAt: new Date().toISOString(),
    demoPassword: password,
  };

  saveStoredUsers([user, ...users]);
  setActiveUser(user);
  seedInventory(user);
  return user;
}

export function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = getStoredUsers().find((candidate) => candidate.email === normalizedEmail);

  if (!user || user.demoPassword !== password) {
    throw new Error('Invalid credentials');
  }

  setActiveUser(user);
  return user;
}

export function signInWithDemoProvider(provider: Exclude<AuthProvider, 'email'>) {
  const demoEmail = provider === 'google' ? 'collector.google@ggbox.local' : 'collector.discord@ggbox.local';
  const existing = getStoredUsers().find((user) => user.email === demoEmail);

  if (existing) {
    setActiveUser(existing);
    return existing;
  }

  const name = provider === 'google' ? 'Google Collector' : 'Discord Collector';
  const user: StoredUser = {
    id: createId('user'),
    name,
    email: demoEmail,
    handle: createHandle(name, demoEmail),
    avatar: createUserAvatar(name, provider),
    provider,
    joinedAt: new Date().toISOString(),
  };

  saveStoredUsers([user, ...getStoredUsers()]);
  setActiveUser(user);
  seedInventory(user);
  return user;
}

function createEmptyInventory(userId: string): AccountInventory {
  return {
    userId,
    balance: STARTING_BALANCE,
    moments: [],
    packs: [],
    activities: [],
  };
}

function seedInventory(user: StoredUser) {
  const inventory = createEmptyInventory(user.id);
  inventory.activities.push({
    id: createId('activity'),
    type: 'registration',
    label: 'Account created',
    detail: `${user.name} joined GGBOX`,
    createdAt: user.joinedAt,
    accent: '#54b9ff',
  });
  saveInventory(inventory);
}

export function getInventory(userId: string) {
  const inventory = readJson<AccountInventory>(`${INVENTORY_KEY_PREFIX}${userId}`, createEmptyInventory(userId));

  if (!Number.isFinite(inventory.balance)) {
    inventory.balance = STARTING_BALANCE;
  }

  return inventory;
}

export function saveInventory(inventory: AccountInventory) {
  writeJson(`${INVENTORY_KEY_PREFIX}${inventory.userId}`, inventory);
}

export function getUserMomentListings() {
  return readJson<UserMomentListingData[]>(LISTINGS_KEY, []);
}

function saveUserMomentListings(listings: UserMomentListingData[]) {
  writeJson(LISTINGS_KEY, listings);
}

export function getActiveUserListingForMoment(sourceId: string) {
  return getUserMomentListings().filter((listing) => listing.sourceId === sourceId && listing.status === 'active');
}

export function getListingForOwnedMoment(ownedMomentId: string) {
  return getUserMomentListings().find((listing) => listing.ownedMomentId === ownedMomentId && listing.status === 'active') ?? null;
}

export function listOwnedMomentForSale(user: StoredUser, moment: OwnedMomentData, price: number) {
  const listings = getUserMomentListings();
  const existing = listings.find((listing) => listing.ownedMomentId === moment.id && listing.status === 'active');
  const safePrice = Math.max(1, Math.round(price * 100) / 100);

  if (existing) {
    existing.price = safePrice;
    existing.listedAt = new Date().toISOString();
    saveUserMomentListings(listings);
    return existing;
  }

  const listing: UserMomentListingData = {
    id: createId('listing'),
    userId: user.id,
    ownedMomentId: moment.id,
    sourceId: moment.sourceId,
    title: moment.title,
    sellerHandle: user.handle,
    sellerAvatar: user.avatar,
    serial: moment.serial,
    price: safePrice,
    accent: moment.accent,
    listedAt: new Date().toISOString(),
    status: 'active',
  };

  saveUserMomentListings([listing, ...listings]);
  return listing;
}

export function cancelOwnedMomentListing(ownedMomentId: string) {
  const listings = getUserMomentListings();
  const listing = listings.find((item) => item.ownedMomentId === ownedMomentId && item.status === 'active');

  if (!listing) {
    return null;
  }

  listing.status = 'cancelled';
  saveUserMomentListings(listings);
  return listing;
}

export function purchaseListedMoment(buyer: StoredUser, listingId: string) {
  const listings = getUserMomentListings();
  const listing = listings.find((item) => item.id === listingId && item.status === 'active');

  if (!listing || listing.userId === buyer.id) {
    return null;
  }

  const sellerInventory = getInventory(listing.userId);
  const sellerMomentIndex = sellerInventory.moments.findIndex((moment) => moment.id === listing.ownedMomentId);

  if (sellerMomentIndex === -1) {
    listing.status = 'cancelled';
    saveUserMomentListings(listings);
    return null;
  }

  const [soldMoment] = sellerInventory.moments.splice(sellerMomentIndex, 1);
  const buyerInventory = getInventory(buyer.id);

  if (buyerInventory.balance < listing.price) {
    return null;
  }

  const purchasedMoment: OwnedMomentData = {
    ...soldMoment,
    id: createId('moment'),
    price: listing.price,
    purchasedAt: new Date().toISOString(),
    acquisition: 'market',
  };

  buyerInventory.moments = [purchasedMoment, ...buyerInventory.moments];
  buyerInventory.balance = Math.max(0, Math.round((buyerInventory.balance - listing.price) * 100) / 100);
  sellerInventory.balance = Math.round((sellerInventory.balance + listing.price) * 100) / 100;
  listing.status = 'sold';
  listing.soldAt = new Date().toISOString();
  listing.buyerId = buyer.id;

  addActivity(buyerInventory, {
    type: 'purchase_moment',
    label: 'Moment purchased',
    detail: `${purchasedMoment.title} from ${listing.sellerHandle}`,
    amount: listing.price,
    accent: listing.accent,
  });
  addActivity(sellerInventory, {
    type: 'sell_moment',
    label: 'Moment sold',
    detail: `${soldMoment.title} sold to ${buyer.handle}`,
    amount: listing.price,
    accent: listing.accent,
  });

  saveInventory(sellerInventory);
  saveInventory(buyerInventory);
  saveUserMomentListings(listings);

  return { moment: purchasedMoment, listing };
}

export function setFlashMessage(message: FlashMessageData) {
  writeJson(FLASH_KEY, message);
}

export function consumeFlashMessage() {
  const message = readJson<FlashMessageData | null>(FLASH_KEY, null);

  if (canUseStorage()) {
    window.localStorage.removeItem(FLASH_KEY);
  }

  return message;
}

export function addActivity(inventory: AccountInventory, activity: Omit<ActivityData, 'id' | 'createdAt'>) {
  inventory.activities = [
    {
      id: createId('activity'),
      createdAt: new Date().toISOString(),
      ...activity,
    },
    ...inventory.activities,
  ].slice(0, 24);
}

export function addOwnedMoment(inventory: AccountInventory, moment: Omit<OwnedMomentData, 'id' | 'purchasedAt'>) {
  const ownedMoment: OwnedMomentData = {
    id: createId('moment'),
    purchasedAt: new Date().toISOString(),
    ...moment,
  };

  inventory.moments = [ownedMoment, ...inventory.moments];
  return ownedMoment;
}

export function upsertOwnedPack(inventory: AccountInventory, pack: Omit<OwnedPackData, 'id' | 'purchasedAt' | 'lastUpdatedAt'>) {
  const now = new Date().toISOString();
  const existing = inventory.packs.find((item) => item.packId === pack.packId);

  if (existing) {
    existing.quantity += pack.quantity;
    existing.lastUpdatedAt = now;
    return existing;
  }

  const ownedPack: OwnedPackData = {
    id: createId('pack'),
    purchasedAt: now,
    lastUpdatedAt: now,
    ...pack,
  };

  inventory.packs = [ownedPack, ...inventory.packs];
  return ownedPack;
}

export function decrementOwnedPack(inventory: AccountInventory, packId: string) {
  const ownedPack = inventory.packs.find((pack) => pack.packId === packId);

  if (!ownedPack || ownedPack.quantity <= 0) {
    return false;
  }

  ownedPack.quantity -= 1;
  ownedPack.lastUpdatedAt = new Date().toISOString();
  inventory.packs = inventory.packs.filter((pack) => pack.quantity > 0);
  return true;
}

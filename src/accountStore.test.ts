import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addOwnedMoment,
  getActiveUser,
  getInventory,
  getListingForOwnedMoment,
  getUserMomentListings,
  listOwnedMomentForSale,
  loginUser,
  purchaseListedMoment,
  registerUser,
  saveInventory,
} from './accountStore';

function installLocalStorageMock() {
  const values = new Map<string, string>();

  vi.stubGlobal('window', {
    localStorage: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
}

describe('Account store launch flows', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('registers, stores the active user, and logs in with demo credentials', () => {
    const user = registerUser('Launch Collector', 'Launch@GGBOX.local', 'launchpass');

    expect(user.email).toBe('launch@ggbox.local');
    expect(user.handle).toBe('@launchcollector');
    expect(getActiveUser()?.id).toBe(user.id);
    expect(loginUser('launch@ggbox.local', 'launchpass').id).toBe(user.id);
  });

  it('lists a moment and transfers it to a second collector when purchased', () => {
    const seller = registerUser('Seller One', 'seller@ggbox.local', 'sellerpass');
    const sellerInventory = getInventory(seller.id);
    const ownedMoment = addOwnedMoment(sellerInventory, {
      sourceId: 'moment_launch_test',
      title: 'Launch test highlight',
      creator: 'Creator One',
      handle: '@creatorone',
      avatar: '/streamer-avatars/faith.png',
      rarity: 'Legendary',
      category: 'IRL',
      serial: '#01/50',
      price: 6,
      videoUrl: '/demo-vods/1.mp4',
      accent: '#54b9ff',
      packTitle: 'IRL Moments Pack',
      acquisition: 'pack',
    });
    saveInventory(sellerInventory);

    const listing = listOwnedMomentForSale(seller, ownedMoment, 22);
    expect(getListingForOwnedMoment(ownedMoment.id)?.id).toBe(listing.id);

    const buyer = registerUser('Buyer Two', 'buyer@ggbox.local', 'buyerpass');
    const purchase = purchaseListedMoment(buyer, listing.id);

    expect(purchase?.moment.title).toBe('Launch test highlight');
    expect(purchase?.moment.price).toBe(22);
    expect(getInventory(seller.id).moments).toHaveLength(0);
    expect(getInventory(buyer.id).moments).toHaveLength(1);
    expect(getInventory(seller.id).balance).toBe(522);
    expect(getInventory(buyer.id).balance).toBe(478);
    expect(getUserMomentListings().find((item) => item.id === listing.id)?.status).toBe('sold');
  });
});

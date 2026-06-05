const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type',
  },
  body: JSON.stringify(body),
});

const normalizeTwitchThumbnail = (url) => url.replace(/%{width}/g, '640').replace(/%{height}/g, '360');

const getEmbedUrl = (clipId, parent) => {
  const params = new URLSearchParams({ clip: clipId, parent: parent || 'localhost', autoplay: 'false' });
  return `https://clips.twitch.tv/embed?${params.toString()}`;
};

const fetchJson = async (url, init) => {
  const response = await fetch(url, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(body.message || body.error_description || body.error || `${response.status} ${response.statusText}`);
  }
  return body;
};

const getAppAccessToken = async () => {
  const clientId = process.env.TWITCH_CLIENT_ID || process.env.VITE_TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing TWITCH_CLIENT_ID/VITE_TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET.');
  }

  const tokenUrl = new URL('https://id.twitch.tv/oauth2/token');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('grant_type', 'client_credentials');
  const token = await fetchJson(tokenUrl.toString(), { method: 'POST' });
  return { clientId, accessToken: token.access_token };
};

const getHeaders = async () => {
  const { clientId, accessToken } = await getAppAccessToken();
  return {
    'Client-ID': clientId,
    Authorization: `Bearer ${accessToken}`,
  };
};

const getUsers = async (handles, headers) => {
  const usersUrl = `https://api.twitch.tv/helix/users?${handles.map((handle) => `login=${encodeURIComponent(handle)}`).join('&')}`;
  const users = await fetchJson(usersUrl, { headers });
  return users.data || [];
};

const getClips = async (broadcasterId, limit, headers) => {
  const clipsUrl = new URL('https://api.twitch.tv/helix/clips');
  clipsUrl.searchParams.set('broadcaster_id', broadcasterId);
  clipsUrl.searchParams.set('first', String(limit));
  clipsUrl.searchParams.set('started_at', new Date(Date.now() - 30 * 86400000).toISOString());
  const clips = await fetchJson(clipsUrl.toString(), { headers });
  return clips.data || [];
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  try {
    const params = event.queryStringParameters || {};
    const parent = params.parent || event.headers.host?.split(':')[0] || 'localhost';
    const headers = await getHeaders();

    if (params.test === '1') {
      const handle = (params.handle || 'kirovfps').replace(/^@/, '').trim();
      const limit = Math.max(1, Math.min(20, Number(params.limit || 5)));
      const [user] = await getUsers([handle], headers);
      if (!user) {
        return json(404, {
          ok: false,
          credentialsDetected: true,
          providerMode: 'real_twitch',
          status: `No Twitch user found for ${handle}.`,
          clips: [],
        });
      }

      const clips = await getClips(user.id, limit, headers);
      return json(200, {
        ok: true,
        credentialsDetected: true,
        providerMode: 'real_twitch',
        status: `Fetched ${clips.length} Twitch clips.`,
        creator: user,
        clips: clips.map((clip) => ({
          id: clip.id,
          title: clip.title,
          url: clip.url,
          embed_url: getEmbedUrl(clip.id, parent),
          thumbnail_url: normalizeTwitchThumbnail(clip.thumbnail_url),
          view_count: clip.view_count,
          duration: clip.duration,
        })),
      });
    }

    const handles = (params.handles || 'kirovfps,danicore,verapulse')
      .split(',')
      .map((handle) => handle.replace(/^@/, '').trim())
      .filter(Boolean);
    const momentsPerCreator = Math.max(1, Math.min(20, Number(params.momentsPerCreator || 2)));
    const users = await getUsers(handles, headers);
    const seeds = await Promise.all(
      users.map(async (user) => {
        const clips = await getClips(user.id, momentsPerCreator, headers);
        return {
          platform: 'twitch',
          handle: user.login,
          displayName: user.display_name,
          avatarUrl: user.profile_image_url,
          channelUrl: `https://www.twitch.tv/${user.login}`,
          sourceCredit: `${user.display_name} on Twitch`,
          clips: clips.map((clip) => ({
            id: clip.id,
            title: clip.title,
            thumbnailUrl: normalizeTwitchThumbnail(clip.thumbnail_url),
            duration: clip.duration,
            viewCount: clip.view_count,
            daysOld: Math.max(0, Math.round((Date.now() - new Date(clip.created_at).getTime()) / 86400000)),
            sourceUrl: clip.url,
            embedUrl: getEmbedUrl(clip.id, parent),
            externalClipId: clip.id,
            contentOrigin: 'real_twitch',
          })),
        };
      }),
    );

    return json(200, seeds.filter((seed) => seed.clips.length > 0));
  } catch (error) {
    return json(500, {
      ok: false,
      credentialsDetected: Boolean(process.env.TWITCH_CLIENT_SECRET),
      providerMode: 'fallback',
      status: 'error',
      fallbackReason: error instanceof Error ? error.message : 'Twitch provider failed.',
      clips: [],
    });
  }
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const name = typeof payload.name === 'string' ? payload.name : '';

    if (!name || name.length > 80) {
      return json(400, { ok: false, message: 'Invalid analytics event.' });
    }

    console.log(
      JSON.stringify({
        type: 'ggbox_analytics_event',
        name,
        path: payload.path,
        createdAt: payload.createdAt,
        properties: payload.properties ?? {},
      }),
    );

    return json(202, { ok: true });
  } catch (error) {
    return json(400, {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to parse analytics event.',
    });
  }
};

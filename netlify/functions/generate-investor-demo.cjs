const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async () => {
  const localDev = process.env.NETLIFY_DEV === 'true' || process.env.CONTEXT === 'dev';
  if (!localDev && process.env.ALLOW_INVESTOR_DEMO_GENERATE !== 'true') {
    return json(403, {
      ok: false,
      message: 'Investor demo generation is only enabled in local Netlify dev or with ALLOW_INVESTOR_DEMO_GENERATE=true.',
    });
  }

  const cwd = resolve(__dirname, '../..');
  const result = spawnSync('node', ['scripts/generate-investor-demo-clips.mjs'], {
    cwd,
    encoding: 'utf8',
  });

  return json(result.status === 0 ? 200 : 500, {
    ok: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
  });
};

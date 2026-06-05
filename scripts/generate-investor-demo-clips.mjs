import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'public/demo-vods/index.mp4');
const outputDir = resolve(root, 'public/generated-clips');
const metadataPath = resolve(outputDir, 'investor-demo-moments.json');

const clips = [
  {
    id: 'investor-demo-01',
    start: '00:03',
    duration: 8,
    title: 'Chat reacts to cozy stream moment',
    rarity: 'Epic',
    score: 87,
  },
  {
    id: 'investor-demo-02',
    start: '00:14',
    duration: 9,
    title: 'Creator highlight with live chat',
    rarity: 'Rare',
    score: 78,
  },
  {
    id: 'investor-demo-03',
    start: '00:27',
    duration: 9,
    title: 'Final reaction before the cut',
    rarity: 'Legendary',
    score: 92,
  },
];

const run = (command, args, label) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}.`);
  }
};

const ensureFfmpeg = () => {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    throw new Error('FFmpeg is required. Install FFmpeg or add it to PATH.');
  }
};

const ensureInput = () => {
  mkdirSync(dirname(inputPath), { recursive: true });
  if (!existsSync(inputPath)) {
    throw new Error('Missing investor demo VOD: add index.mp4 to public/demo-vods/index.mp4');
  }
};

const posterStart = (start) => {
  const [minutes, seconds] = start.split(':').map(Number);
  return `00:${String(minutes).padStart(2, '0')}:${String(seconds + 1).padStart(2, '0')}`;
};

try {
  ensureInput();
  ensureFfmpeg();
  mkdirSync(outputDir, { recursive: true });

  const metadata = {
    mode: 'Investor Demo',
    rights: 'Authorized sample',
    source_vod: '/demo-vods/index.mp4',
    generated_at: new Date().toISOString(),
    creator: {
      name: 'GGBOX Demo Creator',
      handle: '@ggboxdemo',
      avatar_url: '/assets/characters/creator-cream.png',
    },
    clips: [],
  };

  for (const clip of clips) {
    const videoFile = `${clip.id}.mp4`;
    const posterFile = `${clip.id}.jpg`;
    const videoPath = resolve(outputDir, videoFile);
    const posterPath = resolve(outputDir, posterFile);

    console.log(`Generating ${clip.id}: ${clip.start} + ${clip.duration}s -> ${videoFile}`);
    run(
      'ffmpeg',
      [
        '-y',
        '-ss',
        clip.start,
        '-t',
        String(clip.duration),
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        videoPath,
      ],
      `Video generation for ${clip.id}`,
    );

    console.log(`Generating poster for ${clip.id} -> ${posterFile}`);
    run(
      'ffmpeg',
      ['-y', '-ss', posterStart(clip.start), '-i', inputPath, '-frames:v', '1', '-q:v', '3', posterPath],
      `Poster generation for ${clip.id}`,
    );

    metadata.clips.push({
      id: clip.id,
      title: clip.title,
      rarity: clip.rarity,
      score: clip.score,
      start: clip.start,
      duration: clip.duration,
      video_url: `/generated-clips/${videoFile}`,
      thumbnail_url: `/generated-clips/${posterFile}`,
      source_credit: 'Authorized investor demo sample',
      rights_status: 'demo_authorized',
    });
  }

  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`Generated metadata -> ${metadataPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

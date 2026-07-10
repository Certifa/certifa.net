import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';

// One OG card per writeup, keyed by slug -> /og/<slug>.png
const entries = await getCollection('writeups');
const pages = Object.fromEntries(entries.map((e) => [e.slug, e.data]));

// Optional box avatar per writeup: public/og-avatars/<box>.png (slug minus "htb-").
// Present -> shown at the top of the card. Missing -> text-only card, no error.
const avatarFor = (slug: string): string | undefined => {
  const p = `./public/og-avatars/${slug.replace(/^htb-/, '')}.png`;
  return existsSync(p) ? p : undefined;
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (path, page) => ({
    title: page.title,
    description: `${page.platform} · ${page.difficulty} · certifa.net`,
    ...(avatarFor(path) ? { logo: { path: avatarFor(path)!, size: [120] as [number] } } : {}),
    bgGradient: [[17, 17, 17], [10, 10, 10]],
    border: { color: [83, 177, 255], width: 12, side: 'inline-start' },
    padding: 72,
    font: {
      title: {
        color: [237, 237, 237],
        size: 82,
        weight: 'Bold',
        lineHeight: 1.05,
        families: ['Bricolage Grotesque'],
      },
      description: {
        color: [160, 160, 160],
        size: 30,
        lineHeight: 1.35,
        families: ['JetBrains Mono'],
      },
    },
    fonts: [
      './src/assets/og-fonts/bricolage-700.ttf',
      './src/assets/og-fonts/jetbrains-400.ttf',
    ],
  }),
});

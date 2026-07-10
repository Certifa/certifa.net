import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// One OG card per writeup, served at /og/<slug>.png.
// Rendered directly with CanvasKit so the avatar can sit beside the title
// (astro-og-canvas only stacks the logo above the text).

const entries = await getCollection('writeups');

export function getStaticPaths() {
  return entries.map((e) => ({
    params: { route: `${e.slug}.png` },
    props: { slug: e.slug, data: e.data },
  }));
}

const W = 1200;
const H = 630;
const PAD = 72;
const AVATAR = 190;
const GAP = 44;
const ACCENT: [number, number, number] = [83, 177, 255];

// Lazily initialise CanvasKit + fonts once, reused across every image.
let _ck: any;
let _fontMgr: any;
async function getCanvas() {
  if (_ck) return { CanvasKit: _ck, fontMgr: _fontMgr };
  const require = createRequire(import.meta.url);
  const CanvasKitInit = require('canvaskit-wasm/bin/canvaskit.js');
  const ckDir = path.dirname(require.resolve('canvaskit-wasm/bin/canvaskit.js'));
  _ck = await CanvasKitInit({ locateFile: (f: string) => path.join(ckDir, f) });
  const [bricolage, jetbrains] = await Promise.all([
    readFile(path.resolve('src/assets/og-fonts/bricolage-700.ttf')),
    readFile(path.resolve('src/assets/og-fonts/jetbrains-400.ttf')),
  ]);
  _fontMgr = _ck.FontMgr.FromData(bricolage, jetbrains);
  return { CanvasKit: _ck, fontMgr: _fontMgr };
}

export const GET: APIRoute = async ({ props }) => {
  const { slug, data } = props as { slug: string; data: any };
  const { CanvasKit, fontMgr } = await getCanvas();

  const surface = CanvasKit.MakeSurface(W, H);
  const canvas = surface.getCanvas();

  // Background gradient.
  const bg = new CanvasKit.Paint();
  bg.setShader(
    CanvasKit.Shader.MakeLinearGradient(
      [0, 0], [0, H],
      [CanvasKit.Color(17, 17, 17), CanvasKit.Color(10, 10, 10)],
      null, CanvasKit.TileMode.Clamp,
    ),
  );
  canvas.drawRect(CanvasKit.XYWHRect(0, 0, W, H), bg);
  bg.delete();

  // Left accent bar.
  const bar = new CanvasKit.Paint();
  bar.setColor(CanvasKit.Color(...ACCENT));
  canvas.drawRect(CanvasKit.XYWHRect(0, 0, 12, H), bar);
  bar.delete();

  // Avatar (left), if present.
  let textX = PAD;
  const avatarPath = `public/og-avatars/${slug.replace(/^htb-/, '')}.png`;
  if (existsSync(avatarPath)) {
    const img = CanvasKit.MakeImageFromEncoded(await readFile(avatarPath));
    if (img) {
      const ay = (H - AVATAR) / 2;
      const ip = new CanvasKit.Paint();
      ip.setAntiAlias(true);
      canvas.drawImageRectOptions(
        img,
        CanvasKit.XYWHRect(0, 0, img.width(), img.height()),
        CanvasKit.XYWHRect(PAD, ay, AVATAR, AVATAR),
        CanvasKit.FilterMode.Linear, CanvasKit.MipmapMode.None, ip,
      );
      ip.delete();
      img.delete();
      textX = PAD + AVATAR + GAP;
    }
  }

  // Title + meta, vertically centred as one group to the right of the avatar.
  const textWidth = W - textX - PAD;
  const para = (text: string, color: number[], size: number, family: string, weight: string, lh: number) => {
    const style = new CanvasKit.ParagraphStyle({
      textStyle: {
        color: CanvasKit.Color(color[0], color[1], color[2]),
        fontFamilies: [family],
        fontSize: size,
        fontStyle: { weight: CanvasKit.FontWeight[weight] },
        heightMultiplier: lh,
      },
      textAlign: CanvasKit.TextAlign.Left,
    });
    const builder = CanvasKit.ParagraphBuilder.Make(style, fontMgr);
    builder.addText(text);
    const p = builder.build();
    p.layout(textWidth);
    builder.delete();
    return p;
  };

  const title = para(data.title, [237, 237, 237], 78, 'Bricolage Grotesque', 'Bold', 1.05);
  const meta = para(`${data.platform} · ${data.difficulty} · certifa.net`, [160, 160, 160], 30, 'JetBrains Mono', 'Normal', 1.3);

  const groupGap = 22;
  const totalH = title.getHeight() + groupGap + meta.getHeight();
  const top = (H - totalH) / 2;
  canvas.drawParagraph(title, textX, top);
  canvas.drawParagraph(meta, textX, top + title.getHeight() + groupGap);
  title.delete();
  meta.delete();

  const snapshot = surface.makeImageSnapshot();
  const png = snapshot.encodeToBytes();
  snapshot.delete();
  surface.delete();

  return new Response(Buffer.from(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};

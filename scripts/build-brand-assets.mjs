/**
 * Rasterizes assets/brand/*.svg into every PNG the native build needs.
 *
 * Run with `npm run brand`. `sharp` is a devDependency and is never imported by the app, so none
 * of this reaches the bundle.
 *
 * Why a script rather than ad-hoc CLI calls: each output has its own size, its own coverage, and
 * its own alpha rule (icon.png must carry NO alpha at all, or Apple rejects the build). Encoding
 * those once means re-running after a change is a single command and cannot drift.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND_DIR = path.join(PROJECT_ROOT, 'assets', 'brand');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'assets', 'images');
const PREVIEW_DIR = path.join(BRAND_DIR, 'preview');

// Mirrored by hand from src/styles/colors.ts. This is a plain Node ESM script and cannot import a
// TypeScript module without a build step, so these are duplicated deliberately - keep them in sync
// if the palette changes.
const MARK_GREEN = '#32af6e'; // palettes.dark.primary
const DARK_BACKGROUND = '#0d1210'; // palettes.dark.background
const LIGHT_BACKGROUND = '#eceeed'; // palettes.light.background - the light splash backdrop

// Mirrored by hand from app.json's expo-splash-screen `imageWidth`, for the same reason as the
// colours above. Keep the two in sync: this is what the splash PREVIEW is drawn at, so if it
// overstates the real value the preview stops catching the clipping it exists to catch. The value
// is load-bearing - Android shows only the inner 2/3 of the 288dp splash canvas (a 192dp circle),
// and a diagonal mark reaches its bounding-box corners, so 140 keeps the plates inside the mask.
const SPLASH_IMAGE_WIDTH_DP = 140;

// The sentinel colour both source SVGs are authored against. See the comment at the top of
// mark.svg for why it is magenta rather than the real hex.
const INK_SLOT = '#ff00ff';

// Android derives both the themed-icon tile and the status-bar glyph from the ALPHA CHANNEL alone
// and applies its own tint, so the fill is discarded - but it must be opaque, or the glyph is
// empty. An accidentally opaque *background* is the classic failure here: it renders as a solid
// coloured square.
const ALPHA_ONLY_INK = '#ffffff';

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// The pixel size every source is rasterized at before any resizing, chosen so each later step is a
// downscale - upscaling a raster would soften the edges.
//
// Deliberately NOT sharp's `density` option. Density is DPI applied to the SVG's own intrinsic
// width/height, so one fixed value produces wildly different results across sources: our 24-unit
// mark and 512-unit barbell differ by more than 20x, which at a shared density rendered the mark
// BELOW 1024 (soft, upscaled) while the barbell exceeded sharp's ~268MP input limit outright.
// Overriding the size attributes instead makes the raster resolution independent of how the source
// happens to be authored.
const RASTER_SIZE = 2048;

/**
 * Android adaptive-icon geometry, as fractions of the 108dp layer that `foregroundImage` supplies:
 * the launcher only ever shows the central 72dp, and recommends keeping art inside 66dp.
 * Everything outside is either cropped or at the mercy of the device's mask shape.
 */
const ADAPTIVE_VISIBLE = 72 / 108;
const ADAPTIVE_SAFE = 66 / 108;

/**
 * The mark is a DIAGONAL dumbbell, which is the worst case for a circular mask: its extreme points
 * are the corners of its bounding box, not the midpoints of its edges. A bounding box of side S has
 * a half-diagonal of S/2 * sqrt(2), and that is what must fit inside the safe radius - so the box
 * itself has to be a good deal smaller than the safe circle's diameter.
 *
 * Works out at ~0.43, versus the ~0.62 a shape with its mass near the middle could afford.
 */
const DIAGONAL_SAFE_COVERAGE = ADAPTIVE_SAFE / Math.SQRT2;

function applyInk(svgText, colour) {
  return svgText.replaceAll(INK_SLOT, colour);
}

/**
 * Rewrites the root <svg> element's width/height to a fixed pixel size, leaving its viewBox alone
 * so the drawing simply scales to fill. This is what makes the raster resolution the same for every
 * source regardless of the units it was authored in.
 */
function setSvgSize(svgText, pixels) {
  const openTagEnd = svgText.indexOf('>', svgText.indexOf('<svg'));
  const openTag = svgText
    .slice(0, openTagEnd + 1)
    .replace(/\swidth="[^"]*"/, '')
    .replace(/\sheight="[^"]*"/, '')
    .replace('<svg', `<svg width="${pixels}" height="${pixels}"`);
  return openTag + svgText.slice(openTagEnd + 1);
}

/**
 * The shared pipeline every output runs through.
 *
 * `fill` is the one per-output knob: the fraction of the target square the artwork covers. Trimming
 * to the art's true bounding box first is what makes it meaningful - the source can be authored at
 * whatever proportions, and each consumer still gets exactly the coverage it needs.
 */
async function renderArt({ svgText, size, fill, background = null }) {
  let pipeline = sharp(Buffer.from(setSvgSize(svgText, RASTER_SIZE))).trim();

  const inner = Math.round(size * fill);
  pipeline = pipeline.resize(inner, inner, { fit: 'contain', background: TRANSPARENT });

  if (inner < size) {
    const leading = Math.round((size - inner) / 2);
    const trailing = size - inner - leading;
    pipeline = pipeline.extend({
      top: leading,
      bottom: trailing,
      left: leading,
      right: trailing,
      background: TRANSPARENT,
    });
  }

  // flatten() merges the alpha into the background AND drops the channel, which is what makes
  // icon.png acceptable to Apple. Only the opaque outputs pass a background.
  if (background) pipeline = pipeline.flatten({ background });

  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * What a launcher actually puts on the home screen.
 *
 * Note this CROPS to the central 66.7% before masking, rather than masking the whole image. That
 * distinction matters: the outer third of `foregroundImage` is never visible on any device, so a
 * preview that masks the full canvas flatters the art and hides exactly the clipping this is
 * meant to catch.
 */
async function buildTilePreview(foreground, sourceSize, outputSize) {
  const visible = Math.round(sourceSize * ADAPTIVE_VISIBLE);
  const offset = Math.round((sourceSize - visible) / 2);

  const cropped = await sharp(foreground)
    .extract({ left: offset, top: offset, width: visible, height: visible })
    .resize(outputSize, outputSize)
    .png()
    .toBuffer();

  const composited = await sharp({
    create: { width: outputSize, height: outputSize, channels: 4, background: DARK_BACKGROUND },
  })
    .composite([{ input: cropped }])
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}">` +
      `<circle cx="${outputSize / 2}" cy="${outputSize / 2}" r="${outputSize / 2}" fill="#fff"/></svg>`,
  );
  return sharp(composited).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

/**
 * The notification glyph rendered at its true 24dp and then magnified with nearest-neighbour, so
 * the actual pixels are visible. Scaling it up smoothly would hide the very thing being checked -
 * whether the shape still holds together at the size Android draws it.
 */
async function buildNotificationPreview(glyphSvgText) {
  const TRUE_SIZE = 24;
  const MAGNIFIED = 192;

  const glyph = await renderArt({ svgText: glyphSvgText, size: TRUE_SIZE, fill: 0.85 });
  const tinted = await sharp({
    create: { width: TRUE_SIZE, height: TRUE_SIZE, channels: 4, background: MARK_GREEN },
  })
    .composite([{ input: glyph, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const composed = await sharp({
    create: { width: TRUE_SIZE, height: TRUE_SIZE, channels: 4, background: '#0a0c0b' },
  })
    .composite([{ input: tinted }])
    .png()
    .toBuffer();

  // Magnified in a SEPARATE pass, not chained onto the composite above. sharp applies its
  // operations in a fixed pipeline order regardless of the order they are called in, and resize
  // runs BEFORE composite - so chaining would enlarge the empty base canvas first and then drop
  // the still-24px glyph into the middle of it.
  return sharp(composed).resize(MAGNIFIED, MAGNIFIED, { kernel: 'nearest' }).png().toBuffer();
}

/**
 * The launch screen as expo-splash-screen composes it: the mark drawn at imageWidth
 * (SPLASH_IMAGE_WIDTH_DP), centred on a flat background colour.
 *
 * Rendered for BOTH backgrounds because one image has to serve both. The light variant is the
 * demanding one - #32af6e on #eceeed is only about 2.2:1, far and away the lowest-contrast pairing
 * anywhere in the brand, whereas the same green on #0d1210 is comfortable.
 */
async function buildSplashPreview(svgText, backgroundColour) {
  const CANVAS = 440; // roughly a phone's width in dp, so the mark reads at its true relative size

  const art = await renderArt({ svgText, size: SPLASH_IMAGE_WIDTH_DP, fill: 0.9 });
  const offset = Math.round((CANVAS - SPLASH_IMAGE_WIDTH_DP) / 2);

  return sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: backgroundColour },
  })
    .composite([{ input: art, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true });
  await mkdir(PREVIEW_DIR, { recursive: true });

  const markSvg = await readFile(path.join(BRAND_DIR, 'mark.svg'), 'utf8');
  const notificationSvg = await readFile(path.join(BRAND_DIR, 'notification.svg'), 'utf8');

  const colourMark = applyInk(markSvg, MARK_GREEN);
  const alphaMark = applyInk(markSvg, ALPHA_ONLY_INK);
  const alphaGlyph = applyInk(notificationSvg, ALPHA_ONLY_INK);

  const outputs = [
    // iOS home screen (every size is derived from this one) plus the Android legacy fallback. iOS
    // shows the whole square behind its own rounded mask, so the mark can be drawn generously.
    { file: 'icon.png', svgText: colourMark, size: 1024, fill: 0.72, background: DARK_BACKGROUND },
    // Adaptive icon top layer - constrained by the safe zone and the diagonal geometry above.
    { file: 'android-icon-foreground.png', svgText: colourMark, size: 1024, fill: DIAGONAL_SAFE_COVERAGE },
    // Android 13+ themed icons. The launcher discards the background layer and recolours this one
    // from the wallpaper, so only its alpha matters. Same masking, same coverage.
    { file: 'android-icon-monochrome.png', svgText: alphaMark, size: 1024, fill: DIAGONAL_SAFE_COVERAGE },
    // Status-bar glyph - a DIFFERENT, chunkier source. See the comment in notification.svg.
    { file: 'notification-icon.png', svgText: alphaGlyph, size: 96, fill: 0.85 },
    // Drawn at SPLASH_IMAGE_WIDTH_DP by expo-splash-screen on a flat background, with no mask, so
    // the art can fill most of this asset - the on-device size is set by imageWidth, not by here.
    { file: 'splash-icon.png', svgText: colourMark, size: 1024, fill: 0.9 },
    { file: 'favicon.png', svgText: colourMark, size: 48, fill: 0.78, background: DARK_BACKGROUND },
  ];

  for (const output of outputs) {
    await writeFile(path.join(IMAGES_DIR, output.file), await renderArt(output));
    console.log(`  assets/images/${output.file}  ${output.size}px`);
  }

  const foreground = await renderArt({
    svgText: colourMark,
    size: 1024,
    fill: DIAGONAL_SAFE_COVERAGE,
  });
  await writeFile(path.join(PREVIEW_DIR, 'tile.png'), await buildTilePreview(foreground, 1024, 256));
  await writeFile(
    path.join(PREVIEW_DIR, 'notification-24.png'),
    await buildNotificationPreview(alphaGlyph),
  );

  await writeFile(
    path.join(PREVIEW_DIR, 'splash-light.png'),
    await buildSplashPreview(colourMark, LIGHT_BACKGROUND),
  );
  await writeFile(
    path.join(PREVIEW_DIR, 'splash-dark.png'),
    await buildSplashPreview(colourMark, DARK_BACKGROUND),
  );

  console.log('  assets/brand/preview/tile.png');
  console.log('  assets/brand/preview/notification-24.png');
  console.log('  assets/brand/preview/splash-light.png');
  console.log('  assets/brand/preview/splash-dark.png');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

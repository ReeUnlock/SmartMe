#!/usr/bin/env node
/**
 * Icon generation script for SmartMe.
 *
 * Prerequisites:
 *   npm install -D sharp
 *
 * Usage:
 *   node scripts/generate-icons.mjs [source.png]
 *
 * If no source is given, it expects a 1024x1024 PNG at:
 *   public/icons/icon-source-1024.png
 *
 * Generates all icons needed for:
 *   - PWA manifest (192, 512, maskable variants)
 *   - Apple touch icon (180)
 *   - Favicons (16, 32)
 *   - Android adaptive icon (432 foreground)
 *   - iOS app icon (1024)
 */

import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, "../public/icons");
const DEFAULT_SOURCE = resolve(ICONS_DIR, "icon-source-1024.png");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("sharp is not installed. Run: npm install -D sharp");
    process.exit(1);
  }

  const source = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SOURCE;

  if (!existsSync(source)) {
    console.error(`Source icon not found: ${source}`);
    console.error("Provide a 1024x1024 PNG icon as the source.");
    process.exit(1);
  }

  const sizes = [
    // PWA manifest
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-maskable-192.png", size: 192, maskable: true },
    { name: "icon-maskable-512.png", size: 512, maskable: true },
    // Apple
    { name: "apple-touch-icon.png", size: 180 },
    // Favicons
    { name: "favicon-16.png", size: 16 },
    { name: "favicon-32.png", size: 32 },
    // Native app stores (source resolution)
    { name: "icon-1024.png", size: 1024 },
  ];

  for (const { name, size, maskable } of sizes) {
    const output = resolve(ICONS_DIR, name);

    if (maskable) {
      // Maskable: add 10% padding on safe zone (icon within 80% circle)
      const padding = Math.round(size * 0.1);
      const innerSize = size - padding * 2;
      const inner = await sharp(source).resize(innerSize, innerSize).toBuffer();
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 244, g: 160, b: 181, alpha: 1 }, // #F4A0B5
        },
      })
        .composite([{ input: inner, left: padding, top: padding }])
        .png()
        .toFile(output);
    } else {
      await sharp(source).resize(size, size).png().toFile(output);
    }
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  console.log("\nAll icons generated in public/icons/");
  console.log(
    "For Android/iOS native icons, run: npx capacitor-assets generate"
  );
}

main();

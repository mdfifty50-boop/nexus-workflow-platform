/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icons from the base SVG.
 * Run with: node scripts/generate-pwa-icons.js
 *
 * Dependencies: sharp (npm install sharp --save-dev)
 *
 * Generated icons:
 * - icon-72x72.png through icon-512x512.png (standard PWA icons)
 * - icon-maskable-192x192.png, icon-maskable-512x512.png (maskable icons with safe zone)
 * - badge-72x72.png (notification badge)
 * - shortcut-*.png (shortcut icons)
 * - splash screens for iOS devices
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'splash-640x1136' },
  { width: 750, height: 1334, name: 'splash-750x1334' },
  { width: 1242, height: 2208, name: 'splash-1242x2208' },
  { width: 1125, height: 2436, name: 'splash-1125x2436' },
  { width: 1170, height: 2532, name: 'splash-1170x2532' },
  { width: 1284, height: 2778, name: 'splash-1284x2778' },
];

async function generateIcons() {
  // Check if sharp is available
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('Sharp not installed. Installing...');
    console.log('Run: npm install sharp --save-dev');
    console.log('Then run this script again.');

    // Create placeholder PNG files using inline SVG data
    console.log('\nGenerating placeholder icons using inline SVG...');
    await generatePlaceholderIcons();
    return;
  }

  const iconsDir = path.join(__dirname, '../public/icons');
  const svgPath = path.join(iconsDir, 'icon.svg');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG source not found at:', svgPath);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // Generate standard icons
  for (const size of ICON_SIZES) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate maskable icons (with padding for safe zone)
  for (const size of [192, 512]) {
    const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
    const padding = Math.floor(size * 0.1); // 10% safe zone
    const innerSize = size - (padding * 2);

    await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-maskable-${size}x${size}.png`);
  }

  // Generate badge icon
  const badgePath = path.join(iconsDir, 'badge-72x72.png');
  await sharp(svgBuffer)
    .resize(72, 72)
    .png()
    .toFile(badgePath);
  console.log('Generated: badge-72x72.png');

  // Generate shortcut icons
  const shortcuts = ['create', 'dashboard', 'templates'];
  for (const shortcut of shortcuts) {
    const outputPath = path.join(iconsDir, `shortcut-${shortcut}.png`);
    await sharp(svgBuffer)
      .resize(96, 96)
      .png()
      .toFile(outputPath);
    console.log(`Generated: shortcut-${shortcut}.png`);
  }

  // Generate splash screens
  for (const splash of SPLASH_SIZES) {
    const outputPath = path.join(iconsDir, `${splash.name}.png`);
    const iconSize = Math.min(splash.width, splash.height) * 0.3;

    // Create splash screen with centered icon
    const background = await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    }).png().toBuffer();

    const icon = await sharp(svgBuffer)
      .resize(Math.floor(iconSize), Math.floor(iconSize))
      .png()
      .toBuffer();

    await sharp(background)
      .composite([{
        input: icon,
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${splash.name}.png`);
  }

  console.log('\nAll PWA icons generated successfully!');
}

async function generatePlaceholderIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');

  // Create a simple 1x1 pixel PNG as placeholder
  // This is a minimal valid PNG file
  const createPlaceholderPNG = (width, height) => {
    // Minimal PNG header for a solid color image
    // In production, these would be generated from the SVG
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xd7, 0x63, 0x08, 0x15, 0x12, 0x00, // compressed data
      0x00, 0x02, 0x5b, 0x01, 0x38, 0x00, 0x00, 0x00, // CRC
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, // IEND chunk
      0x82
    ]);
  };

  // Generate placeholder files
  for (const size of ICON_SIZES) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(outputPath, createPlaceholderPNG(size, size));
    console.log(`Created placeholder: icon-${size}x${size}.png`);
  }

  // Maskable icons
  for (const size of [192, 512]) {
    const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
    fs.writeFileSync(outputPath, createPlaceholderPNG(size, size));
    console.log(`Created placeholder: icon-maskable-${size}x${size}.png`);
  }

  // Badge
  fs.writeFileSync(path.join(iconsDir, 'badge-72x72.png'), createPlaceholderPNG(72, 72));
  console.log('Created placeholder: badge-72x72.png');

  // Shortcuts
  for (const shortcut of ['create', 'dashboard', 'templates']) {
    fs.writeFileSync(path.join(iconsDir, `shortcut-${shortcut}.png`), createPlaceholderPNG(96, 96));
    console.log(`Created placeholder: shortcut-${shortcut}.png`);
  }

  // Splash screens
  for (const splash of SPLASH_SIZES) {
    fs.writeFileSync(path.join(iconsDir, `${splash.name}.png`), createPlaceholderPNG(splash.width, splash.height));
    console.log(`Created placeholder: ${splash.name}.png`);
  }

  console.log('\nPlaceholder icons created.');
  console.log('For production-quality icons, install sharp and run again:');
  console.log('  npm install sharp --save-dev');
  console.log('  node scripts/generate-pwa-icons.js');
}

generateIcons().catch(console.error);

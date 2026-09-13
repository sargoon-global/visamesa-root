#!/usr/bin/env node
/**
 * Generates iOS AppIcon and Android mipmap launcher icons from the brand mark.
 *
 * The mark SVG is wide (~530×344). App icons must be square with a solid background;
 * naively resizing the wide PNG to a square distorts/crops the mark and transparency
 * shows as black (iOS) or white (Android) behind the icon.
 */
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const feNodeModules = path.join(rootDir, '../visamesa_fe/node_modules')
const require = createRequire(path.join(feNodeModules, 'sharp/package.json'))
const sharp = require('sharp')

const logoPng = path.join(rootDir, 'apps/mobile/assets/brand/logo.png')
const iosIconDir = path.join(
  rootDir,
  'apps/mobile/ios/VisaMesa/Images.xcassets/AppIcon.appiconset',
)

/** Opaque launcher background — matches app surface / Android default icon plate. */
const APP_ICON_BACKGROUND = '#FFFFFF'

/** Padding on each edge so the mark survives iOS squircle and Android round masks. */
const APP_ICON_PADDING_RATIO = 0.1

const IOS_ICONS = [
  { filename: 'Icon-20@2x.png', size: 40 },
  { filename: 'Icon-20@3x.png', size: 60 },
  { filename: 'Icon-29@2x.png', size: 58 },
  { filename: 'Icon-29@3x.png', size: 87 },
  { filename: 'Icon-40@2x.png', size: 80 },
  { filename: 'Icon-40@3x.png', size: 120 },
  { filename: 'Icon-60@2x.png', size: 120 },
  { filename: 'Icon-60@3x.png', size: 180 },
  { filename: 'Icon-1024.png', size: 1024 },
]

const ANDROID_ICONS = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
]

/**
 * Places the brand mark on a square canvas with padding and an opaque background.
 */
async function composeSquareAppIcon(source, target, size) {
  const innerSize = Math.max(1, Math.round(size * (1 - APP_ICON_PADDING_RATIO * 2)))

  const mark = await sharp(source)
    .resize(innerSize, innerSize, {
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()

  const { width = innerSize, height = innerSize } = await sharp(mark).metadata()
  const left = Math.round((size - width) / 2)
  const top = Math.round((size - height) / 2)

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: APP_ICON_BACKGROUND,
    },
  })
    .composite([{ input: mark, left, top }])
    .png()
    .toFile(target)
}

async function generateIosIcons() {
  mkdirSync(iosIconDir, { recursive: true })

  for (const icon of IOS_ICONS) {
    await composeSquareAppIcon(logoPng, path.join(iosIconDir, icon.filename), icon.size)
  }

  const contents = {
    images: [
      { size: '20x20', idiom: 'iphone', filename: 'Icon-20@2x.png', scale: '2x' },
      { size: '20x20', idiom: 'iphone', filename: 'Icon-20@3x.png', scale: '3x' },
      { size: '29x29', idiom: 'iphone', filename: 'Icon-29@2x.png', scale: '2x' },
      { size: '29x29', idiom: 'iphone', filename: 'Icon-29@3x.png', scale: '3x' },
      { size: '40x40', idiom: 'iphone', filename: 'Icon-40@2x.png', scale: '2x' },
      { size: '40x40', idiom: 'iphone', filename: 'Icon-40@3x.png', scale: '3x' },
      { size: '60x60', idiom: 'iphone', filename: 'Icon-60@2x.png', scale: '2x' },
      { size: '60x60', idiom: 'iphone', filename: 'Icon-60@3x.png', scale: '3x' },
      { size: '1024x1024', idiom: 'ios-marketing', filename: 'Icon-1024.png', scale: '1x' },
    ],
    info: { version: 1, author: 'xcode' },
  }

  writeFileSync(path.join(iosIconDir, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`)
}

async function generateAndroidIcons() {
  const androidRes = path.join(rootDir, 'apps/mobile/android/app/src/main/res')

  for (const icon of ANDROID_ICONS) {
    const dir = path.join(androidRes, icon.folder)
    mkdirSync(dir, { recursive: true })
    await composeSquareAppIcon(logoPng, path.join(dir, 'ic_launcher.png'), icon.size)
    await composeSquareAppIcon(logoPng, path.join(dir, 'ic_launcher_round.png'), icon.size)
  }
}

async function main() {
  const iosIconSet = path.join(rootDir, 'apps/mobile/ios/VisaMesa/Images.xcassets/AppIcon.appiconset')
  const androidRes = path.join(rootDir, 'apps/mobile/android/app/src/main/res')

  if (!existsSync(iosIconSet) && !existsSync(androidRes)) {
    console.info('Mobile native projects not present; skipping launcher icon generation.')
    return
  }

  if (!existsSync(logoPng)) {
    throw new Error(`Missing ${logoPng}. Run sync-brand-assets to export from logo.svg.`)
  }

  if (existsSync(iosIconSet)) {
    await generateIosIcons()
  }

  if (existsSync(androidRes)) {
    await generateAndroidIcons()
  }

  console.info('Generated iOS AppIcon and Android launcher mipmaps.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

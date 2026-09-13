#!/usr/bin/env node
/**
 * Syncs shared/brand sources to visamesa_fe/public and mobile PNG assets.
 * Run from visamesa-root: node scripts/sync-brand-assets.mjs
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const brandDir = path.join(rootDir, 'shared/brand')
const fePublicDir = path.join(rootDir, '../visamesa_fe/public')
const feBrandDir = path.join(fePublicDir, 'brand')
const mobileBrandDir = path.join(rootDir, 'apps/mobile/assets/brand')
const logoSource = path.join(brandDir, 'logo.svg')
const logotypeSource = path.join(brandDir, 'logotype.svg')

function copyBrandSvgs() {
  mkdirSync(feBrandDir, { recursive: true })
  for (const name of ['logo.svg', 'logotype.svg', 'logo-lockup.svg']) {
    cpSync(path.join(brandDir, name), path.join(feBrandDir, name))
  }
  cpSync(logoSource, path.join(fePublicDir, 'favicon.svg'))
}

function exportPng(fromSvg, toPng, width) {
  execSync(
    `npx --yes @resvg/resvg-js-cli --fit-width ${width} "${fromSvg}" "${toPng}"`,
    { stdio: 'inherit', cwd: rootDir },
  )
}

function exportMobileAndTouchIcons() {
  mkdirSync(mobileBrandDir, { recursive: true })
  exportPng(logoSource, path.join(mobileBrandDir, 'logo.png'), 1024)
  exportPng(logotypeSource, path.join(mobileBrandDir, 'logotype.png'), 522)
  exportPng(logoSource, path.join(fePublicDir, 'apple-touch-icon.png'), 180)
}

function generateAppIcons() {
  execSync('node scripts/generate-app-icons.mjs', {
    stdio: 'inherit',
    cwd: rootDir,
  })
}

function main() {
  if (!existsSync(logoSource)) {
    console.warn(`Brand source ${logoSource} not found; using committed public assets.`)
    return
  }

  copyBrandSvgs()
  exportMobileAndTouchIcons()
  generateAppIcons()
  console.info('Brand assets synced to visamesa_fe/public and apps/mobile.')
}

try {
  main()
} catch (error) {
  console.error(error)
  process.exit(1)
}

const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {resolve: metroResolve} = require('metro-resolver');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const designTokensRoot = path.resolve(monorepoRoot, 'shared/design-tokens');
const contentRoot = path.resolve(monorepoRoot, 'shared/content');
const typesRoot = path.resolve(monorepoRoot, 'shared/types');

/**
 * Metro must watch shared packages linked via file: dependencies.
 * Subpath exports (@visamesa/content/legal) are mapped in babel.config.js.
 */
const sharedPackageRoots = [contentRoot, typesRoot, designTokensRoot];

/** Map Node ESM `.js` specifiers to on-disk `.ts` sources in shared packages. */
function resolveSharedTypeScriptJsExtension(context, moduleName, platform) {
  if (!moduleName.startsWith('.') || !moduleName.endsWith('.js')) {
    return null;
  }

  const originDir = path.dirname(context.originModulePath);
  if (!sharedPackageRoots.some(root => originDir.startsWith(root))) {
    return null;
  }

  const withoutJs = moduleName.slice(0, -3);
  for (const ext of ['.ts', '.tsx', '.js']) {
    const candidate = path.resolve(originDir, `${withoutJs}${ext}`);
    if (fs.existsSync(candidate)) {
      return metroResolve(context, `${withoutJs}${ext}`, platform);
    }
  }

  return null;
}

const config = {
  watchFolders: [designTokensRoot, contentRoot, typesRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      i18next: path.resolve(projectRoot, 'node_modules/i18next'),
      'react-i18next': path.resolve(projectRoot, 'node_modules/react-i18next'),
      react: path.resolve(projectRoot, 'node_modules/react'),
    },
    unstable_enablePackageExports: true,
    resolveRequest: (context, moduleName, platform) => {
      const sharedResolution = resolveSharedTypeScriptJsExtension(
        context,
        moduleName,
        platform,
      );
      if (sharedResolution) {
        return sharedResolution;
      }

      return metroResolve(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

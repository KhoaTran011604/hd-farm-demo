const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Map explicit `.js` imports (required by NodeNext in @hd-farm/shared) to `.ts`/`.tsx` sources.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (moduleName.endsWith('.js') && (moduleName.startsWith('./') || moduleName.startsWith('../'))) {
    for (const ext of ['.ts', '.tsx']) {
      try {
        return resolve(context, moduleName.replace(/\.js$/, ext), platform);
      } catch {}
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
